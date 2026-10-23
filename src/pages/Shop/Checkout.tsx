import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { orderApi } from '../../lib/api/orderApi';
import { loadRazorpayScript } from '../../lib/razorpay';
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  User,
  MapPin,
  Lock,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const { items, subtotal, shippingCharge, totalAmount, clearCart } = useCart();

  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      navigate('/admin#products', { replace: true });
      return;
    }
    if (user?.phone) {
      setContactPhone(user.phone);
    }
  }, [user, navigate]);

  // If cart is empty, redirect to store
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xs border border-gray-100">
          <ShoppingBag className="w-12 h-12 text-jadmaa-red mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-xs text-gray-500 mb-6">
            Please add some products to your cart before proceeding to checkout.
          </p>
          <Link
            to="/products"
            className="px-5 py-2.5 bg-jadmaa-red hover:bg-red-700 text-white text-xs font-bold rounded-xl transition inline-block"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // If user is not logged in, prompt to log in and return
  if (!authLoading && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xs border border-gray-100 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-jadmaa-red rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-jadmaa-charcoal">
            Login Required for Checkout
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Please sign in to your JADMAA student or member account. We will automatically use your verified account credentials to prepare your order.
          </p>
          <div className="pt-2">
            <Link
              to="/login?redirect=/checkout"
              className="w-full py-3.5 px-6 bg-jadmaa-red hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Login to Continue</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!shippingAddress.trim() || shippingAddress.trim().length < 5) {
      setErrorMsg('Please enter a complete delivery address.');
      return;
    }

    const cleanPincode = shippingPincode.trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      setErrorMsg('Please enter a valid 6-digit postal pincode.');
      return;
    }

    const cleanPhone = contactPhone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit delivery contact number.');
      return;
    }

    try {
      setIsProcessing(true);

      // 1. Load Razorpay SDK
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Razorpay payment gateway failed to load. Please check your internet connection.');
      }

      // 2. Create authoritative order on backend
      const orderPayload = {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        shippingAddress: shippingAddress.trim(),
        shippingPincode: cleanPincode,
        customerPhone: cleanPhone,
        notes: deliveryNotes.trim() || undefined,
      };

      const res = await orderApi.checkout(orderPayload);
      if (!res.success || !res.data) {
        throw new Error((res as any)?.error?.message || 'Failed to initialize order');
      }

      const { razorpayOrderId, keyId, orderNumber, customer } = res.data;

      // 3. Launch Razorpay Standard Checkout modal
      const options = {
        key: keyId,
        amount: Math.round(res.data.totalAmount * 100),
        currency: 'INR',
        name: 'JADMAA Store',
        description: `Order #${orderNumber}`,
        image: '/images/logo-1.png',
        order_id: razorpayOrderId,
        prefill: {
          name: customer.name || user?.name || '',
          email: customer.email || user?.email || '',
          contact: (customer.phone || cleanPhone).replace(/\D/g, '').slice(-10),
        },
        theme: {
          color: '#B12B2B',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            console.log('[Razorpay] Checkout modal dismissed by user');
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            console.log('[Razorpay] Payment successful. Verifying signature on server...');

            const verifyRes = await orderApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              clearCart();
              navigate(`/order-success/${orderNumber}`);
            } else {
              throw new Error(verifyRes.message || 'Signature verification failed.');
            }
          } catch (verifyErr: any) {
            console.error('[VerifyPayment:Failed]', verifyErr);
            alert(`Payment was captured, but order verification failed: ${verifyErr?.message || 'Please contact support with order #' + orderNumber}`);
            setIsProcessing(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (failRes: any) => {
        console.error('[Razorpay:Failed]', failRes?.error);
        setErrorMsg(failRes?.error?.description || 'Payment was declined or cancelled.');
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('[Checkout:Error]', err);
      setErrorMsg(err?.message || 'An error occurred while setting up payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <>
      <SEO title="Secure Checkout | JADMAA Store" />

      <div className="bg-[#FAF6F0] min-h-screen py-10 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E8DDD0] pb-5">
            <div>
              <span className="text-xs font-bold text-jadmaa-red uppercase tracking-wider">Fast & Secure</span>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-jadmaa-charcoal">
                Product Checkout
              </h1>
            </div>
            <Link
              to="/cart"
              className="text-xs font-bold text-gray-600 hover:text-jadmaa-red transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Cart</span>
            </Link>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left 2 Cols: User Details & Delivery Address */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Account Credentials Reused Box */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-gray-900">
                      Logged-in Customer Details
                    </h3>
                    <p className="text-xs text-gray-500">Reused securely from your registered account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60">
                    <span className="text-[11px] text-gray-400 block mb-0.5">Customer Name</span>
                    <span className="font-bold text-gray-800 text-sm">{user?.name || 'Practitioner'}</span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60">
                    <span className="text-[11px] text-gray-400 block mb-0.5">Email Address</span>
                    <span className="font-bold text-gray-800 text-sm truncate block">{user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address Form */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 text-jadmaa-red flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-gray-900">
                      Shipping & Delivery Address
                    </h3>
                    <p className="text-xs text-gray-500">Enter where you would like your package delivered</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Street Address */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5">
                      Delivery Address (House/Flat No, Street, Area, Landmark) *
                    </label>
                    <textarea
                      rows={3}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="e.g., No. 42, Temple View Cross Street, Anna Nagar, Chennai"
                      required
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red transition text-xs sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Postal Pincode */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1.5">
                        6-Digit Delivery Postal Pincode *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={shippingPincode}
                        onChange={(e) => setShippingPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g., 600040"
                        required
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red transition text-xs sm:text-sm font-mono"
                      />
                    </div>

                    {/* Delivery Contact Number */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1.5">
                        Contact Phone for Delivery Courier *
                      </label>
                      <input
                        type="tel"
                        maxLength={14}
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="e.g., 9876543210"
                        required
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red transition text-xs sm:text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Delivery Notes */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5">
                      Order / Delivery Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="e.g., Please leave with security or call upon arrival"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red transition text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Preview */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-heading font-extrabold text-base text-gray-900">
                      Payment Method
                    </h3>
                  </div>
                  <span className="text-[11px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                    Razorpay Official Gateway
                  </span>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 shadow-2xs">
                      <Lock className="w-5 h-5 text-jadmaa-red" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900">
                        UPI, Net Banking, Debit / Credit Cards
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Powered by Razorpay (Same trusted gateway used for Academy courses)
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                </div>
              </div>

            </div>

            {/* Right 1 Col: Order Summary & Pay Button */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-6 sticky top-24">
              <h3 className="font-heading font-extrabold text-lg text-jadmaa-charcoal border-b border-gray-100 pb-3">
                Items in Order
              </h3>

              {/* Items Snapshot */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3 items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                        {item.product.images && item.product.images[0] ? (
                          <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 m-auto text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-[11px] text-gray-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-800 flex-shrink-0">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charge</span>
                  <span>
                    {shippingCharge === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase tracking-wider text-xs">FREE</span>
                    ) : (
                      <span className="font-bold text-gray-900">₹{shippingCharge}</span>
                    )}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                  <span className="text-base font-bold text-gray-900">Total Payable</span>
                  <span className="text-2xl font-extrabold text-jadmaa-red">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 px-6 bg-jadmaa-red hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Razorpay...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{totalAmount.toLocaleString('en-IN')} via Razorpay</span>
                  </>
                )}
              </button>

              <div className="space-y-1.5 text-center">
                <p className="text-[11px] text-gray-400">
                  256-bit SSL encrypted & Razorpay verified checkout
                </p>
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Ships directly from Academy Dojo warehouse</span>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </>
  );
};

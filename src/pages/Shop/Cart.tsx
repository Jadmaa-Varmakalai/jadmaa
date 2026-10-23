import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Truck,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, clearCart, subtotal, shippingCharge, totalAmount } =
    useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      navigate('/admin#products', { replace: true });
    }
  }, [user, navigate]);

  const freeShippingThreshold = 999;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  if (items.length === 0) {
    return (
      <>
        <SEO title="Your Cart | JADMAA Store" />
        <div className="min-h-screen bg-[#FAF6F0] py-20 px-4 text-center">
          <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xs border border-gray-100">
            <div className="w-16 h-16 bg-red-50 text-jadmaa-red rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-heading font-extrabold text-jadmaa-charcoal mb-2">
              Your Cart is Empty
            </h2>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Looks like you haven't added any martial arts gear or uniforms yet. Explore our dojo supplies!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-jadmaa-red hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explore Products</span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Shopping Cart | JADMAA Store" />

      <div className="bg-[#FAF6F0] min-h-screen py-10 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8DDD0] pb-6">
            <div>
              <span className="text-xs font-bold text-jadmaa-red uppercase tracking-wider">Review Order</span>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-jadmaa-charcoal">
                Shopping Cart ({items.reduce((s, i) => s + i.quantity, 0)} items)
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/products"
                className="text-xs font-bold text-gray-600 hover:text-jadmaa-red transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Shopping</span>
              </Link>
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
              >
                Clear Cart
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left 2 Cols: Cart Table / Items */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Free Delivery Bar */}
              <div className="bg-white p-4 rounded-2xl border border-amber-200/60 shadow-xs">
                <div className="flex items-center justify-between text-xs text-amber-900 font-semibold mb-2">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-700" />
                    {amountNeededForFreeShipping > 0
                      ? `Add ₹${amountNeededForFreeShipping.toFixed(0)} more to get FREE Delivery!`
                      : 'You unlocked FREE delivery on this order!'}
                  </span>
                  <span className="font-bold">{Math.round(progressToFreeShipping)}%</span>
                </div>
                <div className="w-full bg-amber-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressToFreeShipping}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
                {items.map((item) => (
                  <div key={item.product.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="flex gap-4 items-center min-w-0">
                      {/* Image */}
                      <Link
                        to={`/products/${item.product.slug}`}
                        className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0"
                      >
                        {item.product.images && item.product.images[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </Link>

                      {/* Info */}
                      <div className="space-y-1 min-w-0">
                        {item.product.category && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-jadmaa-red">
                            {item.product.category.name}
                          </span>
                        )}
                        <Link to={`/products/${item.product.slug}`}>
                          <h3 className="font-bold text-sm sm:text-base text-gray-900 line-clamp-1 hover:text-jadmaa-red transition">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-xs font-mono text-gray-400">SKU: {item.product.sku}</p>
                        <div className="text-xs font-bold text-gray-800 pt-0.5">
                          ₹{item.product.price.toLocaleString('en-IN')} each
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Line Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-200 transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs sm:text-sm font-bold text-gray-900 bg-white min-w-[36px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-200 transition cursor-pointer disabled:opacity-30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[80px]">
                        <span className="text-base font-extrabold text-jadmaa-charcoal">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 1 Col: Summary & Checkout Button */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-6 sticky top-24">
              <h3 className="font-heading font-extrabold text-lg text-jadmaa-charcoal border-b border-gray-100 pb-3">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping & Delivery</span>
                  <span>
                    {shippingCharge === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase tracking-wider text-xs">FREE</span>
                    ) : (
                      <span className="font-bold text-gray-900">₹{shippingCharge}</span>
                    )}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200/80 flex justify-between items-baseline">
                  <span className="text-base font-bold text-gray-900">Total Payable</span>
                  <span className="text-2xl font-extrabold text-jadmaa-red">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">Taxes calculated and included in item prices</p>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 px-6 bg-jadmaa-red hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Pre-filled with your registered account details</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Encrypted payment checkout via Razorpay</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

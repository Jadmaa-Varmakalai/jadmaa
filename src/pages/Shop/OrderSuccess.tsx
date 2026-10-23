import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { orderApi } from '../../lib/api/orderApi';
import type { Order } from '../../lib/api/orderApi';
import {
  CheckCircle,
  Package,
  Truck,
  MapPin,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const OrderSuccess: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      loadOrder(orderNumber);
    }
  }, [orderNumber]);

  const loadOrder = async (num: string) => {
    try {
      setLoading(true);
      const res = await orderApi.getUserOrderById(num);
      if (res.success && res.data) {
        setOrder(res.data);
      }
    } catch (err) {
      console.error('Failed to load order', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Order Confirmed | JADMAA Store" />

      <div className="bg-[#FAF6F0] min-h-screen py-12 px-4 text-left">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-6">
            
            {/* Header / Checkmark */}
            <div className="text-center space-y-3 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle className="w-10 h-10" />
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                Payment Verified & Order Confirmed
              </span>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-jadmaa-charcoal">
                Thank You for Your Order!
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Your payment has been successfully verified via Razorpay. Your martial arts gear is being prepared for dispatch.
              </p>
            </div>

            {/* Order Meta Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Order Number</span>
                <span className="font-extrabold text-gray-900 font-mono text-xs truncate block">
                  {order?.orderNumber || orderNumber}
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Payment Status</span>
                <span className="font-extrabold text-emerald-600">PAID (SUCCESS)</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Total Paid</span>
                <span className="font-extrabold text-jadmaa-charcoal">
                  ₹{order ? order.totalAmount.toLocaleString('en-IN') : '...'}
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Order Status</span>
                <span className="font-extrabold text-blue-700">CONFIRMED</span>
              </div>
            </div>

            {/* Ordered Items */}
            {order?.items && order.items.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="font-heading font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-jadmaa-red" />
                  <span>Items Ordered ({order.items.reduce((s, i) => s + i.quantity, 0)})</span>
                </h3>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50">
                  {order.items.map((item) => (
                    <div key={item.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 m-auto text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{item.productName}</p>
                          <p className="text-[11px] text-gray-400 font-mono">SKU: {item.sku}</p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900">₹{item.lineTotal.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Info */}
            {order && (
              <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <MapPin className="w-4 h-4 text-jadmaa-red" />
                  <span>Delivery Address</span>
                </div>
                <p className="text-gray-700 leading-relaxed pl-6">
                  {order.shippingAddress} — Pincode: <span className="font-bold">{order.shippingPincode}</span>
                </p>
                <p className="text-gray-600 pl-6 text-[11px]">
                  Recipient: <span className="font-bold">{order.customerName}</span> ({order.customerPhone})
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/products"
                className="py-3 px-5 border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>
              <Link
                to="/student#orders"
                className="py-3 px-5 bg-jadmaa-red hover:bg-red-700 text-white text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-2 shadow-xs"
              >
                <span>View in Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Need assistance? Contact our Academy support at support@jadmaa.com</span>
          </div>

        </div>
      </div>
    </>
  );
};

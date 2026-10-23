import React, { useState, useEffect } from 'react';
import { orderApi } from '../../lib/api/orderApi';
import type { Order } from '../../lib/api/orderApi';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

export const StudentOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getUserOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load user orders', err);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending Payment
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Package className="w-3 h-3" />
            Processing
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Truck className="w-3 h-3" />
            Shipped
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-xs text-gray-400">Loading your orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-10 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-jadmaa-red rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="font-heading font-extrabold text-lg text-gray-900">No Orders Yet</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          You haven't purchased any gear or uniforms from the JADMAA Store yet.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-jadmaa-red hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
        >
          <span>Shop Products</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-extrabold text-jadmaa-charcoal">
            My Product Orders ({orders.length})
          </h2>
          <p className="text-xs text-gray-500">Track shipments, view ordered items, and check delivery status.</p>
        </div>
        <Link
          to="/products"
          className="px-3.5 py-2 bg-jadmaa-red hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Shop More</span>
        </Link>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-4 text-xs"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <span className="font-mono font-extrabold text-sm text-gray-900">
                  {order.orderNumber}
                </span>
                <span className="text-gray-400 block text-[11px]">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {getOrderStatusBadge(order.orderStatus)}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    order.paymentStatus === 'SUCCESS'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {order.paymentStatus === 'SUCCESS' ? 'PAID' : order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 m-auto text-gray-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{item.productName}</p>
                      <p className="text-[11px] text-gray-400 font-mono">SKU: {item.sku}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-gray-900">₹{item.lineTotal.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-gray-400 block">
                      ₹{item.unitPrice} × {item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer: Tracking & Delivery */}
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60 p-3 rounded-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-jadmaa-red flex-shrink-0" />
                  <span className="line-clamp-1">Deliver to: {order.shippingAddress} (Pincode: {order.shippingPincode})</span>
                </div>
                {order.trackingNumber && (
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Courier Tracking: {order.trackingNumber}</span>
                  </div>
                )}
              </div>

              <div className="text-right sm:self-auto self-end">
                <span className="text-gray-500 text-[11px] block">Total Amount</span>
                <span className="text-base font-extrabold text-jadmaa-charcoal">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

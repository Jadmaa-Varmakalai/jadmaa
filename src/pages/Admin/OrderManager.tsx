import React, { useState, useEffect } from 'react';
import { orderApi } from '../../lib/api/orderApi';
import type { Order, OrderStatus, PaymentStatus } from '../../lib/api/orderApi';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  X,
  CreditCard,
  User,
  Package,
  RotateCcw,
} from 'lucide-react';

export const OrderManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('PENDING');
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [modalMsg, setModalMsg] = useState('');

  useEffect(() => {
    loadOrders();
  }, [search, statusFilter, paymentFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.adminGetOrders({
        search: search.trim() || undefined,
        orderStatus: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
      });

      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetails = async (orderId: string) => {
    try {
      setModalLoading(true);
      setModalMsg('');
      const res = await orderApi.adminGetOrderById(orderId);
      if (res.success && res.data) {
        setSelectedOrder(res.data);
        setNewStatus(res.data.orderStatus);
        setNewPaymentStatus(res.data.paymentStatus);
        setTrackingNumber(res.data.trackingNumber || '');
        setAdminNotes(res.data.notes || '');
      }
    } catch (err) {
      console.error('Failed to fetch order detail', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      setModalMsg('');
      const res = await orderApi.adminUpdateOrderStatus(selectedOrder.id, {
        orderStatus: newStatus,
        paymentStatus: newPaymentStatus,
        trackingNumber: trackingNumber.trim() || undefined,
        notes: adminNotes.trim() || undefined,
      });

      if (res.success && res.data) {
        setSelectedOrder(res.data);
        setModalMsg(res.message || 'Order status updated successfully');
        await loadOrders();
      } else {
        throw new Error((res as any)?.error?.message || 'Failed to update order');
      }
    } catch (err: any) {
      console.error('Error updating order', err);
      setModalMsg(err?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <Package className="w-3 h-3" />
            Processing
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <Truck className="w-3 h-3" />
            Shipped
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">PAID</span>;
      case 'PENDING':
        return <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">PENDING</span>;
      case 'FAILED':
        return <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[10px]">FAILED</span>;
      case 'REFUNDED':
        return <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">REFUNDED</span>;
      default:
        return <span className="text-gray-600 font-bold text-[10px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-jadmaa-charcoal">
            Product Orders Management
          </h2>
          <p className="text-xs text-gray-500">
            View customer purchases, delivery addresses, update shipment tracking, and process order cancellations.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order #, customer name, email, phone, or pincode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="">All Order Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="">All Payment Statuses</option>
            <option value="SUCCESS">Paid (Success)</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-gray-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No product orders found</p>
            <p className="text-xs text-gray-400 mt-1">Orders placed by customers will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4 font-mono font-extrabold text-gray-900">
                      {o.orderNumber}
                    </td>

                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{o.customerName}</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-xs">{o.user?.email}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{o.customerPhone}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-800">
                        {o.items?.length || 0} product(s)
                      </span>
                    </td>

                    <td className="py-3 px-4 font-extrabold text-jadmaa-charcoal">
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4">{getPaymentBadge(o.paymentStatus)}</td>

                    <td className="py-3 px-4">{getOrderStatusBadge(o.orderStatus)}</td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openOrderDetails(o.id)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details & Status Manager Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-3xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-jadmaa-cream/50">
              <div>
                <span className="text-[10px] font-bold text-jadmaa-red uppercase tracking-wider">
                  Order Management
                </span>
                <h3 className="font-heading font-extrabold text-lg text-gray-900">
                  Order #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {modalMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-semibold">
                  {modalMsg}
                </div>
              )}

              {/* Customer & Delivery Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/70 space-y-1.5">
                  <span className="font-bold uppercase tracking-wider text-gray-400 text-[10px] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-jadmaa-red" />
                    Customer Details
                  </span>
                  <p className="font-bold text-sm text-gray-900">{selectedOrder.customerName}</p>
                  <p className="text-gray-600">Email: {selectedOrder.user?.email || 'N/A'}</p>
                  <p className="text-gray-600">Contact: {selectedOrder.customerPhone || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/70 space-y-1.5">
                  <span className="font-bold uppercase tracking-wider text-gray-400 text-[10px] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-jadmaa-red" />
                    Shipping & Delivery Address
                  </span>
                  <p className="text-gray-900 font-medium leading-relaxed">
                    {selectedOrder.shippingAddress}
                  </p>
                  <p className="text-gray-600 font-mono font-bold">
                    Pincode: {selectedOrder.shippingPincode}
                  </p>
                </div>
              </div>

              {/* Payment Gateway Information */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-gray-400 text-[10px] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    Payment Information
                  </span>
                  {getPaymentBadge(selectedOrder.paymentStatus)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-400 block">Method:</span>
                    <span className="font-bold text-gray-800">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Razorpay Order ID:</span>
                    <span className="font-mono text-gray-800 truncate block">{selectedOrder.merchantOrderId || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Payment Transaction ID:</span>
                    <span className="font-mono text-gray-800 truncate block">{selectedOrder.paymentTransactionId || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Ordered Products Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">
                  Ordered Products Snapshot
                </h4>
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3 bg-white">
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
                          <p className="text-[10px] text-gray-400 font-mono">SKU: {item.sku}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{item.lineTotal.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-gray-400">
                          ₹{item.unitPrice} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-right">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-bold">₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Charge</span>
                    <span className="font-bold">₹{selectedOrder.shippingCharge}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-jadmaa-charcoal pt-1 border-t border-gray-200">
                    <span>Final Amount</span>
                    <span className="text-jadmaa-red">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Order Status Update Controls */}
              <form onSubmit={handleUpdateStatus} className="border-t border-gray-200 pt-5 space-y-4">
                <h4 className="font-heading font-extrabold text-sm text-gray-900">
                  Update Order Status & Dispatch Info
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Order Status *</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled (Triggers Stock Restoration)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Payment Status</label>
                    <select
                      value={newPaymentStatus}
                      onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="SUCCESS">Success (Paid)</option>
                      <option value="FAILED">Failed</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                  </div>
                </div>

                {newStatus === 'CANCELLED' && (
                  <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-red-600" />
                      <span>Stock Restoration Notice</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {selectedOrder.isStockRestored
                        ? 'Stock has already been restored for this order.'
                        : 'Saving status as CANCELLED will automatically restore ordered item quantities back into available warehouse stock and record an immutable inventory log.'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Courier Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. DTDC-8849201"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Admin / Order Notes</label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal remarks or delivery notes"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2 bg-jadmaa-red hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {updating ? 'Saving Changes...' : 'Save Order Status'}
                  </button>
                </div>
              </form>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

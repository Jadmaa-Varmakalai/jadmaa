import React, { useState, useEffect } from 'react';
import { offerApi } from '../../../lib/api/offerApi';
import type { OfferBookingItem } from '../../../lib/api/offerApi';
import { Search, RotateCcw, Filter, User, BookOpen, CreditCard, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export const OfferBookingsTable: React.FC = () => {
  const [bookings, setBookings] = useState<OfferBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await offerApi.getOfferBookings({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        search: search.trim() || undefined
      });
      if (res.success && res.data) {
        setBookings(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load offer bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBookings();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="w-3 h-3" />
            Verified Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Pending Payment
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3" />
            Failed / Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search booking #, student or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-xs"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20"
            >
              <option value="">All Payment Statuses</option>
              <option value="SUCCESS">Verified Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <button
            onClick={fetchBookings}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Campaign & Course</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Enrollment</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin w-6 h-6 border-2 border-jadmaa-red border-t-transparent rounded-full" />
                      <span>Loading offer bookings...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium text-gray-600">No offer bookings recorded yet.</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Purchases through promotional campaign links will appear here.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      {b.bookingNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-jadmaa-cream flex items-center justify-center font-bold text-jadmaa-red text-[11px]">
                          {(b.customerName || b.user?.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">
                            {b.customerName || b.user?.name || 'Student'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {b.customerEmail || b.user?.email || '—'}
                          </p>
                          {b.customerPhone && (
                            <p className="text-[10px] text-gray-400">{b.customerPhone}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-jadmaa-red truncate">
                        {b.offer?.title || 'Promotional Offer'}
                      </p>
                      <p className="text-[11px] text-gray-600 truncate">
                        Course: {b.course?.title || '—'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      ₹{b.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(b.status)}
                      {b.payment?.gatewayTransactionId && (
                        <p className="text-[10px] font-mono text-gray-400 mt-1 truncate max-w-[140px]">
                          Txn: {b.payment.gatewayTransactionId}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {b.enrollment?.status === 'ACTIVE' || b.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          Active Student
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <div>
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-gray-800">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api/adminApi';
import { Search, RotateCcw, Trash2, Phone, Mail } from 'lucide-react';

export const EnquiriesManager: React.FC = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'CLASS' | 'TREATMENT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEnquiries({ limit: 100 });
      if (res.success && res.data?.items) {
        setEnquiries(res.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await adminApi.updateEnquiryStatus(id, newStatus);
      setEnquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await adminApi.deleteEnquiry(id);
      setEnquiries((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert('Failed to delete enquiry');
    }
  };

  // Helper to categorize enquiry
  const isTreatmentEnquiry = (enquiry: any) => {
    const text = `${enquiry.subject || ''} ${enquiry.message || ''}`.toLowerCase();
    return text.includes('treatment') || text.includes('varma treatment') || text.includes('pain') || text.includes('therapy');
  };

  // Filter items
  const filteredItems = enquiries.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.phone || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.message || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const classEnquiries = filteredItems.filter((item) => !isTreatmentEnquiry(item));
  const treatmentEnquiries = filteredItems.filter((item) => isTreatmentEnquiry(item));

  const renderEnquiryCard = (item: any) => {
    const isTreatment = isTreatmentEnquiry(item);
    const cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');
    const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

    return (
      <div
        key={item.id}
        className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow transition-shadow space-y-4"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 border-b border-gray-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-gray-900">{item.name}</h3>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isTreatment
                    ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {isTreatment ? '🌿 Treatment' : '🥋 Class / Training'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Received: {new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={item.status}
              disabled={updatingId === item.id}
              onChange={(e) => handleStatusChange(item.id, e.target.value)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-md border outline-none cursor-pointer ${
                item.status === 'RESOLVED' || item.status === 'CLOSED'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : item.status === 'IN_PROGRESS'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <option value="NEW">🟡 New</option>
              <option value="IN_PROGRESS">🔵 In Progress</option>
              <option value="RESOLVED">🟢 Resolved</option>
              <option value="CLOSED">⚪ Closed</option>
            </select>

            <button
              onClick={() => handleDelete(item.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
              title="Delete enquiry"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Contact info details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-gray-700">
            <Phone className="w-3.5 h-3.5 text-jadmaa-red shrink-0" />
            <a href={`tel:${item.phone}`} className="font-semibold hover:underline">
              {item.phone || 'No phone'}
            </a>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 ml-1 inline-flex items-center gap-0.5"
                title="Message customer on WhatsApp"
              >
                WhatsApp ↗
              </a>
            )}
          </div>

          {item.email && item.email !== 'no-email@jadmaa.com' && (
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-3.5 h-3.5 text-jadmaa-red shrink-0" />
              <a href={`mailto:${item.email}`} className="hover:underline truncate">
                {item.email}
              </a>
            </div>
          )}
        </div>

        {/* Subject & Interest */}
        {item.subject && (
          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs">
            <span className="font-semibold text-gray-600">Subject / Category: </span>
            <span className="font-medium text-gray-900">{item.subject}</span>
          </div>
        )}

        {/* Message */}
        <div className="text-xs text-gray-700 bg-amber-50/40 p-3 rounded-lg border border-amber-100">
          <p className="font-semibold text-gray-600 mb-0.5">Enquiry Message / Notes:</p>
          <p className="whitespace-pre-wrap leading-relaxed text-gray-800">
            {item.message || 'No additional note provided.'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-gray-900">Enquiries & Leads Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Review online student registrations, direct offline class admissions, and Varma treatment requests
          </p>
        </div>

        <div className="flex w-full sm:w-auto items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red"
            />
          </div>
          <button
            onClick={fetchEnquiries}
            className="p-2 border rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer"
            title="Refresh list"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterCategory === 'ALL'
                ? 'bg-jadmaa-charcoal text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Leads ({enquiries.length})
          </button>
          <button
            onClick={() => setFilterCategory('CLASS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterCategory === 'CLASS'
                ? 'bg-jadmaa-red text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🥋 Classes & Training ({classEnquiries.length})
          </button>
          <button
            onClick={() => setFilterCategory('TREATMENT')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterCategory === 'TREATMENT'
                ? 'bg-cyan-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🌿 Varma Treatment ({treatmentEnquiries.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 bg-white outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {loading && enquiries.length === 0 ? (
        <div className="p-12 text-center text-sm text-gray-500">
          <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-jadmaa-red" />
          Loading enquiries...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-gray-200 text-sm text-gray-500">
          No enquiries matching your current filters.
        </div>
      ) : (
        <div className="space-y-8">
          {/* SECTION 1: CLASSES & TRAINING ENQUIRIES */}
          {(filterCategory === 'ALL' || filterCategory === 'CLASS') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-jadmaa-red"></span>
                  <h3 className="font-heading font-bold text-lg text-gray-900">
                    Classes & Training Enquiries
                  </h3>
                  <span className="text-xs bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full">
                    {classEnquiries.length}
                  </span>
                </div>
                <span className="text-xs text-gray-500">Online & Offline martial arts students</span>
              </div>

              {classEnquiries.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 italic">No class enquiries in this filter.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classEnquiries.map(renderEnquiryCard)}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: VARMA TREATMENT ENQUIRIES */}
          {(filterCategory === 'ALL' || filterCategory === 'TREATMENT') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b pb-2 border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-600"></span>
                  <h3 className="font-heading font-bold text-lg text-gray-900">
                    Varma Treatment & Therapy Enquiries
                  </h3>
                  <span className="text-xs bg-cyan-100 text-cyan-800 font-semibold px-2 py-0.5 rounded-full">
                    {treatmentEnquiries.length}
                  </span>
                </div>
                <span className="text-xs text-gray-500">Patients seeking direct consultations & therapy</span>
              </div>

              {treatmentEnquiries.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 italic">No treatment enquiries in this filter.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {treatmentEnquiries.map(renderEnquiryCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

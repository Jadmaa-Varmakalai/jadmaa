import React, { useState, useEffect } from 'react';
import { offerApi } from '../../../lib/api/offerApi';
import type { CourseOfferItem } from '../../../lib/api/offerApi';
import { OfferEditorModal } from './OfferEditorModal';
import { OfferBookingsTable } from './OfferBookingsTable';
import { PopupSettingsModal } from './PopupSettingsModal';
import {
  Sparkles, Plus, Copy, Check, ExternalLink, Edit3, Trash2,
  CopyPlus, Settings, Clock, Tag, TrendingUp, Users, CheckCircle,
  AlertCircle, Eye, Calendar, ArrowRight
} from 'lucide-react';

export const CourseOffersManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'offers' | 'bookings'>('offers');
  const [offers, setOffers] = useState<CourseOfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [editingOffer, setEditingOffer] = useState<CourseOfferItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPopupSettingsOpen, setIsPopupSettingsOpen] = useState(false);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await offerApi.getAdminOffers();
      if (res.success && res.data) {
        setOffers(res.data);
      }
    } catch (err) {
      console.error('Failed to load offers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleToggle = async (offer: CourseOfferItem) => {
    try {
      const res = await offerApi.toggleOffer(offer.id);
      if (res.success) {
        setOffers(prev => prev.map(o => o.id === offer.id ? {
          ...o,
          isEnabled: res.data.isEnabled,
          computedStatus: res.data.computedStatus
        } : o));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle offer status');
    }
  };

  const handleDuplicate = async (offer: CourseOfferItem) => {
    if (!confirm(`Duplicate "${offer.title}" as a new draft?`)) return;
    try {
      const res = await offerApi.duplicateOffer(offer.id);
      if (res.success) {
        fetchOffers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate offer');
    }
  };

  const handleDelete = async (offer: CourseOfferItem) => {
    const hasBookings = (offer.verifiedBookingsCount || 0) > 0 || (offer.currentBookings || 0) > 0;
    const confirmMsg = hasBookings
      ? `This offer has verified customer bookings. Deleting it will safely ARCHIVE it so customer records and payments remain intact. Proceed?`
      : `Are you sure you want to delete "${offer.title}"? This cannot be undone.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await offerApi.deleteOffer(offer.id);
      if (res.success) {
        if (res.message) alert(res.message);
        fetchOffers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete offer');
    }
  };

  const copyUrl = (slug: string, id: string) => {
    const url = `${window.location.origin}/offers/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live / Active
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            Scheduled
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
            Expired
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Disabled
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  // Stats calculation
  const totalActiveOffers = offers.filter(o => o.computedStatus === 'PUBLISHED').length;
  const totalVerifiedBookings = offers.reduce((acc, o) => acc + (o.currentBookings || 0), 0);
  const totalOfferRevenue = offers.reduce((acc, o) => acc + ((o.currentBookings || 0) * (o.offerPrice || 0)), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-heading font-bold text-gray-900">
              Course Offers & Campaigns
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-jadmaa-red/10 text-jadmaa-red font-bold text-xs">
              Campaign Ready
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage promotional landing pages, discounted pricing campaigns, live countdowns and floating website stickers.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsPopupSettingsOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <span>Sticker Settings</span>
          </button>

          <button
            onClick={() => {
              setEditingOffer(null);
              setIsEditorOpen(true);
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-jadmaa-red hover:bg-jadmaa-red/90 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-jadmaa-red/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Offer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Offers</p>
            <p className="text-2xl font-bold font-heading text-jadmaa-charcoal mt-1">
              {totalActiveOffers} <span className="text-xs font-normal text-gray-400">/ {offers.length} Total</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-bold font-heading text-jadmaa-charcoal mt-1">
              {totalVerifiedBookings}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Campaign Revenue</p>
            <p className="text-2xl font-bold font-heading text-jadmaa-charcoal mt-1">
              ₹{totalOfferRevenue.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 flex items-center gap-6 text-sm">
        <button
          onClick={() => setActiveTab('offers')}
          className={`pb-3 font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'offers'
              ? 'border-jadmaa-red text-jadmaa-red font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Promotional Offers ({offers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-jadmaa-red text-jadmaa-red font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Offer Purchases & Bookings</span>
        </button>
      </div>

      {/* Tab 1: Offers List */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-jadmaa-red border-t-transparent rounded-full mx-auto mb-3" />
              <span>Loading course offers...</span>
            </div>
          ) : offers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Sparkles className="w-12 h-12 text-jadmaa-red/40 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No promotional offers yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
                Create your first promotional offer to generate a permanent link for promotional campaigns and advertisements.
              </p>
              <button
                onClick={() => {
                  setEditingOffer(null);
                  setIsEditorOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-jadmaa-red hover:bg-jadmaa-red/90 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-jadmaa-red/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create Offer</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
                >
                  {/* Left: Thumbnail & Offer Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 relative">
                      {offer.bannerImageUrl ? (
                        <img
                          src={offer.bannerImageUrl}
                          alt={offer.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-jadmaa-cream text-jadmaa-red font-bold text-xs">
                          OFFER
                        </div>
                      )}
                      {offer.showPopup && (
                        <span className="absolute bottom-1 right-1 bg-jadmaa-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow tracking-wider uppercase" title={`Floating Offer Sticker (Priority: ${offer.popupPriority || 0})`}>
                          STICKER{offer.popupPriority ? ` P${offer.popupPriority}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderStatusBadge(offer.computedStatus)}
                        <span className="text-[11px] font-semibold text-gray-500">
                          Course: <strong className="text-gray-800">{offer.courseTitle}</strong>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-jadmaa-charcoal truncate">
                        {offer.title}
                      </h3>

                      {offer.shortDescription && (
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {offer.shortDescription}
                        </p>
                      )}

                      {/* Public Link Pill */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="font-mono text-[11px] text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md truncate max-w-xs">
                          /offers/{offer.slug}
                        </span>
                        <button
                          onClick={() => copyUrl(offer.slug, offer.id)}
                          className="px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-600 text-[11px] font-medium flex items-center gap-1 transition shrink-0"
                          title="Copy campaign link"
                        >
                          {copiedId === offer.id ? (
                            <>
                              <Check className="w-3 h-3 text-green-600" />
                              <span className="text-green-700 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`/offers/${offer.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-400 hover:text-jadmaa-red p-1 transition"
                          title="Open public page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Pricing & Seats */}
                  <div className="flex flex-wrap items-center gap-6 shrink-0 bg-gray-50/80 p-3 rounded-xl border border-gray-100 w-full lg:w-auto justify-between lg:justify-start">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Campaign Pricing</p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-lg font-bold text-jadmaa-red">
                          ₹{offer.offerPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          ₹{offer.originalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                          {offer.discountPercent}% OFF
                        </span>
                      </div>
                    </div>

                    <div className="h-8 w-px bg-gray-200 hidden sm:block" />

                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Bookings / Limit</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">
                        {offer.currentBookings || 0}
                        {offer.bookingLimit ? (
                          <span className="text-xs font-normal text-gray-500"> / {offer.bookingLimit} seats</span>
                        ) : (
                          <span className="text-xs font-normal text-gray-500"> (No limit)</span>
                        )}
                      </p>
                    </div>

                    <div className="h-8 w-px bg-gray-200 hidden sm:block" />

                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Expiry Timer</p>
                      <p className="text-xs font-medium text-gray-700 mt-0.5">
                        {offer.expiresAt ? (
                          new Date(offer.expiresAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })
                        ) : (
                          'No expiry'
                        )}
                        {offer.countdownEnabled && ' ⏱'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    {/* Enable / Disable Switch */}
                    <div className="flex items-center gap-2 pr-2 border-r border-gray-200">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offer.isEnabled}
                          onChange={() => handleToggle(offer)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                      <span className="text-[11px] font-semibold text-gray-600">
                        {offer.isEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setEditingOffer(offer);
                        setIsEditorOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDuplicate(offer)}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
                      title="Duplicate Offer"
                    >
                      <CopyPlus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(offer)}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                      title="Delete / Archive Offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bookings Table */}
      {activeTab === 'bookings' && (
        <OfferBookingsTable />
      )}

      {/* Modals */}
      <OfferEditorModal
        offer={editingOffer}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaved={fetchOffers}
      />

      <PopupSettingsModal
        isOpen={isPopupSettingsOpen}
        onClose={() => setIsPopupSettingsOpen(false)}
        onSaved={fetchOffers}
      />

    </div>
  );
};

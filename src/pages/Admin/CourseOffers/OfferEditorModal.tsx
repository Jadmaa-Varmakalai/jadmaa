import React, { useState, useEffect, useRef } from 'react';
import { offerApi } from '../../../lib/api/offerApi';
import type { CourseOfferItem } from '../../../lib/api/offerApi';
import { adminApi } from '../../../lib/api/adminApi';
import { X, Sparkles, Copy, Check, ExternalLink, AlertCircle, Clock, Tag, Loader2 } from 'lucide-react';

interface OfferEditorModalProps {
  offer: CourseOfferItem | null; // null means creating new
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// Helper to format ISO date string for <input type="datetime-local" /> in local user timezone
const formatForDatetimeInput = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
};

export const OfferEditorModal: React.FC<OfferEditorModalProps> = ({
  offer,
  isOpen,
  onClose,
  onSaved
}) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [courseId, setCourseId] = useState('');
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [supportEmail, setSupportEmail] = useState('info@jadmaa.com');
  const [supportPhone, setSupportPhone] = useState('+91 93452 20020');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [isEnabled, setIsEnabled] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPriority, setPopupPriority] = useState<number>(0);
  const [startAt, setStartAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [countdownEnabled, setCountdownEnabled] = useState(false);
  const [bookingLimit, setBookingLimit] = useState<string>('');

  // Load published courses for dropdown
  useEffect(() => {
    if (!isOpen) return;
    const loadCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await adminApi.getCourses({ limit: 100 });
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        setCourses(items);
        if (!offer && items.length > 0 && !courseId) {
          setCourseId(items[0].id);
          setOriginalPrice(items[0].price || 0);
          if (items[0].thumbnailUrl) setBannerImageUrl(items[0].thumbnailUrl);
          if (items[0].subtitle) setShortDescription(items[0].subtitle);
        }
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, [isOpen]);

  // Populate form when editing or resetting for new
  useEffect(() => {
    if (offer) {
      setTitle(offer.title || '');
      setSlug(offer.slug || '');
      setAutoSlug(false);
      setCourseId(offer.courseId || '');
      setOriginalPrice(offer.originalPrice || 0);
      setOfferPrice(offer.offerPrice ? offer.offerPrice.toString() : '');
      setShortDescription(offer.shortDescription || '');
      setDescription(offer.description || '');
      setBannerImageUrl(offer.bannerImageUrl || '');
      setTermsAndConditions(offer.termsAndConditions || '');
      setSupportEmail(offer.supportEmail || 'info@jadmaa.com');
      setSupportPhone(offer.supportPhone || '+91 93452 20020');
      setStatus(offer.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
      setIsEnabled(offer.isEnabled);
      setShowPopup(offer.showPopup);
      setPopupPriority(offer.popupPriority || 0);
      setCountdownEnabled(offer.countdownEnabled);
      setBookingLimit(offer.bookingLimit ? offer.bookingLimit.toString() : '');
      setStartAt(formatForDatetimeInput(offer.startAt));
      setExpiresAt(formatForDatetimeInput(offer.expiresAt));
    } else {
      // Defaults for new
      setTitle('');
      setSlug('');
      setAutoSlug(true);
      setCourseId('');
      setOriginalPrice(0);
      setOfferPrice('');
      setShortDescription('');
      setDescription('');
      setBannerImageUrl('');
      setTermsAndConditions('• Valid exclusively for online registration\n• Cannot be combined with other promotional coupons\n• Instant lifetime access upon verified checkout');
      setSupportEmail('info@jadmaa.com');
      setSupportPhone('+91 93452 20020');
      setStatus('DRAFT');
      setIsEnabled(true);
      setShowPopup(false);
      setPopupPriority(0);
      setCountdownEnabled(true);
      setBookingLimit('');
      setStartAt('');
      setExpiresAt('');
    }
    setError(null);
  }, [offer, isOpen]);

  // Slug auto-generation
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(generateSlug(val));
    }
  };

  // Course selection handler
  const handleCourseChange = (selectedCourseId: string) => {
    setCourseId(selectedCourseId);
    const found = courses.find(c => c.id === selectedCourseId);
    if (found) {
      setOriginalPrice(found.price || 0);
      if (!bannerImageUrl && found.thumbnailUrl) {
        setBannerImageUrl(found.thumbnailUrl);
      }
      if (!shortDescription && found.subtitle) {
        setShortDescription(found.subtitle);
      }
    }
  };

  // Price calculations
  const numOfferPrice = parseFloat(offerPrice) || 0;
  const discountAmount = Math.max(0, originalPrice - numOfferPrice);
  const discountPercent = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;

  const handleSave = async (targetStatus?: 'DRAFT' | 'PUBLISHED') => {
    setError(null);
    const effectiveStatus = targetStatus || status;
    const effectiveIsEnabled = targetStatus === 'PUBLISHED' ? true : isEnabled;

    if (!title.trim()) {
      setError('Offer title is required.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!courseId) {
      setError('Please select an associated course.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!offerPrice || numOfferPrice <= 0) {
      setError('Promotional offer price must be greater than zero.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (originalPrice > 0 && numOfferPrice > originalPrice) {
      setError(`Offer price (₹${numOfferPrice}) cannot exceed the regular course price (₹${originalPrice}).`);
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (startAt && expiresAt && new Date(expiresAt) <= new Date(startAt)) {
      setError('Offer expiry date must be strictly after the start date.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim() || generateSlug(title),
      courseId,
      originalPrice,
      offerPrice: numOfferPrice,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      bannerImageUrl: bannerImageUrl.trim() || undefined,
      termsAndConditions: termsAndConditions.trim() || undefined,
      supportEmail: supportEmail.trim() || 'info@jadmaa.com',
      supportPhone: supportPhone.trim() || '+91 93452 20020',
      status: effectiveStatus,
      isEnabled: effectiveIsEnabled,
      showPopup,
      popupPriority: Number(popupPriority) || 0,
      countdownEnabled,
      startAt: startAt ? new Date(startAt).toISOString() : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      bookingLimit: bookingLimit ? parseInt(bookingLimit, 10) : null
    };

    setSaving(true);
    try {
      if (offer?.id) {
        await offerApi.updateOffer(offer.id, payload);
      } else {
        await offerApi.createOffer(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to save offer. Please check input values.';
      setError(errMsg);
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const copyPublicUrl = () => {
    if (!slug) return;
    const url = `${window.location.origin}/offers/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-jadmaa-cream to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-jadmaa-red/10 text-jadmaa-red flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-jadmaa-charcoal">
                {offer ? 'Edit Course Offer' : 'Create New Course Offer'}
              </h2>
              <p className="text-xs text-jadmaa-textMuted">
                Dedicated promotional landing page and campaign URL
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Section: Basic Info */}
          <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-jadmaa-textMuted flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-jadmaa-red" />
              1. Basic Offer Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Offer Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Varmakalai Special Festival Offer 2026"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700">
                    URL Slug (Permanent Landing Page URL) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAutoSlug(!autoSlug)}
                    className="text-xs text-jadmaa-red hover:underline font-medium"
                  >
                    {autoSlug ? 'Customize manually' : 'Auto-sync from title'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-mono select-none">
                      /offers/
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="varmakalai-special"
                      value={slug}
                      onChange={(e) => {
                        setAutoSlug(false);
                        setSlug(generateSlug(e.target.value));
                      }}
                      className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-sm font-mono text-gray-800"
                    />
                  </div>
                  {slug && (
                    <button
                      type="button"
                      onClick={copyPublicUrl}
                      className="px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-medium flex items-center gap-1.5 transition shrink-0"
                      title="Copy Public URL"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Campaign Link: <span className="font-mono text-jadmaa-charcoal">{window.location.origin}/offers/{slug || '...'}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Associated Course <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-sm bg-white"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} (Regular: ₹{c.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://.../banner.png (Defaults to course thumbnail)"
                  value={bannerImageUrl}
                  onChange={(e) => setBannerImageUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Catchy Short Description (Displayed in Ads & Popup Cards)
                </label>
                <input
                  type="text"
                  placeholder="Master ancient healing pressure points with this limited-time promotional package."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Detailed Promotional Description (Landing Page Content)
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed breakdown of the offer package, certification, bonus materials..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Pricing */}
          <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-jadmaa-textMuted flex items-center gap-2">
              <span className="font-mono text-sm text-jadmaa-red">₹</span>
              2. Promotional Pricing & Discount Calculation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Regular Course Price (₹)
                </label>
                <div className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-700 font-bold text-sm">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Promotional Offer Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g., 999"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-sm font-bold text-jadmaa-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Discount Preview
                </label>
                <div className="px-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-800 text-sm font-semibold flex items-center justify-between">
                  <span>Save ₹{discountAmount.toLocaleString('en-IN')}</span>
                  <span className="px-2 py-0.5 rounded-full bg-green-600 text-white text-xs font-bold">
                    {discountPercent}% OFF
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Schedule & Limits */}
          <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-jadmaa-textMuted flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-jadmaa-red" />
              3. Schedule, Expiration & Booking Limit
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Start Date & Time (IST)
                </label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-xs bg-white"
                />
                <span className="text-[10px] text-gray-400">Leave blank for immediate availability</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expiry Date & Time (IST)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-xs bg-white"
                />
                <span className="text-[10px] text-gray-400">Required for live countdown timer</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Booking Limit (Seats)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 50 (Optional)"
                  value={bookingLimit}
                  onChange={(e) => setBookingLimit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-sm"
                />
                <span className="text-[10px] text-gray-400">Auto-expires once limit is booked</span>
              </div>

              <div className="sm:col-span-3 flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={countdownEnabled}
                    onChange={(e) => setCountdownEnabled(e.target.checked)}
                    className="w-4 h-4 text-jadmaa-red rounded border-gray-300 focus:ring-jadmaa-red"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Enable Live Countdown Timer on Landing Page
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Section: Publication & Offer Sticker Controls */}
          <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-jadmaa-textMuted flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-jadmaa-red" />
              4. Publication State & Website Offer Sticker
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-sm bg-white"
                >
                  <option value="DRAFT">Draft (Not accessible publicly)</option>
                  <option value="PUBLISHED">Published (Eligible for public access)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
                <span className="text-xs font-semibold text-gray-700">
                  {isEnabled ? 'Enabled (Active)' : 'Disabled (Shut Off)'}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPopup}
                    onChange={(e) => setShowPopup(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-jadmaa-red"></div>
                </label>
                <span className="text-xs font-semibold text-gray-700">
                  Show as Floating Offer Sticker
                </span>
              </div>

              {showPopup && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Sticker Display Priority (Higher appears first)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={popupPriority}
                    onChange={(e) => setPopupPriority(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section: Terms and Contact */}
          <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-jadmaa-textMuted">
              5. Terms & Support Contact Info
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Support Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Offer Terms & Conditions
                </label>
                <textarea
                  rows={2}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {slug && (
              <a
                href={`/offers/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview Page</span>
              </a>
            )}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="truncate max-w-[260px]">{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSave('PUBLISHED')}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-jadmaa-red hover:bg-jadmaa-red/90 text-white text-xs font-bold shadow-md shadow-jadmaa-red/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Offer</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

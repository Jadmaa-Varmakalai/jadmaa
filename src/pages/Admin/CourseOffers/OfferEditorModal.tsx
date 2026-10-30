import React, { useState, useEffect, useRef } from 'react';
import { offerApi } from '../../../lib/api/offerApi';
import type { CourseOfferItem } from '../../../lib/api/offerApi';
import { adminApi } from '../../../lib/api/adminApi';
import { CampaignImageUploader } from './CampaignImageUploader';
import { PremiumCampaignPopup } from '../../../components/offers/PremiumCampaignPopup';
import {
  X, Sparkles, AlertCircle, Clock, Tag,
  Eye, Monitor, Smartphone, Palette, Calendar,
  ShieldCheck, Globe
} from 'lucide-react';

interface OfferEditorModalProps {
  offer: CourseOfferItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const formatForDatetimeInput = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
};

const CATEGORIES = [
  { id: 'ONLINE_COURSE', label: 'Online Course' },
  { id: 'VARMA_TREATMENT', label: 'Varma Treatment' },
  { id: 'OFFLINE_CLASS', label: 'Offline Martial Arts' },
  { id: 'SPECIAL_CAMP', label: 'Special Camp Training' },
  { id: 'WORKSHOP', label: 'Workshop' },
  { id: 'SEMINAR', label: 'Seminar' },
  { id: 'SPECIAL_EVENT', label: 'Special Event' },
  { id: 'ACADEMY_PROGRAMME', label: 'Academy Programme' },
  { id: 'CUSTOM', label: 'Custom Category' },
];

const PRICING_TYPES = [
  { id: 'FIXED_PRICE', label: 'Fixed Promotional Price' },
  { id: 'PERCENTAGE', label: 'Percentage Discount (% OFF)' },
  { id: 'FIXED_DISCOUNT', label: 'Fixed Amount Discount (₹ OFF)' },
  { id: 'NO_DISCOUNT', label: 'No Discount (Package Price)' },
  { id: 'ENQUIRY_ONLY', label: 'Enquiry-Only Campaign (Free Registration)' },
];

export const OfferEditorModal: React.FC<OfferEditorModalProps> = ({
  offer,
  isOpen,
  onClose,
  onSaved
}) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop-popup' | 'mobile-popup' | 'landing'>('desktop-popup');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [category, setCategory] = useState('ONLINE_COURSE');
  const [customCategory, setCustomCategory] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [branchLocation, setBranchLocation] = useState('All Branches');
  const [courseId, setCourseId] = useState('');

  // Pricing
  const [pricingType, setPricingType] = useState('FIXED_PRICE');
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<string>('');
  const [discountAmountVal, setDiscountAmountVal] = useState<string>('');

  // Content & Media
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [popupImageUrl, setPopupImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');

  // Branding & CTA
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [primaryColor, setPrimaryColor] = useState('#991B1B');
  const [secondaryColor, setSecondaryColor] = useState('#141416');
  const [ctaType, setCtaType] = useState('ENROLL_COURSE');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [secondaryCtaText, setSecondaryCtaText] = useState('View Details');
  const [secondaryCtaUrl, setSecondaryCtaUrl] = useState('');

  // Schedule & Publishing
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [isEnabled, setIsEnabled] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPriority, setPopupPriority] = useState<number>(0);
  const [startAt, setStartAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [countdownEnabled, setCountdownEnabled] = useState(true);
  const [bookingLimit, setBookingLimit] = useState<string>('');

  // Support
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [supportEmail, setSupportEmail] = useState('info@jadmaa.com');
  const [supportPhone, setSupportPhone] = useState('+91 93452 20020');

  // Load Courses for selection
  useEffect(() => {
    if (!isOpen) return;
    const loadCourses = async () => {
      try {
        const res = await adminApi.getCourses({ limit: 100 });
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        setCourses(items);
      } catch (err) {
        console.error('Failed to load courses', err);
      }
    };
    loadCourses();
  }, [isOpen]);

  // Populate form
  useEffect(() => {
    if (offer) {
      setTitle(offer.title || '');
      setSlug(offer.slug || '');
      setAutoSlug(false);
      setCategory(offer.category || 'ONLINE_COURSE');
      setCustomCategory(offer.customCategory || '');
      setTargetAudience(offer.targetAudience || '');
      setBranchLocation(offer.branchLocation || 'All Branches');
      setCourseId(offer.courseId || '');
      setPricingType(offer.pricingType || 'FIXED_PRICE');
      setOriginalPrice(offer.originalPrice || 0);
      setOfferPrice(offer.offerPrice ? offer.offerPrice.toString() : '');
      setDiscountPercent(offer.discountPercent ? offer.discountPercent.toString() : '');
      setShortDescription(offer.shortDescription || '');
      setDescription(offer.description || '');
      setBannerImageUrl(offer.bannerImageUrl || '');
      setPopupImageUrl(offer.popupImageUrl || '');
      setMobileImageUrl(offer.mobileImageUrl || '');
      setTheme((offer.theme as any) || 'light');
      setPrimaryColor(offer.primaryColor || '#991B1B');
      setSecondaryColor(offer.secondaryColor || '#141416');
      setCtaType(offer.ctaType || 'ENROLL_COURSE');
      setCtaText(offer.ctaText || '');
      setCtaUrl(offer.ctaUrl || '');
      setSecondaryCtaText(offer.secondaryCtaText || 'View Details');
      setSecondaryCtaUrl(offer.secondaryCtaUrl || '');
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
      setCategory('ONLINE_COURSE');
      setCustomCategory('');
      setTargetAudience('');
      setBranchLocation('All Branches');
      setCourseId('');
      setPricingType('FIXED_PRICE');
      setOriginalPrice(0);
      setOfferPrice('');
      setDiscountPercent('');
      setDiscountAmountVal('');
      setShortDescription('');
      setDescription('');
      setBannerImageUrl('/images/wellness-682x1024.png');
      setPopupImageUrl('');
      setMobileImageUrl('');
      setTheme('light');
      setPrimaryColor('#991B1B');
      setSecondaryColor('#141416');
      setCtaType('ENROLL_COURSE');
      setCtaText('');
      setCtaUrl('');
      setSecondaryCtaText('View Details');
      setSecondaryCtaUrl('');
      setTermsAndConditions('• Valid exclusively for this promotional campaign period\n• Cannot be combined with other promotional coupons\n• Instant confirmation upon verified registration');
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

  const handleCourseChange = (selectedCourseId: string) => {
    setCourseId(selectedCourseId);
    const found = courses.find(c => c.id === selectedCourseId);
    if (found) {
      if (found.price) setOriginalPrice(found.price);
      if (found.thumbnailUrl && !bannerImageUrl) setBannerImageUrl(found.thumbnailUrl);
      if (found.subtitle && !shortDescription) setShortDescription(found.subtitle);
    }
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);

    // Auto-adapt primary CTA action and default button label based on campaign category
    switch (newCat) {
      case 'ONLINE_COURSE':
        setCtaType('ENROLL_COURSE');
        setCtaText('Enrol in Online Course');
        break;
      case 'VARMA_TREATMENT':
        setCtaType('BOOK_TREATMENT');
        setCtaText('Book Treatment Session');
        break;
      case 'OFFLINE_CLASS':
        setCtaType('ENQUIRE_OFFLINE');
        setCtaText('Join Academy Batch');
        break;
      case 'SPECIAL_CAMP':
        setCtaType('REGISTER_CAMP');
        setCtaText('Register for Camp');
        break;
      case 'WORKSHOP':
        setCtaType('REGISTER_WORKSHOP');
        setCtaText('Reserve Workshop Seat');
        break;
      case 'SEMINAR':
        setCtaType('REGISTER_WORKSHOP');
        setCtaText('Register for Seminar');
        break;
      case 'SPECIAL_EVENT':
        setCtaType('REGISTER_WORKSHOP');
        setCtaText('Book Event Pass');
        break;
      case 'ACADEMY_PROGRAMME':
        setCtaType('ENQUIRE_OFFLINE');
        setCtaText('Apply for Programme');
        break;
      case 'CUSTOM':
      default:
        setCtaType('CONTACT_ACADEMY');
        setCtaText('Enquire Now');
        break;
    }
  };

  // Pricing calculations
  const calculateEffectiveOfferPrice = (): number => {
    if (pricingType === 'ENQUIRY_ONLY') return 0;
    if (pricingType === 'NO_DISCOUNT') return originalPrice || parseFloat(offerPrice) || 0;
    if (pricingType === 'PERCENTAGE') {
      const pct = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0));
      return Math.max(0, Math.round(originalPrice * (1 - pct / 100)));
    }
    if (pricingType === 'FIXED_DISCOUNT') {
      const disc = parseFloat(discountAmountVal) || 0;
      return Math.max(0, originalPrice - disc);
    }
    return parseFloat(offerPrice) || 0;
  };

  const effectiveOfferPrice = calculateEffectiveOfferPrice();
  const effectiveDiscountPercent = originalPrice > 0 && originalPrice > effectiveOfferPrice
    ? Math.round(((originalPrice - effectiveOfferPrice) / originalPrice) * 100)
    : 0;

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent, targetStatus?: 'DRAFT' | 'PUBLISHED') => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Campaign title is required.');
      return;
    }

    if (category === 'CUSTOM' && !customCategory.trim()) {
      setError('Please provide a name for your custom category.');
      return;
    }

    if (pricingType !== 'ENQUIRY_ONLY') {
      if (effectiveOfferPrice <= 0 && pricingType !== 'NO_DISCOUNT') {
        setError('Please enter a valid offer price or discount percentage greater than zero.');
        return;
      }
      if (originalPrice > 0 && effectiveOfferPrice > originalPrice) {
        setError(`Offer price (₹${effectiveOfferPrice}) cannot exceed original price (₹${originalPrice}).`);
        return;
      }
    }

    setSaving(true);

    const submissionStatus = targetStatus || status;

    const payload: any = {
      title: title.trim(),
      slug: slug.trim() || generateSlug(title),
      category,
      customCategory: category === 'CUSTOM' ? customCategory.trim() : null,
      targetAudience: targetAudience.trim() || null,
      branchLocation: branchLocation.trim() || null,
      courseId: category === 'ONLINE_COURSE' && courseId ? courseId : null,
      pricingType,
      originalPrice,
      offerPrice: effectiveOfferPrice,
      discountPercent: effectiveDiscountPercent,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      bannerImageUrl: bannerImageUrl.trim() || null,
      popupImageUrl: popupImageUrl.trim() || null,
      mobileImageUrl: mobileImageUrl.trim() || null,
      theme,
      primaryColor,
      secondaryColor,
      ctaType,
      ctaText: ctaText.trim() || null,
      ctaUrl: ctaUrl.trim() || null,
      secondaryCtaText: secondaryCtaText.trim() || null,
      secondaryCtaUrl: secondaryCtaUrl.trim() || null,
      termsAndConditions: termsAndConditions.trim() || null,
      supportEmail: supportEmail.trim() || 'info@jadmaa.com',
      supportPhone: supportPhone.trim() || '+91 93452 20020',
      status: submissionStatus,
      isEnabled,
      showPopup,
      popupPriority: Number(popupPriority) || 0,
      countdownEnabled,
      bookingLimit: bookingLimit ? parseInt(bookingLimit, 10) : null,
      startAt: startAt ? new Date(startAt).toISOString() : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
    };

    try {
      if (offer) {
        const res = await offerApi.updateOffer(offer.id, payload);
        if (res.success) {
          onSaved();
          onClose();
        } else {
          setError(res.error?.message || 'Failed to update campaign offer.');
        }
      } else {
        const res = await offerApi.createOffer(payload);
        if (res.success) {
          onSaved();
          onClose();
        } else {
          setError(res.error?.message || 'Failed to create campaign offer.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-heading text-gray-900">
                  {offer ? 'Edit Promotional Campaign' : 'Create New Promotional Campaign'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-100 text-red-800">
                  Multi-Category Ready
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure promotional landing pages, website popups, countdowns, and booking actions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-red-600" />
                <span>Live Preview</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form Scroll Area */}
          <form
            ref={formRef}
            onSubmit={(e) => handleSubmit(e)}
            className="flex-1 overflow-y-auto p-6 space-y-6 text-sm"
          >
            {/* 1. CATEGORY & APPLICABILITY */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-4">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                <Tag className="w-4 h-4 text-red-600" />
                <span>1. Campaign Category & Applicability</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Campaign Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600 font-medium"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {category === 'CUSTOM' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Custom Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Corporate Training, Summer Retreat"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                ) : category === 'ONLINE_COURSE' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Associated Online Course (Optional)
                    </label>
                    <select
                      value={courseId}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                    >
                      <option value="">-- General Campaign (No specific course) --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title} (₹{c.price})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Target Audience / Eligibility
                    </label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g. Beginners, Chronic pain patients, Ages 12+"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Applicable Branch / Location
                  </label>
                  <select
                    value={branchLocation}
                    onChange={(e) => setBranchLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="All Branches">All Branches (Thanjavur, Kumbakonam & Ariyalur)</option>
                    <option value="Thanjavur">Thanjavur Headquarters</option>
                    <option value="Kumbakonam">Kumbakonam Branch</option>
                    <option value="Ariyalur">Ariyalur Branch</option>
                    <option value="Online">Online / Remote Session</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. BASIC CAMPAIGN DETAILS */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-4">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>2. Campaign Title, Slug & Messaging</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Campaign Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Special Varma Therapy Session 50% Off"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlug(e.target.value);
                    }}
                    placeholder="special-campaign"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-mono focus:outline-none focus:border-red-600"
                  />
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">
                    /offers/{slug || '...'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Short Description (For Popups & Summaries)
                  </label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Short punchy summary for the offer popup"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Description & Details
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive details about this training, treatment, or programme..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600 resize-none"
                />
              </div>

              {/* Device Image Upload Controls */}
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Campaign Artwork & Device Uploads
                    </span>
                    <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-2 py-0.5 rounded-full">
                      Device Upload
                    </span>
                  </div>
                  {bannerImageUrl && !popupImageUrl && (
                    <button
                      type="button"
                      onClick={() => setPopupImageUrl(bannerImageUrl)}
                      className="text-[11px] font-semibold text-red-700 hover:text-red-800 transition cursor-pointer"
                    >
                      Use Landing Page Image for Popup Too
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Popup Campaign Image */}
                  <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-2xs">
                    <CampaignImageUploader
                      label="1. Popup Campaign Image"
                      sublabel="Used for website promotional modal"
                      recommendedAspect="4:5 or 1:1"
                      value={popupImageUrl}
                      onChange={(url) => setPopupImageUrl(url)}
                      onCopyFrom={bannerImageUrl ? () => setPopupImageUrl(bannerImageUrl) : undefined}
                      copyFromLabel="Use Landing Hero"
                      previewHeightClass="h-44"
                    />
                  </div>

                  {/* 2. Landing Page Hero Image */}
                  <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-2xs">
                    <CampaignImageUploader
                      label="2. Landing Page Hero Image"
                      sublabel="Large hero photograph on /offers/:slug"
                      recommendedAspect="16:9 or Vertical Cut"
                      value={bannerImageUrl}
                      onChange={(url) => setBannerImageUrl(url)}
                      onCopyFrom={popupImageUrl ? () => setBannerImageUrl(popupImageUrl) : undefined}
                      copyFromLabel="Use Popup Image"
                      previewHeightClass="h-44"
                    />
                  </div>

                  {/* 3. Optional Mobile Image */}
                  <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-2xs">
                    <CampaignImageUploader
                      label="3. Mobile Image (Optional)"
                      sublabel="Optimized crop for smartphone screens"
                      recommendedAspect="16:9 banner"
                      value={mobileImageUrl}
                      onChange={(url) => setMobileImageUrl(url)}
                      onCopyFrom={popupImageUrl || bannerImageUrl ? () => setMobileImageUrl(popupImageUrl || bannerImageUrl) : undefined}
                      copyFromLabel="Use Main Image"
                      previewHeightClass="h-44"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. PRICING & DISCOUNT CONFIGURATION */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-4">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 text-red-600" />
                <span>3. Pricing & Discount Configuration</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pricing Model
                </label>
                <select
                  value={pricingType}
                  onChange={(e) => setPricingType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600 font-medium"
                >
                  {PRICING_TYPES.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.label}</option>
                  ))}
                </select>
              </div>

              {pricingType !== 'ENQUIRY_ONLY' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Original Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={originalPrice || ''}
                      onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 1999"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>

                  {pricingType === 'PERCENTAGE' ? (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Discount Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        placeholder="e.g. 25"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                      />
                    </div>
                  ) : pricingType === 'FIXED_DISCOUNT' ? (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Discount Amount (₹ OFF)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={discountAmountVal}
                        onChange={(e) => setDiscountAmountVal(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Offer Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        placeholder="e.g. 499"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                      />
                    </div>
                  )}

                  {/* Calculated summary pill */}
                  <div className="flex flex-col justify-end">
                    <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs">
                      <p className="font-bold">Calculated Price: ₹{effectiveOfferPrice}</p>
                      {effectiveDiscountPercent > 0 && (
                        <p className="text-[11px] text-green-700">Savings: {effectiveDiscountPercent}% OFF</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. BRANDING & CALL TO ACTION */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-4">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                <Palette className="w-4 h-4 text-red-600" />
                <span>4. Theme & Call To Action (CTA)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Modal & Page Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="light">Clean Light Surface</option>
                    <option value="dark">Charcoal Dark Surface</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 p-0.5 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Primary CTA Action
                  </label>
                  <select
                    value={ctaType}
                    onChange={(e) => setCtaType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="ENROLL_COURSE">Enrol in Online Course</option>
                    <option value="BOOK_TREATMENT">Book Varma Treatment</option>
                    <option value="ENQUIRE_OFFLINE">Enquire for Offline Classes</option>
                    <option value="REGISTER_CAMP">Register for Special Camp</option>
                    <option value="REGISTER_WORKSHOP">Register for Workshop</option>
                    <option value="CONTACT_ACADEMY">Contact Academy (WhatsApp)</option>
                    <option value="CUSTOM_URL">Custom Campaign Link</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Custom Button Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="e.g. Book Treatment Now"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                  />
                </div>

                {ctaType === 'CUSTOM_URL' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Custom Destination URL
                    </label>
                    <input
                      type="text"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="https://... or /contact"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 5. PUBLICATION STATE & POPUP BEHAVIOR */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-4">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-red-600" />
                <span>5. Publication State & Promotional Popup</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600 font-medium"
                  >
                    <option value="DRAFT">Draft (Internal Only)</option>
                    <option value="PUBLISHED">Published (Public Campaign)</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    id="showPopup"
                    checked={showPopup}
                    onChange={(e) => setShowPopup(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="showPopup" className="text-xs font-semibold text-gray-700 cursor-pointer">
                    Show as Promotional Website Popup
                  </label>
                </div>

                {showPopup && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Popup Priority (Higher loads first)
                    </label>
                    <input
                      type="number"
                      value={popupPriority}
                      onChange={(e) => setPopupPriority(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Start Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:border-red-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Expiry Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:border-red-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Booking Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bookingLimit}
                    onChange={(e) => setBookingLimit(e.target.value)}
                    placeholder="e.g. 50 seats"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="countdown"
                  checked={countdownEnabled}
                  onChange={(e) => setCountdownEnabled(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="countdown" className="text-xs font-medium text-gray-700 cursor-pointer">
                  Enable live countdown ticker on popup and campaign page
                </label>
              </div>
            </div>

            {/* 6. SUPPORT & CONTACT */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-4">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <span>6. Terms, Legal & Contact Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Support Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Offer Terms & Conditions
                </label>
                <textarea
                  rows={2}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-mono focus:outline-none focus:border-red-600 resize-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-xs transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={saving}
                  onClick={(e) => handleSubmit(e, 'DRAFT')}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={(e) => handleSubmit(e, 'PUBLISHED')}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Publish Campaign'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* PART 6: INTERACTIVE CAMPAIGN LIVE PREVIEW MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0F0F12] text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10">
            
            {/* Preview Toolbar */}
            <div className="px-5 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#141418]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Live Preview Mode
                </span>
                <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
                  <button
                    onClick={() => setPreviewMode('desktop-popup')}
                    className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                      previewMode === 'desktop-popup' ? 'bg-red-700 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop Popup</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile-popup')}
                    className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                      previewMode === 'mobile-popup' ? 'bg-red-700 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile Popup</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode('landing')}
                    className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                      previewMode === 'landing' ? 'bg-red-700 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Landing Page Hero</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
                  <button
                    onClick={() => setPreviewTheme('light')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      previewTheme === 'light' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setPreviewTheme('dark')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      previewTheme === 'dark' ? 'bg-zinc-800 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Dark
                  </button>
                </div>

                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Stage */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto flex items-center justify-center bg-black/40">
              {previewMode === 'desktop-popup' ? (
                /* Desktop 16:9 Popup Preview */
                <div className="w-full flex justify-center">
                  <PremiumCampaignPopup
                    offer={{
                      slug: slug || 'preview-campaign',
                      title: title || 'Campaign Title',
                      shortDescription: shortDescription || 'Experience authentic traditional therapy for a healthier and stronger you.',
                      bannerImageUrl,
                      popupImageUrl,
                      mobileImageUrl,
                      category,
                      customCategory,
                      branchLocation,
                      targetAudience,
                      pricingType,
                      originalPrice,
                      offerPrice: effectiveOfferPrice,
                      discountAmount: effectiveDiscountAmount,
                      discountPercent: effectiveDiscountPercent,
                      theme: previewTheme,
                      primaryColor,
                      secondaryColor,
                      ctaType,
                      ctaText,
                      ctaUrl,
                      secondaryCtaText,
                      secondaryCtaUrl,
                      countdownEnabled,
                      expiresAt: expiresAt || new Date(Date.now() + 14 * 86400000).toISOString(),
                    }}
                    isInteractivePreview={true}
                  />
                </div>
              ) : previewMode === 'mobile-popup' ? (
                /* Mobile Popup Preview (Constrained Width Container) */
                <div className="w-full max-w-[360px] flex justify-center">
                  <PremiumCampaignPopup
                    offer={{
                      slug: slug || 'preview-campaign',
                      title: title || 'Campaign Title',
                      shortDescription: shortDescription || 'Experience authentic traditional therapy for a healthier and stronger you.',
                      bannerImageUrl,
                      popupImageUrl,
                      mobileImageUrl,
                      category,
                      customCategory,
                      branchLocation,
                      targetAudience,
                      pricingType,
                      originalPrice,
                      offerPrice: effectiveOfferPrice,
                      discountAmount: effectiveDiscountAmount,
                      discountPercent: effectiveDiscountPercent,
                      theme: previewTheme,
                      primaryColor,
                      secondaryColor,
                      ctaType,
                      ctaText,
                      ctaUrl,
                      secondaryCtaText,
                      secondaryCtaUrl,
                      countdownEnabled,
                      expiresAt: expiresAt || new Date(Date.now() + 14 * 86400000).toISOString(),
                    }}
                    isInteractivePreview={true}
                  />
                </div>
              ) : (
                /* Landing Page Hero Preview (Site Warm Theme Layout) */
                <div className="w-full max-w-3xl rounded-2xl overflow-hidden border border-[#E8DDD0] bg-[#FAF6F0] text-[#2B2521] shadow-2xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-[#B12B2B] border border-red-200">
                          {category === 'CUSTOM' ? customCategory.toUpperCase() : category.replace('_', ' ')}
                        </span>
                        {branchLocation && (
                          <span className="text-[10px] text-[#5C5148] font-semibold bg-white border border-[#E8DDD0] px-2 py-0.5 rounded-full">
                            📍 {branchLocation}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-black font-heading leading-tight text-[#2B2521]">
                        {title || 'Campaign Title'}
                      </h2>
                      <p className="text-xs text-[#5C5148] leading-relaxed line-clamp-3">
                        {description || shortDescription || 'Campaign description overview...'}
                      </p>
                      <div className="flex items-baseline gap-3 pt-1">
                        <span className="text-3xl font-black font-heading text-[#B12B2B]">
                          ₹{effectiveOfferPrice.toLocaleString('en-IN')}
                        </span>
                        {originalPrice > effectiveOfferPrice && (
                          <span className="text-base text-[#8C7E72] line-through">
                            ₹{originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          style={{ backgroundColor: primaryColor }}
                          className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md"
                        >
                          {ctaText || 'Book Session Now'}
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-5 relative">
                      <div className="rounded-2xl overflow-hidden border-4 border-white bg-white shadow-xl h-56">
                        <img
                          src={bannerImageUrl || popupImageUrl || '/images/wellness-682x1024.png'}
                          alt="Hero Preview"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { ResponsiveImage } from '../../components/common/ResponsiveImage';
import { ShareButton } from '../../components/common/ShareButton';
import { ProductCard } from '../../components/common/ProductCard';
import { productApi } from '../../lib/api/productApi';
import type { Product } from '../../lib/api/productApi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Check,
  Minus,
  Plus,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  PackageCheck,
  Trash2,
  Edit2,
  Download,
  BookOpen,
  CheckCircle,
  ShieldCheck,
  FileText,
  Sparkles,
  HelpCircle,
  Truck,
  MessageCircle,
  Zap,
} from 'lucide-react';

export const ProductDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'policies'>('overview');
  const [openPolicy, setOpenPolicy] = useState<string | null>('download');
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);

  const heroCtaRef = useRef<HTMLDivElement>(null);

  const [downloadAccess, setDownloadAccess] = useState<{
    hasAccess: boolean;
    isDigital: boolean;
    fileName?: string;
    fileType?: string;
    fileSize?: string;
  } | null>(null);

  useEffect(() => {
    if (slug) {
      loadProduct(slug);
      window.scrollTo(0, 0);
    }
  }, [slug]);

  // Observer to track when hero CTA leaves the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolledPastHero(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (heroCtaRef.current) {
      observer.observe(heroCtaRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [product]);

  const loadProduct = async (productSlug: string) => {
    try {
      setLoading(true);
      const res = await productApi.getProductBySlug(productSlug);
      if (res.success && res.data) {
        setProduct(res.data);
        setSelectedImageIndex(0);
        setQuantity(1);

        // Populate related products
        if (res.data.relatedProducts && res.data.relatedProducts.length > 0) {
          setRelatedProducts(res.data.relatedProducts);
        } else {
          // Fetch catalog fallback products
          productApi.getProducts({ limit: 6 }).then((catRes) => {
            if (catRes.success && catRes.data) {
              setRelatedProducts(catRes.data.filter((p) => p.id !== res.data.id).slice(0, 4));
            }
          }).catch(console.error);
        }

        if (res.data.isDigital) {
          productApi
            .checkAccess(res.data.id)
            .then((accessRes) => {
              if (accessRes.success && accessRes.data) {
                setDownloadAccess(accessRes.data);
              }
            })
            .catch(console.error);
        }
      }
    } catch (err) {
      console.error('Failed to load product', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const success = addToCart(product, quantity);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    const success = addToCart(product, quantity);
    if (success) {
      navigate('/checkout');
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await productApi.deleteProduct(product.id);
      if (res.success) {
        alert(`Product "${product.name}" has been deleted.`);
        navigate('/products');
      } else {
        alert((res as any)?.error?.message || 'Failed to delete product');
      }
    } catch (err: any) {
      console.error('Delete product error', err);
      alert(err?.message || 'Failed to delete product');
    }
  };

  const scrollToSection = (id: 'overview' | 'specs' | 'policies') => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -130; // accounts for main navbar + sticky sub-header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-jadmaa-red/30 border-t-jadmaa-red rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#5C5148] uppercase tracking-wider">
            Loading authentic product details...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xs border border-[#E8DDD0]">
          <AlertCircle className="w-12 h-12 text-[#B12B2B] mx-auto mb-3" />
          <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-xs text-[#5C5148] mb-6">
            The item you are searching for might be out of catalog or temporarily unavailable.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-xs font-bold rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity <= 0;
  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[selectedImageIndex] || '/images/course-basic.jpg';

  const categoryName =
    typeof product.category === 'object' && product.category !== null
      ? (product.category as any).name
      : typeof product.category === 'string' && product.category.trim()
      ? product.category
      : product.isDigital
      ? 'Digital Guide'
      : 'Siddha Literature';

  const hasDiscount = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const savingsAmount = hasDiscount ? product.compareAtPrice! - product.price : 0;
  const discountPercent =
    product.discountPercentage ||
    (hasDiscount ? Math.round((savingsAmount / product.compareAtPrice!) * 100) : 0);

  // Dynamic 3 concise bullet highlights (scannable in 2 seconds)
  const bullets = product.isDigital
    ? [
        product.name.toLowerCase().includes('20') || product.name.toLowerCase().includes('manuscript')
          ? '20 Rare Siddhar Varma Manuscripts (1.0 GB Archive)'
          : 'Complete Authenticated Digital Reference Archive',
        'Instant Digital Access After Payment (Direct Cloud Download)',
        'Authentic JADMAA Varmakalai Lineage Resource',
      ]
    : [
        '100% Authentic Traditional Martial Arts Gear',
        'Directly Verified by JADMAA Master Trainers',
        'Dispatched via Tracked Priority Courier Delivery',
      ];

  return (
    <>
      <SEO
        title={(product as any).metaTitle || `${product.name} | JADMAA Official Store`}
        description={(product as any).metaDesc || product.description?.slice(0, 160)}
        keywords={(product as any).keywords || `${product.name}, varmakalai store, martial arts books`}
        image={currentImage}
        url={`/products/${product.slug}`}
        type="product"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description?.slice(0, 160),
          image: currentImage,
          sku: product.sku,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'INR',
            availability:
              product.stockQuantity > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
          },
        }}
      />

      {/* ── 1. STICKY PRODUCT SUB-HEADER BAR (SAMSUNG STYLE) ── */}
      <div className="sticky top-[56px] sm:top-[64px] lg:top-[68px] z-30 bg-white/95 backdrop-blur-md border-b border-[#E8DDD0] shadow-2xs transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-13 sm:h-14 gap-3">
            {/* Left: Product Title + Quick Anchor Navigation */}
            <div className="flex items-center gap-6 min-w-0">
              <div className="min-w-0 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B12B2B] hidden md:block">
                  {categoryName}
                </span>
                <h2 className="text-xs sm:text-sm font-bold text-[#2B2521] truncate max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md">
                  {product.name}
                </h2>
              </div>

              {/* Desktop Anchor Tabs */}
              <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => scrollToSection('overview')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-[#FAF6F0] text-[#B12B2B] font-bold'
                      : 'text-[#5C5148] hover:text-[#2B2521]'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('specs')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'specs'
                      ? 'bg-[#FAF6F0] text-[#B12B2B] font-bold'
                      : 'text-[#5C5148] hover:text-[#2B2521]'
                  }`}
                >
                  Details & Specs
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('policies')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'policies'
                      ? 'bg-[#FAF6F0] text-[#B12B2B] font-bold'
                      : 'text-[#5C5148] hover:text-[#2B2521]'
                  }`}
                >
                  Policies & Support
                </button>
              </nav>
            </div>

            {/* Right: Price + Compact Primary CTA */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm sm:text-base font-extrabold text-[#2B2521]">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {hasDiscount && (
                    <span className="text-[10px] text-gray-400 line-through hidden sm:inline">
                      ₹{product.compareAtPrice?.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <span className="text-[9px] text-emerald-700 font-bold block sm:hidden">
                    Save ₹{savingsAmount}
                  </span>
                )}
              </div>

              {/* Compact CTA */}
              {isAdmin ? (
                <Link
                  to={`/admin#products?edit=${product.id}`}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit in Admin</span>
                </Link>
              ) : product.isDigital && downloadAccess?.hasAccess ? (
                <a
                  href={productApi.getDownloadUrl(product.id)}
                  download={product.fileName || 'Rare_Siddhar_Varma_20_Books_Collection.rar'}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      added
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-[#B12B2B] text-[#B12B2B] hover:bg-red-50'
                    }`}
                  >
                    {added ? <Check className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                    <span>{added ? 'Added' : 'Add to Cart'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="px-3.5 sm:px-4 py-1.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Buy Now</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. FULL-VIEWPORT EDITORIAL PAGE CANVAS (NO BOXED WRAPPER) ── */}
      <div className="bg-[#FAF6F0] min-h-screen text-left pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-[#7A6E65] pb-3 sm:pb-4 overflow-x-auto no-scrollbar">
            <Link to="/" className="hover:text-[#B12B2B] transition">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            <Link to="/products" className="hover:text-[#B12B2B] transition">Shop</Link>
            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-[#B12B2B] font-semibold">{categoryName}</span>
            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
          </nav>

          {/* ── ABOVE-THE-FOLD HERO SPLIT (SINGLE-VIEW SIGHTLINE) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            
            {/* Left Column (lg:col-span-6 — Sticky Product Gallery) */}
            <div className="lg:col-span-6 lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-[#E8DDD0] p-2.5 sm:p-4 shadow-2xs relative flex flex-col items-center justify-center overflow-hidden">
                
                {/* Format / Stock Badge (Top Left) */}
                <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                  {product.isDigital ? (
                    <span className="bg-amber-600/95 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md shadow-2xs flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" />
                      <span>Digital eBook</span>
                    </span>
                  ) : isOutOfStock ? (
                    <span className="bg-red-600/90 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md shadow-2xs">
                      Sold Out
                    </span>
                  ) : product.stockQuantity < 5 ? (
                    <span className="bg-amber-600/90 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md shadow-2xs">
                      Only {product.stockQuantity} Left
                    </span>
                  ) : (
                    <span className="bg-emerald-700/90 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md shadow-2xs">
                      In Stock
                    </span>
                  )}
                </div>

                {/* Share Button (Top Right) */}
                <div className="absolute top-3 right-3 z-10">
                  <ShareButton
                    title={product.name}
                    url={`/products/${product.slug}`}
                    variant="icon"
                    iconSize={15}
                    className="w-8 h-8 bg-white/90 backdrop-blur-xs shadow-2xs hover:bg-white"
                  />
                </div>

                {/* Main Image Frame (Constrained so CTA is always visible above fold) */}
                <div className="w-full h-[30vh] sm:h-[34vh] lg:h-[380px] xl:h-[430px] max-h-[430px] flex items-center justify-center overflow-hidden">
                  <ResponsiveImage
                    src={currentImage}
                    alt={product.name}
                    priority={true}
                    width={560}
                    height={560}
                    aspectRatio="1/1"
                    className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-105"
                    fallbackSrc="/images/course-basic.jpg"
                  />
                </div>
              </div>

              {/* Thumbnail Strip if Multiple Images */}
              {images.length > 1 && (
                <div className="flex gap-2 sm:gap-2.5 mt-2.5 sm:mt-3 overflow-x-auto no-scrollbar pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition cursor-pointer flex-shrink-0 bg-white p-1 ${
                        selectedImageIndex === idx
                          ? 'border-[#B12B2B] shadow-2xs'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ResponsiveImage
                        src={img}
                        alt={`thumb-${idx}`}
                        width={60}
                        height={60}
                        aspectRatio="1/1"
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column (lg:col-span-6 — Instant Purchase & Key Highlights) */}
            <div className="lg:col-span-6 flex flex-col justify-start space-y-3 sm:space-y-4">
              
              {/* Category Breadcrumb / Tag */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#B12B2B] bg-red-50/80 px-2.5 py-0.5 rounded-full border border-red-100">
                  {categoryName}
                </span>
                <span className="text-[11px] font-mono text-gray-400">
                  SKU: {product.sku || 'JADMAA-PROD'}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-[#2B2521] leading-snug">
                {product.name}
              </h1>

              {/* Format / Delivery Pill Badges (1 compact row) */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                {product.isDigital ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 rounded-lg font-bold border border-amber-200/80">
                      <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                      <span>Digital eBook (Instant Download)</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg font-mono font-bold uppercase text-[11px]">
                      .{product.fileType || 'RAR'} Archive
                    </span>
                    {product.fileSize && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg font-semibold text-[11px]">
                        {product.fileSize}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-900 rounded-lg font-bold border border-emerald-200/80">
                      <Truck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Authentic Physical Item</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[11px] font-medium">
                      Tracked Courier Delivery
                    </span>
                  </>
                )}
              </div>

              {/* Key Bullet Highlights (Max 3 concise bullets, scannable in 2 seconds) */}
              <div className="bg-white/80 rounded-xl border border-[#E8DDD0]/80 p-3 sm:p-3.5 space-y-1.5 text-xs sm:text-[13px] text-[#5C5148]">
                {bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#B12B2B] shrink-0 mt-0.5" />
                    <span className="font-medium text-[#2B2521]">{bullet}</span>
                  </div>
                ))}
              </div>

              {/* ── HIGHLIGHTED PRICE & ACTION BOX ── */}
              <div
                ref={heroCtaRef}
                className="bg-white border border-[#E8DDD0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
              >
                {/* Price Display */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl sm:text-3xl font-heading font-extrabold text-[#2B2521]">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm sm:text-base text-gray-400 line-through">
                          ₹{product.compareAtPrice?.toLocaleString('en-IN')}
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                          Save ₹{savingsAmount.toLocaleString('en-IN')} ({discountPercent}% OFF)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Inclusive of all taxes • Instant delivery verified
                    </p>
                  </div>

                  {/* Stock Notice */}
                  <div className="text-right">
                    {product.isDigital ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Instant Access</span>
                      </span>
                    ) : isOutOfStock ? (
                      <span className="text-xs font-bold text-red-600">Currently Out of Stock</span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-600">
                        Stock: <strong className="font-bold text-gray-900">{product.stockQuantity}</strong> units
                      </span>
                    )}
                  </div>
                </div>

                {/* Digital eBook Owned Download Banner */}
                {product.isDigital && downloadAccess?.hasAccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>You already own this eBook collection!</span>
                    </div>
                    <a
                      href={productApi.getDownloadUrl(product.id)}
                      download={product.fileName || 'Rare_Siddhar_Varma_20_Books_Collection.rar'}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        Download eBook ({product.fileType?.toUpperCase() || 'RAR'}
                        {product.fileSize ? ` • ${product.fileSize}` : ''})
                      </span>
                    </a>
                  </div>
                )}

                {/* Admin Mode Controls */}
                {isAdmin ? (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                      <span className="w-2 h-2 rounded-full bg-[#B12B2B] animate-pulse" />
                      <span>Administrator Mode</span>
                    </div>
                    <p className="text-[11px] text-amber-900/80 leading-snug">
                      As an admin, you can edit pricing, assets, and descriptions, or delete this product.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Link
                        to={`/admin#products?edit=${product.id}`}
                        className="flex-1 py-2 px-3 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-xs font-bold rounded-lg transition text-center flex items-center justify-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Product</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleDeleteProduct}
                        className="py-2 px-3 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Quantity Picker for Physical Items */}
                    {!product.isDigital && !isOutOfStock && (
                      <div className="flex items-center justify-between gap-4 pt-1">
                        <span className="text-xs font-bold text-gray-700">Quantity</span>
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 transition cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-4 py-1.5 text-xs font-bold text-gray-900 bg-white min-w-[36px] text-center">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                            disabled={quantity >= product.stockQuantity}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 transition cursor-pointer disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Primary Action Buttons (Add to Cart & Buy Now) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`h-12 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed ${
                          added
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border-2 border-[#B12B2B] text-[#B12B2B] hover:bg-red-50'
                        }`}
                      >
                        {added ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Added to Cart!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        className="h-12 px-6 bg-[#B12B2B] hover:bg-[#8F2020] text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Trust Badges Row */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500 text-center font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Authentic Lineage</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>WhatsApp Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. BELOW-THE-FOLD SCROLLABLE CONTENT SECTIONS ── */}
          <div className="mt-12 sm:mt-16 space-y-12 sm:space-y-16">
            
            {/* Section 1: Overview & Full Description */}
            <section id="overview" className="scroll-mt-36">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8DDD0] p-6 sm:p-10 shadow-2xs space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <FileText className="w-5 h-5 text-[#B12B2B]" />
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#2B2521]">
                    Product Overview & Contents
                  </h2>
                </div>

                <div className="prose prose-sm sm:prose text-[#5C5148] max-w-none leading-relaxed whitespace-pre-line">
                  {product.description || (
                    <p>
                      This comprehensive resource from the JADMAA Varmakalai & Siddha Research
                      Foundation provides authenticated training knowledge, anatomical diagrams, and
                      traditional practices handed down through master lineages.
                    </p>
                  )}
                </div>

                {/* Key Pillars / Benefits Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#E8DDD0]/70 space-y-1.5">
                    <span className="text-xs font-bold text-[#B12B2B] uppercase tracking-wider block">
                      Preserved Heritage
                    </span>
                    <h4 className="text-sm font-bold text-[#2B2521]">Original Manuscript Lineage</h4>
                    <p className="text-xs text-[#5C5148] leading-relaxed">
                      Sourced from historical palm-leaf manuscripts and verified Siddha literature.
                    </p>
                  </div>

                  <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#E8DDD0]/70 space-y-1.5">
                    <span className="text-xs font-bold text-[#B12B2B] uppercase tracking-wider block">
                      Practical Guidance
                    </span>
                    <h4 className="text-sm font-bold text-[#2B2521]">Comprehensive Insights</h4>
                    <p className="text-xs text-[#5C5148] leading-relaxed">
                      Detailed breakdowns of vital points, treatments, and traditional martial applications.
                    </p>
                  </div>

                  <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#E8DDD0]/70 space-y-1.5">
                    <span className="text-xs font-bold text-[#B12B2B] uppercase tracking-wider block">
                      Lifetime Access
                    </span>
                    <h4 className="text-sm font-bold text-[#2B2521]">Instant Cloud Delivery</h4>
                    <p className="text-xs text-[#5C5148] leading-relaxed">
                      Permanent download access linked directly to your student registration profile.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Specifications & Format Details */}
            <section id="specs" className="scroll-mt-36">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8DDD0] p-6 sm:p-10 shadow-2xs space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <Layers className="w-5 h-5 text-[#B12B2B]" />
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#2B2521]">
                    Specifications & Format Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-500 font-medium">Product Category</span>
                    <span className="font-bold text-gray-900">{categoryName}</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-500 font-medium">Edition / Format</span>
                    <span className="font-bold text-gray-900">
                      {product.isDigital ? 'Digital Archive / eBook' : 'Physical Gear / Printed Material'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-500 font-medium">File Format</span>
                    <span className="font-bold font-mono text-gray-900 uppercase">
                      {product.fileType ? `.${product.fileType}` : product.isDigital ? '.RAR Archive' : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-500 font-medium">Archive / File Size</span>
                    <span className="font-bold text-gray-900">
                      {product.fileSize || (product.isDigital ? '1.0 GB Archive' : 'Standard Shipping Weight')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-500 font-medium">Language</span>
                    <span className="font-bold text-gray-900">Tamil & English Commentary</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-500 font-medium">Publisher / Authority</span>
                    <span className="font-bold text-gray-900">JADMAA Varmakalai Academy</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-500 font-medium">Access Type</span>
                    <span className="font-bold text-gray-900">
                      {product.isDigital ? 'Permanent Cloud Download' : 'Dispatched via Courier'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-500 font-medium">Product SKU</span>
                    <span className="font-bold font-mono text-gray-900">{product.sku || 'JADMAA-PROD'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Policies & Support (Collapsible Accordion) */}
            <section id="policies" className="scroll-mt-36">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8DDD0] p-6 sm:p-10 shadow-2xs space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <ShieldCheck className="w-5 h-5 text-[#B12B2B]" />
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#2B2521]">
                    Policies, Delivery & Support
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* Accordion 1: Delivery & Download Process */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenPolicy(openPolicy === 'download' ? null : 'download')}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100/80 transition flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                        <Download className="w-4 h-4 text-[#B12B2B]" />
                        <span>Instant Download & Delivery Process</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          openPolicy === 'download' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openPolicy === 'download' && (
                      <div className="p-4 sm:p-5 bg-white text-xs sm:text-sm text-[#5C5148] leading-relaxed border-t border-gray-100 space-y-2">
                        <p>
                          For digital items, your download link is activated immediately upon successful
                          Razorpay payment. You can download the complete archive directly from your
                          order confirmation screen or your student portal anytime.
                        </p>
                        <p>
                          Physical merchandise is safely packed and dispatched within 24–48 hours via
                          reputed courier services with tracking information sent via SMS and email.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Accordion 2: Authenticity & Lineage Guarantee */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenPolicy(openPolicy === 'authenticity' ? null : 'authenticity')}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100/80 transition flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#B12B2B]" />
                        <span>Authenticity & Lineage Guarantee</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          openPolicy === 'authenticity' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openPolicy === 'authenticity' && (
                      <div className="p-4 sm:p-5 bg-white text-xs sm:text-sm text-[#5C5148] leading-relaxed border-t border-gray-100 space-y-2">
                        <p>
                          Every publication and training manual is vetted by Master Trainer and senior
                          lineage disciples of JADMAA Varmakalai. The texts retain original Tamil verses
                          alongside clear explanatory commentaries for accurate, safe learning.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Accordion 3: Help & WhatsApp Support */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenPolicy(openPolicy === 'support' ? null : 'support')}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100/80 transition flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[#B12B2B]" />
                        <span>Customer Support & Helpline</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          openPolicy === 'support' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openPolicy === 'support' && (
                      <div className="p-4 sm:p-5 bg-white text-xs sm:text-sm text-[#5C5148] leading-relaxed border-t border-gray-100 space-y-3">
                        <p>
                          Need help opening your downloaded archive or have inquiries about traditional
                          equipment? Our team is available on WhatsApp and email to assist you.
                        </p>
                        <div className="flex flex-wrap gap-3 pt-1">
                          <a
                            href="https://wa.me/919944686996?text=Hi%20JADMAA%2C%20I%20have%20a%20question%20regarding%20a%20store%20product"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp Helpline (+91 99446 86996)</span>
                          </a>
                          <a
                            href="mailto:support@jadmaa.com"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition"
                          >
                            <span>support@jadmaa.com</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── 4. RELATED PRODUCTS SECTION (PEEK-CAROUSEL ON MOBILE) ── */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="py-12 sm:py-16 bg-[#F2EDE4] border-t border-[#E8DDD0] text-left">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DDD0]">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#B12B2B]">
                  Explore Catalog
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[#2B2521]">
                  Related Literature & Gear
                </h3>
              </div>
              <Link
                to="/products"
                className="text-xs font-bold text-[#B12B2B] hover:underline flex items-center gap-1"
              >
                <span>View Full Store</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile horizontal peek-carousel; tablet/desktop grid */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 sm:gap-5 pb-4 px-4 -mx-4 sm:px-0 sm:mx-0 no-scrollbar md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible">
              {relatedProducts.map((rp) => (
                <div
                  key={rp.id}
                  className="w-[76vw] max-w-[280px] sm:w-auto sm:max-w-none shrink-0 snap-start"
                >
                  <ProductCard
                    product={rp}
                    isAdmin={isAdmin}
                    onAddToCart={(p) => addToCart(p, 1)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. MOBILE FIXED BOTTOM ACTION BAR (STICKY THUMB REACH) ── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8DDD0] px-4 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-[#2B2521]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-gray-400 line-through">
                ₹{product.compareAtPrice?.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold block truncate">
            {product.isDigital ? 'Instant Digital Download' : 'Tracked Delivery'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin ? (
            <Link
              to={`/admin#products?edit=${product.id}`}
              className="px-4 py-2.5 bg-[#B12B2B] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Edit Item
            </Link>
          ) : product.isDigital && downloadAccess?.hasAccess ? (
            <a
              href={productApi.getDownloadUrl(product.id)}
              download={product.fileName || 'Rare_Siddhar_Varma_20_Books_Collection.rar'}
              className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`p-2.5 rounded-xl border text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  added
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'border-[#B12B2B] text-[#B12B2B] bg-white'
                }`}
                aria-label="Add to cart"
              >
                {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="px-5 py-2.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Buy Now</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

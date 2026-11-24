import React, { useState, useEffect } from 'react';
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
  Truck,
  Layers,
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
  const [openPolicy, setOpenPolicy] = useState<string | null>('download');

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
        product.name.toLowerCase().includes('book') ||
        product.name.toLowerCase().includes('siddhar') ||
        product.name.toLowerCase().includes('manuscript') ||
        product.name.toLowerCase().includes('20')
          ? '20 Rare Siddhar Varma Manuscripts (1.0 GB Archive)'
          : 'Complete Authenticated Digital Reference Archive',
        'Instant Digital Access After Payment',
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

      {/* ── FULL-VIEWPORT EDITORIAL PAGE CANVAS (NO BOXED WRAPPER) ── */}
      <div className="bg-[#FAF6F0] min-h-screen text-left pb-12 sm:pb-16">
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
                      <span className="text-xs font-bold text-emerald-700">Instant Access</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`h-9 sm:h-10 px-3.5 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed ${
                          added
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border-2 border-[#B12B2B] text-[#B12B2B] hover:bg-red-50'
                        }`}
                      >
                        {added ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added to Cart!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        className="h-9 sm:h-10 px-4 sm:px-5 bg-[#B12B2B] hover:bg-[#8F2020] text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── 3. BELOW-THE-FOLD SCROLLABLE CONTENT SECTIONS ── */}
          <div className="mt-12 sm:mt-16 space-y-12 sm:space-y-16">
            
            {/* Section 1: Overview & Description */}
            <section id="overview" className="scroll-mt-36">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8DDD0] p-6 sm:p-10 shadow-2xs space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <FileText className="w-5 h-5 text-[#B12B2B]" />
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#2B2521]">
                    Product Overview & Description
                  </h2>
                </div>

                <div className="prose prose-sm sm:prose text-[#5C5148] max-w-none leading-relaxed whitespace-pre-line">
                  {product.description || (
                    <p className="text-gray-400 italic">No description provided for this product.</p>
                  )}
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
                    <span className="font-bold text-gray-900">Tamil</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-500 font-medium">Publisher / Authority</span>
                    <span className="font-bold text-gray-900">JADMAA Varmakalai Academy</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-500 font-medium">Access Type</span>
                    <span className="font-bold text-gray-900">
                      {product.isDigital ? 'Direct Download' : 'Dispatched via Courier'}
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

                  {/* Accordion 3: Support & Queries Policy */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenPolicy(openPolicy === 'support' ? null : 'support')}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100/80 transition flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#B12B2B]" />
                        <span>Support & Replacement Policy</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          openPolicy === 'support' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openPolicy === 'support' && (
                      <div className="p-4 sm:p-5 bg-white text-xs sm:text-sm text-[#5C5148] leading-relaxed border-t border-gray-100 space-y-2">
                        <p>
                          For any queries regarding product downloads, delivery, or replacements, please contact our team via our{' '}
                          <Link to="/contact" className="text-[#B12B2B] font-semibold underline">Contact page</Link> or email{' '}
                          <a href="mailto:support@jadmaa.com" className="text-[#B12B2B] font-semibold underline">support@jadmaa.com</a>.
                        </p>
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
    </>
  );
};

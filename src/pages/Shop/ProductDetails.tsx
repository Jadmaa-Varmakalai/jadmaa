import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { ResponsiveImage } from '../../components/common/ResponsiveImage';
import { productApi } from '../../lib/api/productApi';
import type { Product } from '../../lib/api/productApi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  PackageCheck,
  Sliders,
  Trash2,
  Edit2,
} from 'lucide-react';

export const ProductDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleDeleteProduct = async () => {
    if (!product) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`)) {
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

  useEffect(() => {
    if (slug) {
      loadProduct(slug);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-jadmaa-red/30 border-t-jadmaa-red rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xs border border-gray-100">
          <AlertCircle className="w-12 h-12 text-jadmaa-red mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-xs text-gray-500 mb-6">
            The item you are searching for might be out of catalog or temporarily unavailable.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-jadmaa-red hover:bg-red-700 text-white text-xs font-bold rounded-xl transition"
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
  const currentImage = images[selectedImageIndex] || '';

  return (
    <>
      <SEO
        title={`${product.name} | JADMAA Official Store`}
        description={product.description?.slice(0, 160)}
      />

      <div className="bg-[#FAF6F0] min-h-screen py-8 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 overflow-x-auto no-scrollbar py-1">
            <Link to="/" className="hover:text-jadmaa-red transition">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <Link to="/products" className="hover:text-jadmaa-red transition">Shop</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-900 font-semibold truncate max-w-xs">{product.name}</span>
          </nav>

          {/* Product Hero: Images & Purchase Panel */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
              
              {/* Left Column: Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-square w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                  {currentImage ? (
                    <ResponsiveImage
                      src={currentImage}
                      alt={product.name}
                      priority={true}
                      width={600}
                      height={600}
                      aspectRatio="1/1"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-300 flex flex-col items-center">
                      <ShoppingBag className="w-16 h-16 mb-2" />
                      <span className="text-xs">No image provided</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip if multiple images */}
                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition cursor-pointer flex-shrink-0 ${
                          selectedImageIndex === idx ? 'border-jadmaa-red shadow-xs' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <ResponsiveImage src={img} alt={`thumb-${idx}`} width={80} height={80} aspectRatio="1/1" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Info & Actions */}
              <div className="flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-jadmaa-charcoal leading-tight">
                    {product.name}
                  </h1>

                  {/* Price */}
                  <div className="flex items-baseline gap-3 pt-1">
                    <span className="text-3xl font-extrabold text-jadmaa-charcoal">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Inclusive of all taxes</span>
                  </div>

                  {/* Stock Status Indicator */}
                  <div className="pt-2">
                    {isOutOfStock ? (
                      <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span>Currently Out of Stock</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                        <PackageCheck className="w-4 h-4 text-emerald-600" />
                        <span>Available Stock: <strong className="font-extrabold">{product.stockQuantity}</strong> units</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="pt-2 border-t border-gray-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Purchasing Section */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  {isAdmin ? (
                    <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-jadmaa-red"></span>
                        <span>Administrator Privileges</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        You are viewing this product with administrator privileges. Cart and checkout are reserved for customers. You can edit this item or delete it completely.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <Link
                          to={`/admin#products?edit=${product.id}`}
                          className="inline-flex items-center justify-center gap-2 flex-1 py-3 px-4 bg-jadmaa-red hover:bg-[#8C1E1E] text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit Product</span>
                        </Link>
                        <button
                          onClick={handleDeleteProduct}
                          className="inline-flex items-center justify-center gap-2 flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Product</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {!isOutOfStock && (
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-gray-700">Quantity:</span>
                          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                            <button
                              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                              className="px-3 py-2 text-gray-600 hover:bg-gray-200 transition cursor-pointer"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 text-sm font-bold text-gray-900 bg-white min-w-[40px] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                              disabled={quantity >= product.stockQuantity}
                              className="px-3 py-2 text-gray-600 hover:bg-gray-200 transition cursor-pointer disabled:opacity-30"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-xs text-gray-400">Max: {product.stockQuantity} units</span>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={handleAddToCart}
                          disabled={isOutOfStock}
                          className={`py-3.5 px-6 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${
                            added
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border-2 border-jadmaa-red text-jadmaa-red hover:bg-red-50'
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
                          onClick={handleBuyNow}
                          disabled={isOutOfStock}
                          className="py-3.5 px-6 bg-jadmaa-red hover:bg-red-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Related Products */}
          {product.relatedProducts && product.relatedProducts.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-heading font-extrabold text-jadmaa-charcoal">
                  More Products in Store
                </h3>
                <Link
                  to="/products"
                  className="text-xs font-bold text-jadmaa-red hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {product.relatedProducts.map((rp) => (
                  <Link
                    key={rp.id}
                    to={`/products/${rp.slug}`}
                    className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition p-4 flex flex-col group overflow-hidden"
                  >
                    <div className="w-full h-44 bg-gray-50 rounded-xl overflow-hidden mb-3">
                      {rp.images && rp.images[0] ? (
                        <ResponsiveImage
                          src={rp.images[0]}
                          alt={rp.name}
                          width={240}
                          height={240}
                          aspectRatio="1/1"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-jadmaa-red transition">
                      {rp.name}
                    </h4>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-sm font-extrabold text-jadmaa-charcoal">
                        ₹{rp.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

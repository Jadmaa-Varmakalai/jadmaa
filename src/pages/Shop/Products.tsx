import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { ResponsiveImage } from '../../components/common/ResponsiveImage';
import { productApi } from '../../lib/api/productApi';
import type { Product, ProductCategory } from '../../lib/api/productApi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { EditableText } from '../../components/common/EditableText';
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Package,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react';

export const Products: React.FC = () => {
  const { user } = useAuth();
  const { isEditing } = useSettings();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const { addToCart } = useCart();

  const handleDeleteProduct = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete "${product.name}"? This will permanently remove it from the store.`)) {
      return;
    }

    try {
      const res = await productApi.deleteProduct(product.id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        alert(`Product "${product.name}" successfully deleted.`);
      } else {
        alert((res as any)?.error?.message || 'Failed to delete product');
      }
    } catch (err: any) {
      console.error('Delete product error', err);
      alert(err?.message || 'Failed to delete product');
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchQuery, sortBy, inStockOnly]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getProducts({
        search: searchQuery.trim() || undefined,
        sort: sortBy,
        inStockOnly: inStockOnly || undefined,
      });

      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    const success = addToCart(product, 1);
    if (success) {
      setAddedIds((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      }, 1500);
    }
  };

  return (
    <>
      <SEO
        title="Store & Gear | JADMAA Varmakalai"
        description="Shop authentic martial arts uniforms, sparring protection, traditional weapons, and JADMAA training gear."
      />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-[#F5EFEB] to-[#FAF6F0] border-b border-[#E8DDD0] py-10 md:py-14 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-jadmaa-red/5 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-5xl font-heading font-extrabold text-jadmaa-charcoal tracking-tight">
              <EditableText
                settingKey="shop.hero.title"
                defaultText='Dojo Gear & <span class="text-jadmaa-red">Martial Arts Equipment</span>'
              />
            </h1>
            <p className="text-base sm:text-lg text-[#5C5148] leading-relaxed">
              <EditableText
                settingKey="shop.hero.subtitle"
                defaultText="Equip your journey with authentic uniforms, sparring protection, master belts, and training equipment for practitioners."
                multiline
              />
            </p>
          </div>
        </div>
      </section>

      {/* Admin Quick Action Banner on Public Store */}
      {isAdmin && (
        <div className="bg-amber-50/90 border-b border-amber-200 py-3.5 px-4 sm:px-6 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-950 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-jadmaa-red animate-pulse shrink-0" />
              <span>Administrator Mode: You can create new products, set pricing, and manage inventory.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/admin#products?create=true"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-jadmaa-red hover:bg-[#8C1E1E] text-white font-bold rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create Product</span>
              </Link>
              <Link
                to="/admin#products"
                className="px-3.5 py-2 bg-white hover:bg-gray-100 border border-amber-300 text-amber-900 font-bold rounded-xl transition"
              >
                Manage Catalog
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Catalog Section */}
      <section className="py-10 bg-[#FAF6F0] min-h-screen text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Controls: Search, Category Pills, Filter & Sort */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-jadmaa-red/20 focus:border-jadmaa-red transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Sort & In-Stock Filter */}
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none bg-gray-50 px-3 py-2 rounded-xl border border-gray-200/80 hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 text-jadmaa-red rounded focus:ring-jadmaa-red border-gray-300"
                  />
                  <span>In Stock Only</span>
                </label>

                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/80">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-500 font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-4 animate-pulse"
                >
                  <div className="w-full h-52 bg-gray-100 rounded-xl" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-6 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 bg-red-50 text-jadmaa-red rounded-full flex items-center justify-center mx-auto mb-2">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {isAdmin ? 'No Products in Store Catalog Yet' : 'No products found'}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                {isAdmin
                  ? 'As an administrator, you can add and publish products right now with their name, category, price, stock, and photos.'
                  : "We couldn't find any items matching your selected filters or search terms."}
              </p>
              {isAdmin ? (
                <Link
                  to="/admin#products?create=true"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-jadmaa-red hover:bg-[#8C1E1E] text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create Product</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setInStockOnly(false);
                  }}
                  className="px-5 py-2.5 bg-jadmaa-red hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const isOutOfStock = product.stockQuantity <= 0;
                const isJustAdded = addedIds[product.id];

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group overflow-hidden"
                  >
                    {/* Image Area */}
                    <Link
                      to={`/products/${product.slug}`}
                      className="relative block w-full h-56 bg-gray-50 overflow-hidden"
                    >
                      {product.images && product.images[0] ? (
                        <ResponsiveImage
                          src={product.images[0]}
                          alt={product.name}
                          width={360}
                          height={224}
                          aspectRatio="16/10"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingBag className="w-12 h-12" />
                        </div>
                      )}

                      {/* Stock Status Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        {isOutOfStock ? (
                          <span className="bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            {product.stockQuantity} in stock
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Content Area */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Title */}
                        <Link to={`/products/${product.slug}`}>
                          <h3 className="font-heading font-bold text-sm sm:text-base text-gray-900 line-clamp-2 hover:text-jadmaa-red transition">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Stock Quantity Display */}
                        <div>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200/60">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Out of stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                              <Package className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Remaining Stock: {product.stockQuantity}</span>
                            </span>
                          )}
                        </div>

                        {/* Short Description */}
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      {/* Price & Action */}
                      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-extrabold text-jadmaa-charcoal">
                              ₹{product.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">Inclusive of all taxes</span>
                        </div>

                        {isAdmin ? (
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/admin#products?edit=${product.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-2xs"
                              title="Edit in Admin Panel"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </Link>
                            <button
                              onClick={(e) => handleDeleteProduct(e, product)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 shadow-2xs cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={isOutOfStock}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs ${
                              isJustAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-jadmaa-red hover:bg-red-700 text-white'
                            }`}
                            title={isOutOfStock ? 'Product is currently sold out' : 'Add to cart'}
                          >
                            {isJustAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

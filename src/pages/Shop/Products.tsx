import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { ResponsiveImage } from '../../components/common/ResponsiveImage';
import { ShareButton } from '../../components/common/ShareButton';
import { ProductCard } from '../../components/common/ProductCard';
import { productApi } from '../../lib/api/productApi';
import type { Product } from '../../lib/api/productApi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { EditableText } from '../../components/common/EditableText';
import { PageHeader } from '../../components/common/PageHeader';
import {
  SlidersHorizontal,
  ShoppingBag,
  Check,
  AlertCircle,
  Package,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Search,
  X,
} from 'lucide-react';

export const Products: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Synchronize state when URL query params change
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search') || '';
    if (q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const newParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newParams.set('q', value.trim());
    } else {
      newParams.delete('q');
      newParams.delete('search');
    }
    setSearchParams(newParams, { replace: true });
  };

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
      <PageHeader
        eyebrow="Authentic Store & Gear"
        title={
          <EditableText
            settingKey="shop.hero.title"
            defaultText='Dojo Gear & <span class="text-jadmaa-red">Martial Arts Equipment</span>'
          />
        }
        subtitle={
          <EditableText
            settingKey="shop.hero.subtitle"
            defaultText="Equip your journey with authentic uniforms, sparring protection, master belts, and training equipment for practitioners."
            multiline
          />
        }
      />

      {/* Admin Quick Action Banner on Public Store */}
      {isAdmin && (
        <div className="bg-amber-50/90 border-b border-amber-200 py-3.5 px-4 sm:px-6 lg:px-10 xl:px-12 shadow-2xs">
          <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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
      <section className="py-10 bg-[#F2EDE4] min-h-screen text-left">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
          
          {/* Controls: Search, Filter & Sort */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input with Brand Search Icon */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-4 h-4 text-[#B12B2B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products, gear, equipment..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E8DDD0] bg-[#FAF8F5] text-[#2B2521] placeholder-[#5C5148]/60 focus:bg-white focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-jadmaa-red rounded-lg transition cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort & In-Stock Filter */}
            <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 shrink-0">
                Showing {products.length} product{products.length === 1 ? '' : 's'}
              </span>

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
                    handleSearchChange('');
                    setInStockOnly(false);
                  }}
                  className="px-5 py-2.5 bg-jadmaa-red hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6 items-stretch">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAdmin={isAdmin}
                  isJustAdded={!!addedIds[product.id]}
                  onAddToCart={(prod) => handleAddToCart({ preventDefault: () => {}, stopPropagation: () => {} } as any, prod)}
                  onDelete={(prod) => handleDeleteProduct({ preventDefault: () => {}, stopPropagation: () => {} } as any, prod)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

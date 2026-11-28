import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Check, ShoppingBag, Trash2, Edit } from 'lucide-react';
import type { Product } from '../../lib/api/productApi';
import { ResponsiveImage } from './ResponsiveImage';
import { ShareButton } from './ShareButton';

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  isJustAdded?: boolean;
  onAddToCart?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isAdmin = false,
  isJustAdded = false,
  onAddToCart,
  onDelete,
  className = '',
}) => {
  const isOutOfStock = product.stockQuantity <= 0;
  const categoryName = typeof product.category === 'object' && product.category !== null
    ? (product.category as any).name
    : typeof product.category === 'string' && product.category.trim()
    ? product.category
    : (product.isDigital ? 'Digital Guide' : 'Siddha Literature');

  return (
    <div
      className={`bg-white rounded-xl sm:rounded-2xl border border-[#EBE4DC] shadow-[0_2px_12px_rgba(43,37,33,0.05)] hover:shadow-[0_12px_28px_rgba(177,43,43,0.11)] hover:border-[#E2C7B8] transition-all duration-300 flex flex-col group overflow-hidden h-full ${className}`}
    >
      {/* ── 1. Thumbnail Image Area (Aspect 16/10 matching Course & Blog cards) ── */}
      <Link
        to={`/products/${product.slug}`}
        className="relative block w-full aspect-[16/10] bg-[#FAF6F0] overflow-hidden flex items-center justify-center border-b border-[#F0EBE4]"
        aria-label={`View ${product.name}`}
      >
        {product.images && product.images[0] ? (
          <ResponsiveImage
            src={product.images[0]}
            alt={product.name}
            width={400}
            height={260}
            aspectRatio="16/10"
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 33vw, 280px"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            fallbackSrc="/images/course-basic.jpg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
          </div>
        )}

        {/* Format / Stock Badge (Top Left) */}
        <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
          {product.isDigital ? (
            <span className="bg-amber-600/95 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
              <BookOpen className="w-2.5 h-2.5" />
              <span>eBook</span>
            </span>
          ) : isOutOfStock ? (
            <span className="bg-red-600/90 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
              Sold Out
            </span>
          ) : product.stockQuantity < 5 ? (
            <span className="bg-amber-600/90 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
              Only {product.stockQuantity} Left
            </span>
          ) : null}
        </div>

        {/* Share Button (Top Right) */}
        <div className="absolute top-2 right-2 z-10">
          <ShareButton
            title={product.name}
            url={`/products/${product.slug}`}
            variant="icon"
            iconSize={13}
            className="w-7 h-7 bg-white/85 backdrop-blur-xs shadow-2xs hover:bg-white"
          />
        </div>
      </Link>

      {/* ── 2. Card Body (Tightened Padding p-3 sm:p-4) ── */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow justify-between gap-2.5 text-left">
        <div>
          {/* Category / Sub-meta */}
          <div className="flex items-center justify-between text-sm text-[#5C5148] font-medium mb-1.5">
            <span className="uppercase tracking-wider font-semibold text-[#B12B2B] text-xs">
              {categoryName}
            </span>
            {product.isDigital && (
              <span className="text-sm text-[#5C5148]">Instant Access</span>
            )}
          </div>

          {/* Title */}
          <Link to={`/products/${product.slug}`} className="block group-hover:text-jadmaa-red transition-colors">
            <h3 className="text-lg sm:text-xl font-bold font-serif text-[#2B2521] leading-snug line-clamp-2 min-h-[3rem]">
              {product.name}
            </h3>
          </Link>

          {/* Description */}
          {product.description && (
            <p className="line-clamp-2 text-sm sm:text-base text-[#5C5148] leading-relaxed font-normal mt-1.5">
              {product.description}
            </p>
          )}
        </div>

        {/* ── 3. Footer & Action Row ── */}
        <div className="pt-2.5 border-t border-gray-100 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            {/* Price */}
            <div>
              <span className="font-heading font-bold text-base sm:text-lg text-[#2B2521]">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            </div>

            {/* CTA */}
            {onAddToCart && !isOutOfStock && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToCart(product);
                }}
                disabled={isJustAdded}
                className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-sm font-medium transition-all shadow-2xs cursor-pointer ${
                  isJustAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#B12B2B] hover:bg-[#8F2020] text-white active:scale-95'
                }`}
              >
                {isJustAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </>
                )}
              </button>
            )}

            {isOutOfStock && (
              <span className="text-[11px] font-semibold text-gray-400">
                Unavailable
              </span>
            )}
          </div>

          {/* Admin Toolbar if enabled */}
          {isAdmin && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100 gap-1.5">
              <Link
                to={`/admin#products?edit=${product.id}`}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <Edit className="w-3 h-3" />
                <span>Edit</span>
              </Link>
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(product);
                  }}
                  className="px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Flame, ArrowRight, Plus, Minus } from 'lucide-react';
import { Product, CartItem } from '../types';

interface BestDealsSectionProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onViewAll: () => void;
  isCatalogLoading?: boolean;
}

export const BestDealsSection: React.FC<BestDealsSectionProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onViewAll,
  isCatalogLoading = false
}) => {
  const getProductQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>Best Deals</span>
          </div>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-bold text-[#0E7438] hover:text-emerald-800 flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isCatalogLoading && products.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-2.5 h-44 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-xs text-gray-500 shadow-xs">
          No approved shop products are currently available in your area. Check back shortly.
        </div>
      ) : (
      /* Products Row / Grid */
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {products.slice(0, 4).map((product) => {
          const qty = getProductQuantity(product.id);

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-gray-100 p-2.5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="relative">
                {product.badge && (
                  <span className="absolute top-1 left-1 z-10 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                    {product.badge}
                  </span>
                )}
                <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden bg-gray-50 mb-2 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                  {product.name}
                </h3>
                {product.localName && (
                  <p className="text-[10px] text-gray-500 truncate">
                    {product.localName}
                  </p>
                )}
                
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                    ₹{product.price}
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    /{product.unit}
                  </span>
                  {product.originalPrice && (
                    <span className="text-[10px] text-gray-400 line-through ml-auto">
                      ₹{product.originalPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button: Add + or [ - qty + ] */}
              <div className="mt-2.5">
                {qty === 0 ? (
                  <button
                    onClick={() => onAddToCart(product)}
                    className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold text-xs py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all"
                  >
                    <span>Add</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="w-full bg-emerald-50 border border-emerald-300 rounded-xl py-1 px-2 flex items-center justify-between text-xs font-bold text-[#0E7438]">
                    <button
                      onClick={() => onUpdateQuantity(product.id, qty - 1)}
                      className="p-1 rounded-md hover:bg-emerald-200 active:scale-90 transition-transform"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3 text-[#0E7438]" />
                    </button>
                    <span className="font-extrabold text-sm">{qty}</span>
                    <button
                      onClick={() => onUpdateQuantity(product.id, qty + 1)}
                      className="p-1 rounded-md hover:bg-emerald-200 active:scale-90 transition-transform"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3 text-[#0E7438]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};

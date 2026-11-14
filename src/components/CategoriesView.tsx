import React, { useState } from 'react';
import { Product, CartItem } from '../types';
import { Plus, Minus, Search, ArrowLeft, Filter } from 'lucide-react';

interface CategoriesViewProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onBackToHome: () => void;
  initialCategory?: string;
  isCatalogLoading?: boolean;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onBackToHome,
  initialCategory = 'All',
  isCatalogLoading = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchFilter, setSearchFilter] = useState('');

  const categories = ['All', 'Vegetables', 'Fruits', 'Dairy', 'Staples', 'Beverages'];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      searchFilter === '' ||
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.localName && p.localName.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const getProductQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="pb-24">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 p-4 sticky top-14 z-20 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">
              Online Shopping
            </h2>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            {filteredProducts.length} Products
          </span>
        </div>

        {/* Local search within category */}
        <div className="relative mb-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search groceries & daily essentials..."
            className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl pl-9 pr-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0E7438]"
          />
        </div>

        {/* Categories horizontal tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0E7438] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="p-4">
        {isCatalogLoading && filteredProducts.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-3 h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 px-4">
            <Filter className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No approved products found</p>
            <p className="text-xs text-gray-400 mt-1">
              {products.length === 0
                ? 'Approved shop catalogs are being updated. Check back shortly.'
                : 'Try another category or clear your search.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const qty = getProductQuantity(product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="relative">
                    {product.badge && (
                      <span className="absolute top-1 left-1 z-10 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                        {product.badge}
                      </span>
                    )}
                    <div className="w-full h-28 rounded-xl overflow-hidden bg-gray-50 mb-2">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                      {product.name}
                    </h3>
                    {product.localName && (
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {product.localName}
                      </p>
                    )}
                    
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-sm font-extrabold text-gray-900">
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

                  {/* Quantity Action */}
                  <div className="mt-3">
                    {qty === 0 ? (
                      <button
                        onClick={() => onAddToCart(product)}
                        className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold text-xs py-1.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all"
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
                          <Minus className="w-3.5 h-3.5 text-[#0E7438]" />
                        </button>
                        <span className="font-extrabold text-sm">{qty}</span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, qty + 1)}
                          className="p-1 rounded-md hover:bg-emerald-200 active:scale-90 transition-transform"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#0E7438]" />
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
    </div>
  );
};

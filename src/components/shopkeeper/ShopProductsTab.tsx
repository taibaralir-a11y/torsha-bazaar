import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, AlertCircle, ShieldCheck, Check, X } from 'lucide-react';
import { Product, Shop } from '../../types';

interface ShopProductsTabProps {
  shop: Shop;
  products: Product[];
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleAvailability: (productId: string) => void;
}

export const ShopProductsTab: React.FC<ShopProductsTabProps> = ({
  shop,
  products,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteProduct,
  onToggleAvailability
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isShopApproved = shop.status === 'approved';

  const categories = ['All', 'Vegetables', 'Fruits', 'Dairy', 'Staples', 'Beverages'];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.localName && p.localName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner if not approved */}
      {!isShopApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Shop Status is {shop.status.toUpperCase()}:</strong> Products are not visible in customer search until your shop is approved by admin.
            </span>
          </div>
        </div>
      )}

      {/* Top action row with Search and Add Product Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search your items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0E7438]"
          />
        </div>

        <button
          onClick={onOpenAddModal}
          className="bg-[#0E7438] hover:bg-emerald-800 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#0E7438] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products list */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3">
          <p className="text-sm font-bold text-gray-700">No products listed</p>
          <p className="text-xs text-gray-400">Click "Add Product" to list vegetables, fruits, groceries, or essentials.</p>
          <button
            onClick={onOpenAddModal}
            className="bg-[#0E7438] text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs"
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const isAvailable = product.inStock !== false && (product.stock === undefined || product.stock > 0);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs flex items-center justify-between gap-3 hover:border-gray-200 transition-all"
              >
                {/* Left: Product image and info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100 relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-[9px] font-black text-white bg-red-600 px-1 rounded">
                          OUT
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                        {product.category}
                      </span>
                      {isShopApproved ? (
                        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Live
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
                          Private ({shop.status})
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate mt-0.5">
                      {product.name}
                    </h4>

                    {product.localName && (
                      <p className="text-[10px] text-gray-500 truncate">
                        {product.localName}
                      </p>
                    )}

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                        ₹{product.price}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        /{product.unit}
                      </span>
                      {product.stock !== undefined && (
                        <span className="text-[10px] text-gray-500 font-medium ml-1">
                          Stock: {product.stock}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                  {/* Availability toggle */}
                  <button
                    onClick={() => onToggleAvailability(product.id)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                      isAvailable
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-red-50 border-red-300 text-red-800'
                    }`}
                    title="Toggle In Stock"
                  >
                    {isAvailable ? 'In Stock' : 'Out of Stock'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditModal(product)}
                      className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                      aria-label="Edit product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                          onDeleteProduct(product.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600"
                      aria-label="Delete product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

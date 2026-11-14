import React, { useState } from 'react';
import { ArrowLeft, Smartphone, ShieldCheck, CheckCircle2, ShoppingCart, Zap, Sparkles } from 'lucide-react';
import { ALL_PRODUCTS } from '../data/mockData';
import { Product } from '../types';

interface PhonesViewProps {
  onBackToHome: () => void;
  onAddToCart?: (product: Product) => void;
}

export const PhonesView: React.FC<PhonesViewProps> = ({ onBackToHome, onAddToCart }) => {
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const newPhones = ALL_PRODUCTS.filter(
    (p) => p.categoryType === 'mobile' || p.categoryType === 'accessories' || p.isBrandNew
  );

  const brands = ['All', 'Samsung', 'Apple', 'Vivo', 'Realme', 'Redmi', 'Motorola', 'OnePlus', 'Accessories'];

  const filtered = newPhones.filter((p) => {
    if (selectedBrand === 'All') return true;
    if (selectedBrand === 'Accessories') return p.categoryType === 'accessories';
    return p.brand?.toLowerCase() === selectedBrand.toLowerCase();
  });

  const handleAdd = (product: Product) => {
    if (onAddToCart) onAddToCart(product);
    setAddedNotice(`${product.name} added to cart!`);
    setTimeout(() => setAddedNotice(null), 2000);
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-[#0E7438] text-white p-4 sticky top-14 z-20 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="p-1 rounded-full hover:bg-emerald-800 text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold flex items-center gap-1.5">
                <Smartphone className="w-5 h-5 text-yellow-300" />
                <span>Brand-New Smartphones Store</span>
              </h2>
              <p className="text-[10px] text-emerald-100">100% Sealed Pack with Official Brand Warranty</p>
            </div>
          </div>
          <span className="text-[9px] bg-yellow-400 text-gray-950 px-2 py-0.5 rounded-full font-black uppercase">
            0% Second Hand
          </span>
        </div>
      </div>

      {/* Brand Filters Bar */}
      <div className="p-3 bg-white border-b border-gray-100 overflow-x-auto flex gap-1.5 no-scrollbar">
        {brands.map((b) => (
          <button
            key={b}
            onClick={() => setSelectedBrand(b)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedBrand === b
                ? 'bg-[#0E7438] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {addedNotice && (
        <div className="mx-4 my-2 p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{addedNotice}</span>
        </div>
      )}

      {/* Products Grid */}
      <div className="p-3 sm:p-4 grid grid-cols-2 gap-3">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col justify-between">
            <div>
              <div className="relative h-36 bg-gray-50 flex items-center justify-center p-2">
                <img src={item.image} alt={item.name} className="h-full object-contain" />
                <span className="absolute top-2 left-2 text-[9px] font-black uppercase bg-indigo-600 text-white px-1.5 py-0.2 rounded">
                  {item.brand || 'Brand-New'}
                </span>
                {item.warranty && (
                  <span className="absolute bottom-2 right-2 text-[9px] font-bold bg-white/90 backdrop-blur-xs text-gray-800 px-1.5 py-0.2 rounded border border-gray-200 shadow-xs">
                    {item.warranty}
                  </span>
                )}
              </div>
              <div className="p-2.5 space-y-1">
                <h4 className="text-xs font-bold text-gray-900 line-clamp-2">{item.name}</h4>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-black text-gray-900">₹{item.price.toLocaleString()}</span>
                  {item.originalPrice && (
                    <span className="text-[10px] text-gray-400 line-through">₹{item.originalPrice.toLocaleString()}</span>
                  )}
                </div>
                {item.specs && item.specs.length > 0 && (
                  <p className="text-[10px] text-gray-500 truncate">{item.specs.join(' • ')}</p>
                )}
              </div>
            </div>

            <div className="p-2.5 pt-0">
              <button
                onClick={() => handleAdd(item)}
                className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

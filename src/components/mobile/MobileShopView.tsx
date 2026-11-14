import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Zap, 
  Cpu, 
  Battery, 
  Sparkles,
  Award
} from 'lucide-react';
import { Product, CartItem } from '../../types';

interface MobileShopViewProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onBackToHome: () => void;
  onOpenCart: () => void;
  currentLocality: string;
  isCatalogLoading?: boolean;
}

export const MobileShopView: React.FC<MobileShopViewProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onBackToHome,
  onOpenCart,
  currentLocality,
  isCatalogLoading = false
}) => {
  const [activeBrand, setActiveBrand] = useState<string>('All');
  const [activeSection, setActiveSection] = useState<'all' | 'mobiles' | 'accessories'>('all');
  const [search, setSearch] = useState('');

  const brandNewItems = products.filter(
    (p) => p.categoryType === 'mobile' || p.categoryType === 'accessories' || p.isBrandNew
  );

  const brands = ['All', 'Apple', 'Samsung', 'OnePlus', 'Vivo', 'Realme', 'Redmi', 'Motorola', 'Oppo'];

  const filteredItems = brandNewItems.filter((item) => {
    const matchesSection = 
      activeSection === 'all' ||
      (activeSection === 'mobiles' && item.categoryType === 'mobile') ||
      (activeSection === 'accessories' && item.categoryType === 'accessories');

    const matchesBrand = activeBrand === 'All' || item.brand === activeBrand || (activeBrand === 'Apple' && item.name.includes('iPhone'));
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.description?.toLowerCase().includes(search.toLowerCase());

    return matchesSection && matchesBrand && matchesSearch;
  });

  const cartMobileCount = cart.filter((c) => c.product.categoryType === 'mobile' || c.product.categoryType === 'accessories').reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 sticky top-14 z-20 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wide text-yellow-400">100% BRAND-NEW MOBILES</span>
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black uppercase">GENUINE</span>
              </div>
              <p className="text-xs text-slate-300">Official Brand Warranty • GST Invoiced • Premium Accessories</p>
            </div>
          </div>

          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartMobileCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartMobileCount}
              </span>
            )}
          </button>
        </div>

        {/* Verification banner */}
        <div className="bg-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5 border border-slate-700 text-xs">
          <ShieldCheck className="w-5 h-5 text-yellow-400 shrink-0" />
          <div className="text-[11px] text-slate-300">
            <span>Authorized Dooars Retailer: <strong>Jaigaon Mobile World & Gadgets</strong></span>
            <p className="text-slate-400">All phones are factory sealed pack. Zero refurbished or second-hand products.</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Galaxy S24, iPhone 15, Vivo V30, 65W chargers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </div>

        {/* Section Tabs */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs font-bold">
          <button
            onClick={() => setActiveSection('all')}
            className={`py-1.5 rounded-xl text-center transition-all ${
              activeSection === 'all' ? 'bg-yellow-400 text-gray-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setActiveSection('mobiles')}
            className={`py-1.5 rounded-xl text-center transition-all ${
              activeSection === 'mobiles' ? 'bg-yellow-400 text-gray-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Smartphones
          </button>
          <button
            onClick={() => setActiveSection('accessories')}
            className={`py-1.5 rounded-xl text-center transition-all ${
              activeSection === 'accessories' ? 'bg-yellow-400 text-gray-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Accessories
          </button>
        </div>
      </div>

      {/* Brand Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar">
        {brands.map((brand) => (
          <button
            key={brand}
            onClick={() => setActiveBrand(brand)}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeBrand === brand
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Showing <strong>{filteredItems.length}</strong> Brand-New Gadgets</span>
          <span>Delivering to: <strong>{currentLocality}</strong></span>
        </div>

        {isCatalogLoading && filteredItems.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1].map((idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-4 h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2 shadow-xs">
            <Smartphone className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-gray-800">No approved mobile products available</p>
            <p className="text-xs text-gray-500">
              {brandNewItems.length === 0
                ? 'Authorized mobile & accessories inventory is not active for your selection right now.'
                : 'Try changing the brand filter or search term.'}
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((prod) => {
            const inCart = cart.find((c) => c.product.id === prod.id);
            const quantity = inCart ? inCart.quantity : 0;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-3">
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-gray-100">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    {prod.badge && (
                      <span className="absolute top-2 left-2 bg-yellow-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        {prod.badge}
                      </span>
                    )}
                    {prod.brand && (
                      <span className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        {prod.brand}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-gray-900 leading-snug">{prod.name}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">{prod.description}</p>
                  </div>

                  {/* Specs List */}
                  {prod.specs && prod.specs.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-gray-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {prod.specs.map((spec, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate">{spec}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warranty & Seller */}
                  <div className="text-[10px] text-gray-500 space-y-0.5 border-t border-gray-100 pt-2">
                    {prod.warranty && (
                      <p className="flex items-center gap-1 text-emerald-800 font-bold">
                        <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{prod.warranty}</span>
                      </p>
                    )}
                    {prod.sellerName && (
                      <p className="text-gray-400">Sold by: {prod.sellerName} ({prod.sellerLocality || 'Jaigaon'})</p>
                    )}
                  </div>
                </div>

                {/* Price and Cart */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-gray-900">₹{prod.price.toLocaleString('en-IN')}</span>
                    {prod.originalPrice && (
                      <span className="text-xs text-gray-400 line-through ml-1.5">₹{prod.originalPrice.toLocaleString('en-IN')}</span>
                    )}
                  </div>

                  {quantity > 0 ? (
                    <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 rounded-xl px-2 py-1">
                      <button
                        onClick={() => onUpdateQuantity(prod.id, quantity - 1)}
                        className="p-1 rounded text-slate-800 hover:bg-slate-200"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs text-slate-900 min-w-4 text-center">{quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(prod.id, quantity + 1)}
                        className="p-1 rounded text-slate-800 hover:bg-slate-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddToCart(prod)}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
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

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Scale, 
  ShoppingCart, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { Product, CartItem } from '../../types';

interface MeatShopViewProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product, prescriptionUrl?: string, selectedWeightGrams?: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onBackToHome: () => void;
  onOpenCart: () => void;
  currentLocality: string;
  isCatalogLoading?: boolean;
}

export const MeatShopView: React.FC<MeatShopViewProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onBackToHome,
  onOpenCart,
  currentLocality,
  isCatalogLoading = false
}) => {
  const [selectedWeightMap, setSelectedWeightMap] = useState<Record<string, number>>({});
  const [customWeightMap, setCustomWeightMap] = useState<Record<string, number>>({});
  const [showCustomModal, setShowCustomModal] = useState<Product | null>(null);
  const [customGramsInput, setCustomGramsInput] = useState<number>(750);

  const meatProducts = products.filter(
    (p) => p.categoryType === 'meat' || p.category.includes('Meat') || p.category.includes('Chicken')
  );

  const handleSelectWeight = (productId: string, weightGrams: number) => {
    setSelectedWeightMap((prev) => ({ ...prev, [productId]: weightGrams }));
  };

  const getActiveWeight = (product: Product) => {
    return selectedWeightMap[product.id] || product.availableWeights?.[0] || 1000;
  };

  const calculateDynamicPrice = (product: Product, weightGrams: number) => {
    const ratePerKg = product.pricePerKg || product.price;
    return Math.round((ratePerKg * weightGrams) / 1000);
  };

  const cartMeatCount = cart.filter((c) => c.product.categoryType === 'meat').reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-red-800 text-white p-4 sticky top-14 z-20 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="p-1.5 rounded-lg bg-red-900/60 hover:bg-red-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wide text-yellow-300">FRESH MEAT & CHICKEN</span>
                <span className="text-[10px] bg-red-600 px-1.5 py-0.5 rounded font-black uppercase">DAILY CUT</span>
              </div>
              <p className="text-xs text-red-100">Farm Fresh Broiler • Tender Mutton • Fresh Torsa Fish</p>
            </div>
          </div>

          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-full bg-red-900/80 hover:bg-red-900 text-white"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartMeatCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartMeatCount}
              </span>
            )}
          </button>
        </div>

        {/* Hygiene & Weight Notice */}
        <div className="bg-red-950/70 rounded-xl p-2.5 flex items-center gap-2.5 border border-red-700/60 text-xs">
          <ShieldCheck className="w-5 h-5 text-yellow-400 shrink-0" />
          <div className="text-[11px] text-red-100">
            <span>FSSAI Certified: <strong>Dooars Fresh Chicken & Mutton Hub</strong></span>
            <p className="text-red-200">Pre-washed, chilled & dressed in food-grade sealed pack. Shopkeeper verifies exact morning weight.</p>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Choose Exact Weight for Fresh Morning Cut</span>
          <span className="font-bold text-red-700">Locality: {currentLocality}</span>
        </div>

        {isCatalogLoading && meatProducts.length === 0 ? (
          <div className="space-y-4">
            {[0, 1].map((idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-4 h-44 animate-pulse" />
            ))}
          </div>
        ) : meatProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2 shadow-xs">
            <Scale className="w-8 h-8 text-red-300 mx-auto" />
            <p className="text-sm font-bold text-gray-800">No approved meat or poultry items available</p>
            <p className="text-xs text-gray-500">
              Approved butcher and daily-cut products will appear here when available in your locality.
            </p>
          </div>
        ) : (
        <div className="space-y-4">
          {meatProducts.map((prod) => {
            const currentWeight = getActiveWeight(prod);
            const dynamicPrice = calculateDynamicPrice(prod, currentWeight);
            const inCart = cart.find(
              (c) => c.product.id === prod.id && (c.selectedWeightGrams === currentWeight || !c.selectedWeightGrams)
            );
            const quantity = inCart ? inCart.quantity : 0;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex gap-3">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-gray-100">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    {prod.badge && (
                      <span className="absolute top-0 left-0 right-0 bg-red-700 text-[9px] font-black text-white text-center py-0.5 uppercase tracking-wider">
                        {prod.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 text-xs space-y-1">
                    <h4 className="font-bold text-sm text-gray-900 leading-snug">{prod.name}</h4>
                    <p className="text-[11px] text-gray-500">{prod.description}</p>
                    <p className="text-[11px] text-red-700 font-bold">
                      Base Rate: ₹{prod.pricePerKg || prod.price} / kg
                    </p>
                  </div>
                </div>

                {/* Weight Selection Chips */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-red-600" />
                    <span>Select Pack Weight:</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { grams: 250, label: '250g' },
                      { grams: 500, label: '500g' },
                      { grams: 1000, label: '1 kg' },
                      { grams: customWeightMap[prod.id] || 0, label: customWeightMap[prod.id] ? `${customWeightMap[prod.id]}g` : 'Custom' }
                    ].map((opt, idx) => {
                      if (opt.label === 'Custom' && opt.grams === 0) {
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setShowCustomModal(prod)}
                            className="py-1.5 rounded-xl border border-dashed border-red-300 text-red-700 font-bold text-xs bg-red-50/50 hover:bg-red-50"
                          >
                            Custom...
                          </button>
                        );
                      }

                      const isSelected = currentWeight === opt.grams;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectWeight(prod.id, opt.grams)}
                          className={`py-1.5 rounded-xl border text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-red-700 text-white border-red-700 shadow-xs'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price and Cart Action */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-gray-900">₹{dynamicPrice}</span>
                    <span className="text-xs text-gray-500 ml-1.5 font-medium">for {currentWeight >= 1000 ? `${currentWeight / 1000} kg` : `${currentWeight}g`}</span>
                  </div>

                  {quantity > 0 ? (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-2 py-1">
                      <button
                        onClick={() => onUpdateQuantity(prod.id, quantity - 1)}
                        className="p-1 rounded text-red-700 hover:bg-red-100"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs text-red-900 min-w-4 text-center">{quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(prod.id, quantity + 1)}
                        className="p-1 rounded text-red-700 hover:bg-red-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddToCart(prod, undefined, currentWeight)}
                      className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add ({currentWeight >= 1000 ? `${currentWeight / 1000}kg` : `${currentWeight}g`})
                    </button>
                  )}
                </div>

                <div className="bg-slate-50 p-2 rounded-xl text-[10px] text-gray-500 flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-gray-400 shrink-0" />
                  <span>The butcher weighs before cutting; slight variation of ±20g is settled on doorstep delivery.</span>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Custom Weight Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xs p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-gray-900">Enter Custom Weight for {showCustomModal.name}</h3>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Weight in Grams (g):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="200"
                  max="5000"
                  step="50"
                  value={customGramsInput}
                  onChange={(e) => setCustomGramsInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-sm"
                />
                <span className="text-xs font-bold text-gray-500">grams</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Estimated Price: <strong className="text-red-700 font-bold">₹{calculateDynamicPrice(showCustomModal, customGramsInput)}</strong>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(null)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomWeightMap((prev) => ({ ...prev, [showCustomModal.id]: customGramsInput }));
                  handleSelectWeight(showCustomModal.id, customGramsInput);
                  setShowCustomModal(null);
                }}
                className="flex-1 py-2 bg-red-700 text-white font-bold rounded-xl text-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

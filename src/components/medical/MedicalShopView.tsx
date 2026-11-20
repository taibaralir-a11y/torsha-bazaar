import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  ShieldCheck, 
  Upload, 
  FileText, 
  AlertCircle, 
  Plus, 
  Minus, 
  CheckCircle2, 
  X, 
  ShoppingCart,
  Calendar,
  Building
} from 'lucide-react';
import { Product, CartItem } from '../../types';

interface MedicalShopViewProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product, prescriptionUrl?: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onBackToHome: () => void;
  onOpenCart: () => void;
  currentLocality: string;
  isCatalogLoading?: boolean;
}

export const MedicalShopView: React.FC<MedicalShopViewProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onBackToHome,
  onOpenCart,
  currentLocality,
  isCatalogLoading = false
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [prescriptionProduct, setPrescriptionProduct] = useState<Product | null>(null);
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [prescriptionError, setPrescriptionError] = useState<string | null>(null);

  const medicalProducts = products.filter(
    (p) => p.categoryType === 'medical' || p.category.includes('Medic') || p.category.includes('Health')
  );

  const categories = ['All', 'OTC Medicines', 'Prescription Medicines', 'First Aid', 'Diabetic Care', 'Supplements', 'Medical Devices'];

  const filteredProducts = medicalProducts.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handlePrescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionImage(reader.result as string);
        setPrescriptionError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPrescriptionAdd = () => {
    if (!prescriptionProduct) return;
    if (!prescriptionImage) {
      setPrescriptionError('Please upload a clear photo of the doctor prescription.');
      return;
    }
    setPrescriptionError(null);
    onAddToCart(prescriptionProduct, prescriptionImage);
    setPrescriptionProduct(null);
    setPrescriptionImage(null);
  };

  const cartMedicinesCount = cart.filter((c) => c.product.categoryType === 'medical').reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-teal-800 text-white p-4 sticky top-14 z-20 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="p-1.5 rounded-lg bg-teal-900/60 hover:bg-teal-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wide text-yellow-300">MEDICAL & PHARMACY</span>
                <span className="text-[10px] bg-teal-600 px-1.5 py-0.5 rounded font-black uppercase">Rx</span>
              </div>
              <p className="text-xs text-teal-100">Licensed Pharmacist • Genuine Medicines • Express Home Delivery</p>
            </div>
          </div>

          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-full bg-teal-900/80 hover:bg-teal-900 text-white"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartMedicinesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartMedicinesCount}
              </span>
            )}
          </button>
        </div>

        {/* Verification & Legal Badge */}
        <div className="bg-teal-950/70 rounded-xl p-2.5 flex items-center gap-2.5 border border-teal-700/60 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-[11px] text-teal-200">
            <span>Verified Partner: <strong>Hasimara LifeLine Medico</strong> (DL: WB/ALPD/DL-2024-88912)</span>
            <p className="text-teal-300">Schedule H & X compliance enforced. 100% genuine batch & expiry tracking.</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-teal-300 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tablets, syrups, first-aid, ORS, test strips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-teal-900/60 border border-teal-600/70 rounded-xl text-white placeholder-teal-300 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Showing <strong>{filteredProducts.length}</strong> Healthcare Items</span>
          <span>Locality: <strong>{currentLocality}</strong></span>
        </div>

        {isCatalogLoading && filteredProducts.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1].map((idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-3.5 h-36 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2 shadow-xs">
            <Building className="w-8 h-8 text-teal-300 mx-auto" />
            <p className="text-sm font-bold text-gray-800">No approved pharmacy items available</p>
            <p className="text-xs text-gray-500">
              {medicalProducts.length === 0
                ? 'Licensed pharmacy products will appear here once approved shops are active.'
                : 'Try another medicine category or clear your search filter.'}
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredProducts.map((prod) => {
            const inCart = cart.find((c) => c.product.id === prod.id);
            const quantity = inCart ? inCart.quantity : 0;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex gap-3">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-gray-100">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    {prod.badge && (
                      <span className="absolute bottom-0 left-0 right-0 bg-teal-800 text-[9px] font-black text-white text-center py-0.5 uppercase tracking-wider">
                        {prod.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 text-xs space-y-1">
                    <h4 className="font-bold text-gray-900 leading-snug">{prod.name}</h4>
                    <p className="text-[11px] text-gray-500">{prod.unit}</p>
                    {prod.manufacturer && (
                      <p className="text-[10px] text-gray-400">By {prod.manufacturer}</p>
                    )}
                    {prod.expiryDate && (
                      <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Exp: {prod.expiryDate}
                      </p>
                    )}
                  </div>
                </div>

                {prod.requiresPrescription && (
                  <div className="bg-red-50 text-red-700 p-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5 border border-red-100">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Prescription required by law to dispatch</span>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-black text-gray-900">₹{prod.price}</span>
                    {prod.originalPrice && (
                      <span className="text-xs text-gray-400 line-through ml-1.5">₹{prod.originalPrice}</span>
                    )}
                  </div>

                  {quantity > 0 ? (
                    <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-2 py-1">
                      <button
                        onClick={() => onUpdateQuantity(prod.id, quantity - 1)}
                        className="p-1 rounded text-teal-700 hover:bg-teal-100"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs text-teal-900 min-w-4 text-center">{quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(prod.id, quantity + 1)}
                        className="p-1 rounded text-teal-700 hover:bg-teal-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (prod.requiresPrescription) {
                          setPrescriptionProduct(prod);
                        } else {
                          onAddToCart(prod);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${
                        prod.requiresPrescription
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-teal-700 hover:bg-teal-800 text-white'
                      }`}
                    >
                      {prod.requiresPrescription ? (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload & Add</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Prescription Upload Modal */}
      {prescriptionProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-sm text-gray-900">Doctor Prescription Required</h3>
              </div>
              <button
                onClick={() => setPrescriptionProduct(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3 text-xs text-amber-900 space-y-1 border border-amber-200">
              <p className="font-bold">Item: {prescriptionProduct.name}</p>
              <p className="text-[11px] leading-relaxed">
                As per Indian Pharmacy Act & Drugs and Cosmetics Act regulations, Schedule H medicines require a valid doctor prescription.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Patient Name</label>
                <input
                  type="text"
                  placeholder="Patient Full Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Doctor / Clinic Name</label>
                <input
                  type="text"
                  placeholder="Doctor Name (Optional)"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Upload Prescription Photo / PDF</label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-teal-300 bg-teal-50/50 rounded-2xl cursor-pointer hover:bg-teal-50 transition-colors">
                  <Upload className="w-6 h-6 text-teal-600 mb-1" />
                  <span className="font-bold text-teal-800 text-xs">Tap to choose prescription photo</span>
                  <span className="text-[10px] text-gray-500">Camera picture or gallery file</span>
                  <input type="file" accept="image/*,application/pdf" onChange={handlePrescriptionUpload} className="hidden" />
                </label>
                {prescriptionImage && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">Prescription photo attached successfully!</span>
                  </div>
                )}
                {prescriptionError && (
                  <div className="mt-2 p-2 bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs font-bold">
                    {prescriptionError}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrescriptionProduct(null);
                  setPrescriptionError(null);
                }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPrescriptionAdd}
                className="flex-1 py-2.5 bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md hover:bg-teal-800"
              >
                Verify & Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Store, MapPin, Phone, ShieldCheck, Clock, XCircle, AlertTriangle, Check, Image as ImageIcon, CheckSquare, Square } from 'lucide-react';
import { Shop, ShopApprovalStatus, LocalityInfo } from '../../types';
import { INITIAL_SERVICE_LOCALITIES } from '../../utils/hyperlocalRouting';

interface ShopProfileTabProps {
  shop: Shop;
  isAdmin?: boolean;
  onUpdateShop: (updatedData: Partial<Shop>) => void;
  onAdminChangeStatus: (status: ShopApprovalStatus) => void;
  localities?: LocalityInfo[];
}

export const ShopProfileTab: React.FC<ShopProfileTabProps> = ({
  shop,
  isAdmin = false,
  onUpdateShop,
  onAdminChangeStatus,
  localities = INITIAL_SERVICE_LOCALITIES
}) => {
  const [name, setName] = useState(shop.name);
  const [address, setAddress] = useState(shop.address);
  const [locality, setLocality] = useState(shop.locality || 'Satali');
  const [pincode, setPincode] = useState(shop.pincode || '735214');
  const [contactNumber, setContactNumber] = useState(shop.contactNumber);
  const [category, setCategory] = useState(shop.category);
  const [imageUrl, setImageUrl] = useState(shop.imageUrl);
  const [deliveryAreas, setDeliveryAreas] = useState<string[]>(() => {
    return Array.isArray(shop.deliveryAreas) && shop.deliveryAreas.length > 0
      ? shop.deliveryAreas
      : [shop.locality || 'Satali'];
  });
  const [deliveryCharge, setDeliveryCharge] = useState(shop.deliveryCharge || 20);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(shop.deliveryRadiusKm || 15);
  const [isSaved, setIsSaved] = useState(false);

  const storefrontPresets = [
    { label: 'Grocery & Mandi', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80' },
    { label: 'Fresh Veggies Stand', url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop&q=80' },
    { label: 'Tea Garden Mart', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80' },
    { label: 'Supermarket Storefront', url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800&auto=format&fit=crop&q=80' }
  ];

  const handleToggleDeliveryArea = (locName: string) => {
    setDeliveryAreas((prev) => {
      if (prev.includes(locName)) {
        // Keep at least one
        if (prev.length === 1) return prev;
        return prev.filter((a) => a !== locName);
      } else {
        return [...prev, locName];
      }
    });
  };

  const handleSelectAllInPin = (pin: string) => {
    const locsInPin = localities.filter((l) => l.pincode === pin).map((l) => l.name);
    setDeliveryAreas((prev) => Array.from(new Set([...prev, ...locsInPin])));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateShop({
      name: name.trim(),
      address: address.trim(),
      locality,
      pincode,
      contactNumber: contactNumber.trim(),
      category,
      imageUrl,
      deliveryAreas,
      deliveryCharge: Number(deliveryCharge),
      deliveryRadiusKm: Number(deliveryRadiusKm)
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Current Approval Status Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Shop Approval Status & Security
          </h3>
          <span className="text-[11px] font-mono text-gray-400">ID: {shop.id}</span>
        </div>

        <div className="p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-gray-50 border-gray-200">
          <div className="flex items-center gap-3">
            {shop.status === 'approved' && <ShieldCheck className="w-6 h-6 text-emerald-600" />}
            {shop.status === 'pending' && <Clock className="w-6 h-6 text-amber-600" />}
            {shop.status === 'rejected' && <XCircle className="w-6 h-6 text-red-600" />}
            {shop.status === 'suspended' && <AlertTriangle className="w-6 h-6 text-gray-600" />}
            <div>
              <h4 className="text-sm font-bold text-gray-900 capitalize">
                Status: {shop.status}
              </h4>
              <p className="text-[11px] text-gray-500">
                {shop.status === 'approved'
                  ? 'All products are active and visible in your served localities.'
                  : shop.status === 'pending'
                  ? 'Awaiting marketplace admin review. Products are private.'
                  : shop.status === 'rejected'
                  ? 'Shop application rejected. Selling disabled.'
                  : 'Shop temporarily suspended.'}
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Admin Approval Control
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => onAdminChangeStatus('approved')}
                className={`text-xs py-1.5 px-2 rounded-lg font-bold border transition-colors ${
                  shop.status === 'approved'
                    ? 'bg-[#0E7438] text-white border-[#0E7438]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Set Approved
              </button>
              <button
                type="button"
                onClick={() => onAdminChangeStatus('pending')}
                className={`text-xs py-1.5 px-2 rounded-lg font-bold border transition-colors ${
                  shop.status === 'pending'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Set Pending
              </button>
              <button
                type="button"
                onClick={() => onAdminChangeStatus('rejected')}
                className={`text-xs py-1.5 px-2 rounded-lg font-bold border transition-colors ${
                  shop.status === 'rejected'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Set Rejected
              </button>
              <button
                type="button"
                onClick={() => onAdminChangeStatus('suspended')}
                className={`text-xs py-1.5 px-2 rounded-lg font-bold border transition-colors ${
                  shop.status === 'suspended'
                    ? 'bg-gray-700 text-white border-gray-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Set Suspended
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Shop Details Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3.5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1 border-b border-gray-100">
          Store Information & Hyperlocal Coverage
        </h3>

        {/* Shop Name */}
        <div>
          <label className="text-[11px] font-bold text-gray-700 block mb-1">Business / Shop Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-gray-50 border border-gray-200 text-xs sm:text-sm rounded-xl p-2.5 font-bold text-gray-900"
          />
        </div>

        {/* Locality & Sector */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Shop Base Locality</label>
            <select
              value={locality}
              onChange={(e) => {
                const selectedName = e.target.value;
                setLocality(selectedName);
                const matched = localities.find((l) => l.name === selectedName);
                if (matched) {
                  setPincode(matched.pincode);
                  if (!deliveryAreas.includes(selectedName)) {
                    setDeliveryAreas((prev) => [...prev, selectedName]);
                  }
                }
              }}
              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-semibold text-gray-900"
            >
              {localities.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name} ({loc.pincode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Shop Type / Sector</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-semibold"
            >
              <option value="Kirana & Grocery">Kirana & Grocery</option>
              <option value="Brand-New Mobiles & Accessories">Brand-New Mobiles & Accessories</option>
              <option value="Pharmacy & Medicines">Medical & Pharmacy (Rx)</option>
              <option value="Meat, Fish & Poultry">Fresh Meat & Chicken</option>
              <option value="Daily Dairy & Bakery">Daily Dairy & Bakery</option>
            </select>
          </div>
        </div>

        {/* SHOPKEEPER DELIVERY ZONES: SELECT ALL LOCALITIES SERVED */}
        <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                SERVICE COVERAGE
              </span>
              <h4 className="text-xs font-bold text-gray-900 mt-1">Select All Localities You Deliver To</h4>
            </div>
            <span className="text-xs font-bold text-emerald-700">
              {deliveryAreas.length} selected
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => handleSelectAllInPin('735214')}
              className="px-2 py-0.5 bg-white border border-emerald-300 rounded text-emerald-800 font-bold hover:bg-emerald-100"
            >
              + All PIN 735214 (Satali)
            </button>
            <button
              type="button"
              onClick={() => handleSelectAllInPin('735215')}
              className="px-2 py-0.5 bg-white border border-emerald-300 rounded text-emerald-800 font-bold hover:bg-emerald-100"
            >
              + All PIN 735215 (Hasimara)
            </button>
          </div>

          {/* Checkboxes grid */}
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {localities.map((loc) => {
              const isChecked = deliveryAreas.includes(loc.name);
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleToggleDeliveryArea(loc.name)}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-left border text-xs transition-colors ${
                    isChecked
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-3.5 h-3.5 text-white shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}
                  <span className="truncate">{loc.name}</span>
                  <span className={`text-[9px] font-mono ml-auto ${isChecked ? 'text-emerald-100' : 'text-gray-400'}`}>
                    {loc.pincode}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-emerald-800">
            * Customers in selected localities will see your products with local priority routing.
          </p>
        </div>

        {/* Hyperlocal Delivery Configuration */}
        <div className="grid grid-cols-2 gap-2.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Local Delivery Fee (₹)</label>
            <input
              type="number"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(Number(e.target.value))}
              min={0}
              max={100}
              className="w-full bg-white border border-gray-300 text-xs rounded-xl p-2 font-bold text-gray-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Max Delivery Radius (km)</label>
            <input
              type="number"
              value={deliveryRadiusKm}
              onChange={(e) => setDeliveryRadiusKm(Number(e.target.value))}
              min={1}
              max={30}
              className="w-full bg-white border border-gray-300 text-xs rounded-xl p-2 font-bold text-gray-900"
            />
          </div>
        </div>

        {/* Physical Address */}
        <div>
          <label className="text-[11px] font-bold text-gray-700 block mb-1">Complete Physical Shop Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            required
            className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
          />
        </div>

        {/* Contact Phone */}
        <div>
          <label className="text-[11px] font-bold text-gray-700 block mb-1">Shopkeeper Contact Phone</label>
          <input
            type="text"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            required
            className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
          />
        </div>

        {/* Storefront Image Presets */}
        <div>
          <label className="text-[11px] font-bold text-gray-700 block mb-1">Storefront Photo</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {storefrontPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setImageUrl(preset.url)}
                className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  imageUrl === preset.url ? 'border-[#0E7438] scale-105 shadow-xs' : 'border-gray-200 opacity-80'
                }`}
              >
                <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                {imageUrl === preset.url && (
                  <div className="absolute inset-0 bg-[#0E7438]/40 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Or enter custom storefront image URL"
            className="w-full bg-gray-50 border border-gray-200 text-[11px] rounded-xl p-2 font-mono"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold py-3 rounded-2xl shadow-md text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Shop Profile & Zones Saved!</span>
              </>
            ) : (
              <span>Save Shop Profile & Delivery Zones</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

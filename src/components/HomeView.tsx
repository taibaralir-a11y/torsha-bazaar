import React from 'react';
import { HeroBanner } from './HeroBanner';
import { ServicesGrid } from './ServicesGrid';
import { BestDealsSection } from './BestDealsSection';
import { FastDeliveryCard } from './FastDeliveryCard';
import { Product, CartItem, ServiceType, LanguageCode } from '../types';
import { 
  ArrowRight, 
  QrCode, 
  PhoneCall, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  Pill, 
  Beef, 
  Recycle, 
  MapPin,
  Clock,
  Stethoscope,
  AlertTriangle
} from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';

interface HomeViewProps {
  products: Product[];
  cart: CartItem[];
  currentLocation?: string;
  currentPincode?: string;
  language?: LanguageCode;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onSelectService: (service: ServiceType) => void;
  onTrackOrder: () => void;
  onViewAllDeals: () => void;
  onOpenPosterModal: () => void;
  isCatalogLoading?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  cart,
  currentLocation = 'Hasimara',
  currentPincode = '735215',
  language = 'en',
  onAddToCart,
  onUpdateQuantity,
  onSelectService,
  onTrackOrder,
  onViewAllDeals,
  onOpenPosterModal,
  isCatalogLoading = false
}) => {
  const t = (key: string, fallback: string) => {
    return TRANSLATIONS[language]?.[key] || fallback;
  };

  return (
    <div className="pb-24">
      {/* Hyperlocal Verified Area Notice */}
      <div className="bg-emerald-900/90 text-white px-4 py-2 flex items-center justify-between text-xs border-b border-emerald-800">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
          <span className="truncate">
            {t('local_first_notice', 'Showing verified shops in')}{' '}
            <strong className="text-yellow-300 underline font-bold">{currentLocation} ({currentPincode})</strong>
          </span>
        </div>
        <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0">
          Fast Local Delivery
        </span>
      </div>

      {/* Emergency Doctor & Home Visit Quick Access Card */}
      <div className="px-3 sm:px-4 pt-3">
        <div 
          onClick={() => onSelectService('emergency_doctor')}
          className="bg-gradient-to-r from-rose-900 via-rose-800 to-red-900 rounded-2xl p-3.5 text-white shadow-xs cursor-pointer hover:shadow-md transition-all flex items-center justify-between active:scale-98 border border-rose-700/60"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Stethoscope className="w-6 h-6 text-rose-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white px-1.5 py-0.2 rounded animate-pulse">
                  24x7 Emergency
                </span>
                <span className="text-[10px] text-rose-200 font-semibold">MBBS Doctors · Home Visits</span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5 leading-snug">
                Doctor Home Visit & Emergency Call
              </h4>
              <p className="text-[10px] text-rose-200">
                Verified physicians serving {currentLocation} & nearby tea estates · Hospital directory & 112
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-200 shrink-0 ml-1" />
        </div>
      </div>

      {/* 1. Hero Carousel Banner */}
      <HeroBanner
        onExploreGrocery={() => onSelectService('shopping')}
        onBookRide={() => onSelectService('toto')}
        onExploreServices={() => onSelectService('services')}
      />

      {/* 2. All 11 Hyperlocal Marketplace Categories */}
      <ServicesGrid onSelectService={onSelectService} language={language} />

      {/* 3. Specialized Marketplace Feature Cards (Mobiles, Pharmacy, Meat, Scrap) */}
      <div className="px-3 sm:px-4 py-1 space-y-2.5">
        {/* Brand New Mobiles Teaser */}
        <div 
          onClick={() => onSelectService('mobile')}
          className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-2xl p-3.5 text-white shadow-xs cursor-pointer hover:shadow-md transition-all flex items-center justify-between active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Smartphone className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider bg-yellow-400 text-gray-950 px-1.5 py-0.2 rounded">
                  100% Brand-New
                </span>
                <span className="text-[10px] text-indigo-200 font-semibold">Zero Refurbished</span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5 leading-snug">
                Official Samsung, Apple, Vivo & Realme Store
              </h4>
              <p className="text-[10px] text-indigo-200">Full brand warranty + mobile chargers, cables & covers</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-yellow-300 shrink-0 ml-1" />
        </div>

        {/* Medical & Fresh Meat Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Medical Shop */}
          <div 
            onClick={() => onSelectService('medical')}
            className="p-3 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 border border-red-200/80 cursor-pointer hover:shadow-xs transition-all active:scale-98"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
                <Pill className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold bg-red-200 text-red-900 px-1.5 py-0.2 rounded">
                Rx Upload
              </span>
            </div>
            <h5 className="text-xs font-bold text-gray-900 leading-tight">Medical & Pharmacy</h5>
            <p className="text-[10px] text-gray-600 mt-0.5">Licensed Dooars chemists with doctor prescription upload</p>
          </div>

          {/* Fresh Meat & Chicken */}
          <div 
            onClick={() => onSelectService('meat')}
            className="p-3 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-100 border border-rose-200/80 cursor-pointer hover:shadow-xs transition-all active:scale-98"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                <Beef className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded">
                Weight-Based
              </span>
            </div>
            <h5 className="text-xs font-bold text-gray-900 leading-tight">Fresh Meat & Chicken</h5>
            <p className="text-[10px] text-gray-600 mt-0.5">Order 250g, 500g, 1kg or custom cuts with butcher verification</p>
          </div>
        </div>

        {/* Kabari / Scrap Selling Banner */}
        <div 
          onClick={() => onSelectService('scrap')}
          className="bg-gradient-to-r from-lime-900 to-emerald-950 rounded-2xl p-3.5 text-white shadow-xs cursor-pointer hover:shadow-md transition-all flex items-center justify-between active:scale-98 border border-lime-700/60"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-lime-500/20 flex items-center justify-center shrink-0 border border-lime-400/30">
              <Recycle className="w-6 h-6 text-lime-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider bg-lime-400 text-black px-1.5 py-0.2 rounded">
                  Sell Scrap / कबाड़
                </span>
                <span className="text-[10px] text-lime-200 font-semibold">Doorstep Cash / UPI</span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5 leading-snug">
                Iron, Plastic, Newspaper & Copper Recyclables
              </h4>
              <p className="text-[10px] text-lime-200">Post photos, receive quotes from local Kabari buyers & accept</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-lime-300 shrink-0 ml-1" />
        </div>
      </div>

      {/* 4. Best Deals Section */}
      <BestDealsSection
        products={products}
        cart={cart}
        onAddToCart={onAddToCart}
        onUpdateQuantity={onUpdateQuantity}
        onViewAll={onViewAllDeals}
        isCatalogLoading={isCatalogLoading}
      />

      {/* 5. Fast Delivery Card */}
      <FastDeliveryCard onTrackOrder={onTrackOrder} />

      {/* 6. Dooars & Local Community Banner */}
      <div className="px-3 sm:px-4 py-2">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1 bg-yellow-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase mb-1.5">
              <Sparkles className="w-3 h-3 fill-gray-950" />
              Apne Sheher Ka Apna Bazaar
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
              Torsha & Dooars #1 Super App
            </h4>
            <p className="text-xs text-emerald-100 mt-1 max-w-[220px]">
              Serving Hasimara (735215), Kalchini (735217), Jaigaon (735182) & Satali (735214).
            </p>
          </div>

          <button
            onClick={onOpenPosterModal}
            className="bg-white/10 hover:bg-white/20 border border-white/20 p-2.5 rounded-xl text-center flex flex-col items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <QrCode className="w-6 h-6 text-yellow-300 mb-1" />
            <span className="text-[10px] font-bold text-emerald-50">App Poster</span>
          </button>
        </div>
      </div>

      {/* 7. Quick Ride Strip (Toto, Auto, Taxi - Strictly NO Bike Taxi) */}
      <div className="px-3 sm:px-4 py-2">
        <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">
              🛺
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-gray-900">
                Need a quick Toto, Auto or Taxi?
              </h5>
              <p className="text-[11px] text-gray-500">
                Local rides starting at just ₹20 • Safe 3W & 4W transport
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectService('toto')}
            className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-all shrink-0"
          >
            <span>Book</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 8. Need Help & Dooars Helpline */}
      <div className="px-3 sm:px-4 pt-1">
        <div className="text-center py-3 bg-gray-50 rounded-2xl border border-gray-200/60">
          <p className="text-xs font-semibold text-gray-600">
            Dedicated Customer Support for Dooars Region
          </p>
          <a
            href="tel:+919434012890"
            className="inline-flex items-center gap-1.5 mt-1 text-xs font-bold text-[#0E7438] hover:underline"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Helpline: +91 94340 12890</span>
          </a>
        </div>
      </div>
    </div>
  );
};


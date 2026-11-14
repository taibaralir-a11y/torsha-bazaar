import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Car, 
  Package, 
  Wrench, 
  Smartphone, 
  QrCode, 
  ChevronRight, 
  PhoneCall, 
  Info,
  ShieldCheck,
  Zap,
  Navigation,
  Pill,
  Beef,
  Recycle,
  Stethoscope,
  Heart,
  Truck,
  HelpCircle,
  FileText,
  Lock,
  Tag
} from 'lucide-react';
import { ServiceType, AppTab } from '../types';
import { CustomerPolicyModal, CustomerPolicyType } from './common/CustomerPolicyModal';

interface MoreViewProps {
  onSelectService: (service: ServiceType) => void;
  onOpenPosterModal: () => void;
  onOpenShopkeeper?: () => void;
  onNavigateTab?: (tab: AppTab) => void;
  onTrackOrder?: () => void;
  onOpenCart?: () => void;
  onOpenPartnerPortal?: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  onSelectService,
  onOpenPosterModal,
  onOpenShopkeeper,
  onNavigateTab,
  onTrackOrder,
  onOpenCart,
  onOpenPartnerPortal
}) => {
  const [activePolicy, setActivePolicy] = useState<CustomerPolicyType | null>(null);

  const customerServices = [
    { 
      id: 'emergency_doctor' as ServiceType, 
      title: '24x7 Emergency Doctor & Home Visit', 
      desc: 'Verified MBBS physicians & local hospital directory',
      icon: Stethoscope, 
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      badge: 'Urgent'
    },
    { 
      id: 'shopping' as ServiceType, 
      title: 'Kirana & Grocery Delivery', 
      desc: 'Daily essentials delivered in 15–30 mins',
      icon: ShoppingBag, 
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200' 
    },
    { 
      id: 'mobile' as ServiceType, 
      title: 'Brand-New Mobiles & Accessories', 
      desc: '100% genuine Samsung, Realme, Vivo & Apple',
      icon: Smartphone, 
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      badge: 'Sealed'
    },
    { 
      id: 'medical' as ServiceType, 
      title: 'Medical Shop & Pharmacy', 
      desc: 'Upload prescription or order OTC medicines',
      icon: Pill, 
      color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      badge: 'Rx'
    },
    { 
      id: 'meat' as ServiceType, 
      title: 'Fresh Meat & Chicken', 
      desc: 'Custom cut by weight from local butchers',
      icon: Beef, 
      color: 'text-red-700 bg-red-50 border-red-200' 
    },
    { 
      id: 'scrap' as ServiceType, 
      title: 'Sell Scrap / Kabari Marketplace', 
      desc: 'Cash for newspapers, iron, metals & plastics',
      icon: Recycle, 
      color: 'text-lime-700 bg-lime-50 border-lime-200',
      badge: 'Cash'
    },
    { 
      id: 'toto' as ServiceType, 
      title: 'Toto (E-Rickshaw) Booking', 
      desc: 'Quick local transit across tea estates & towns',
      icon: Zap, 
      color: 'text-sky-700 bg-sky-50 border-sky-200' 
    },
    { 
      id: 'auto' as ServiceType, 
      title: 'Auto Rickshaw Booking', 
      desc: 'Point-to-point auto rides with direct bidding',
      icon: Navigation, 
      color: 'text-amber-700 bg-amber-50 border-amber-200' 
    },
    { 
      id: 'taxi' as ServiceType, 
      title: 'Taxi & Cab Booking', 
      desc: 'Car rides across Dooars (strictly zero bike taxis)',
      icon: Car, 
      color: 'text-yellow-700 bg-yellow-50 border-yellow-200' 
    },
    { 
      id: 'delivery' as ServiceType, 
      title: 'Local Parcel Courier', 
      desc: 'Hyperlocal document & package delivery',
      icon: Package, 
      color: 'text-orange-700 bg-orange-50 border-orange-200' 
    },
    { 
      id: 'services' as ServiceType, 
      title: 'Home Services & Repairs', 
      desc: 'Electricians, plumbers, mechanics & carpenters',
      icon: Wrench, 
      color: 'text-teal-700 bg-teal-50 border-teal-200' 
    }
  ];

  return (
    <div className="pb-24">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 p-4 sticky top-14 z-20 shadow-xs">
        <h2 className="text-lg font-bold text-gray-900">
          Services & Support
        </h2>
        <p className="text-xs text-emerald-700 font-medium">Customer Marketplace & Quick Help</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Customer Quick Shortcuts */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onNavigateTab ? onNavigateTab('orders') : null}
            className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-col items-center text-center hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-800 leading-tight">My Orders</span>
          </button>

          <button
            onClick={onTrackOrder}
            className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-col items-center text-center hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-1">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-800 leading-tight">Track Live</span>
          </button>

          <button
            onClick={onOpenCart}
            className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-col items-center text-center hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-1">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-800 leading-tight">My Cart</span>
          </button>

          <button
            onClick={() => onNavigateTab ? onNavigateTab('categories') : null}
            className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-col items-center text-center hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-1">
              <Tag className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-800 leading-tight">Hot Deals</span>
          </button>
        </div>

        {/* Poster & QR Code Banner */}
        <div
          onClick={onOpenPosterModal}
          className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-4 text-white shadow-xs cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <QrCode className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Share Torsa Bazaar Poster & QR
              </h3>
              <p className="text-[11px] text-emerald-100">
                Apne Sheher Ka Apna Hyperlocal App
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-200 shrink-0" />
        </div>

        {/* All Hyperlocal Customer Services Directory */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Marketplace Services
            </h3>
            <span className="text-[10px] text-emerald-700 font-semibold">11 Categories</span>
          </div>

          <div className="divide-y divide-gray-100">
            {customerServices.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectService(item.id)}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 shrink-0 ml-2" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Help & Legal Information (Purely Customer-Facing) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs space-y-1">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 py-1">
            Support & Policies
          </h3>

          <button
            onClick={() => setActivePolicy('help')}
            className="w-full flex items-center justify-between p-2.5 hover:bg-purple-50/70 rounded-xl text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">Help & Customer Support</span>
                <span className="text-[10px] text-gray-500">Helpline: +91 94340 12891 · 7 AM – 10 PM</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => setActivePolicy('about')}
            className="w-full flex items-center justify-between p-2.5 hover:bg-emerald-50/70 rounded-xl text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">About Torsa Bazaar</span>
                <span className="text-[10px] text-gray-500">Local Dooars Hyperlocal Mission</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => setActivePolicy('privacy')}
            className="w-full flex items-center justify-between p-2.5 hover:bg-blue-50/70 rounded-xl text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">Privacy Policy</span>
                <span className="text-[10px] text-gray-500">100% Data Protection Guarantee</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => setActivePolicy('terms')}
            className="w-full flex items-center justify-between p-2.5 hover:bg-amber-50/70 rounded-xl text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">Terms & Conditions</span>
                <span className="text-[10px] text-gray-500">Customer Agreement & Fair Pricing</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Footer & Discreet Staff/Partner Access */}
        <div className="text-center pt-2 pb-1 space-y-2">
          <div className="text-xs text-gray-400">
            <p className="font-semibold text-gray-600">TORSA BAZAAR</p>
            <p className="text-[11px]">Local Market • Better Life | Version 2.5.0</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Serving Satali, Hasimara, Kalchini & Alipurduar, West Bengal</p>
          </div>

          {/* Discreet authorized partner/admin portal switcher */}
          {(onOpenPartnerPortal || onOpenShopkeeper) && (
            <div className="pt-2">
              <button
                onClick={onOpenPartnerPortal || onOpenShopkeeper}
                className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span>Authorized Partner & Staff Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Policy Modal */}
      {activePolicy && (
        <CustomerPolicyModal
          isOpen={activePolicy !== null}
          onClose={() => setActivePolicy(null)}
          type={activePolicy}
        />
      )}
    </div>
  );
};

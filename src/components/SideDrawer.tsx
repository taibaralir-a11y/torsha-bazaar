import React, { useState } from 'react';
import { 
  X, 
  Home, 
  ShoppingBag, 
  Car, 
  Package, 
  Wrench, 
  Smartphone, 
  QrCode, 
  ChevronRight, 
  ShieldCheck, 
  User, 
  Pill,
  Beef,
  Recycle,
  Globe,
  Stethoscope,
  Heart,
  Truck,
  HelpCircle,
  FileText,
  Info,
  LogIn,
  LogOut,
  MapPin,
  Tag
} from 'lucide-react';
import { ServiceType, AppTab, LanguageCode, UserProfile } from '../types';
import { PWAInstallButton } from './common/PWAInstallButton';
import { TRANSLATIONS } from '../utils/translations';
import { CustomerPolicyModal, CustomerPolicyType } from './common/CustomerPolicyModal';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language?: LanguageCode;
  onSelectLanguage?: (lang: LanguageCode) => void;
  onSelectTab: (tab: AppTab) => void;
  onSelectService: (service: ServiceType) => void;
  onTrackOrder: () => void;
  onOpenPosterModal: () => void;
  onOpenUniversalQr?: () => void;
  onOpenAuthModal?: () => void;
  onOpenCart?: () => void;
  user?: UserProfile;
  onLogout?: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  language = 'en',
  onSelectLanguage,
  onSelectTab,
  onSelectService,
  onTrackOrder,
  onOpenPosterModal,
  onOpenUniversalQr,
  onOpenAuthModal,
  onOpenCart,
  user,
  onLogout
}) => {
  const [activePolicy, setActivePolicy] = useState<CustomerPolicyType | null>(null);

  if (!isOpen) return null;

  const t = (key: string, fallback: string) => {
    return TRANSLATIONS[language]?.[key] || fallback;
  };

  const customerServices = [
    { label: '🚨 Emergency Doctor (24x7)', icon: Stethoscope, action: () => onSelectService('emergency_doctor'), badge: '24x7', highlight: true },
    { label: t('service_kirana', 'Kirana & Grocery Delivery'), icon: ShoppingBag, action: () => onSelectService('shopping') },
    { label: t('service_mobiles', 'Brand-New Mobiles & Tech'), icon: Smartphone, action: () => onSelectService('mobile'), badge: '100% Genuine' },
    { label: t('service_medical', 'Medical Shop & Pharmacy'), icon: Pill, action: () => onSelectService('medical'), badge: 'Rx' },
    { label: t('service_meat', 'Fresh Meat & Chicken'), icon: Beef, action: () => onSelectService('meat') },
    { label: t('service_scrap', 'Sell Scrap / Kabari Marketplace'), icon: Recycle, action: () => onSelectService('scrap'), badge: 'Cash' },
    { label: t('service_toto', 'Toto (E-Rickshaw) Booking'), icon: Car, action: () => onSelectService('toto') },
    { label: t('service_auto', 'Auto Rickshaw Booking'), icon: Car, action: () => onSelectService('auto') },
    { label: t('service_taxi', 'Taxi & Cab Booking'), icon: Car, action: () => onSelectService('taxi') },
    { label: t('service_courier', 'Local Parcel Courier'), icon: Package, action: () => onSelectService('delivery') },
    { label: t('service_services', 'Local Home Services & Repairs'), icon: Wrench, action: () => onSelectService('services') }
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex">
        <div className="bg-white w-full max-w-xs h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
          {/* Drawer Header with Brand & Close */}
          <div className="bg-[#0E7438] text-white p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-xl font-extrabold text-[#FBBF24] font-heading tracking-wide">
                TORSHA BAZAAR
              </span>
              <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                Local Market • Better Life
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-emerald-800 text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Customer Profile Card */}
          <div className="bg-emerald-900/95 text-white p-3.5 flex items-center justify-between border-b border-emerald-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-700 border border-emerald-400 flex items-center justify-center text-sm font-bold shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate">
                    {user?.name || 'Customer'}
                  </h4>
                  <span className="text-[9px] bg-yellow-400 text-gray-950 font-black px-1.5 py-0.2 rounded uppercase shrink-0">
                    {user?.location || 'Satali'}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-200 truncate mt-0.5">
                  {user?.phone || 'Local Shopper'}
                </p>
              </div>
            </div>

            {onOpenAuthModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs shrink-0 transition-colors"
                title="Customer Sign In / Switch"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Menu list */}
          <div className="flex-1 overflow-y-auto p-3 divide-y divide-gray-100">
            {/* Language Switcher Bar inside drawer */}
            {onSelectLanguage && (
              <div className="pb-3 flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Language / ভাষা:</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectLanguage('en')}
                    className={`px-2 py-0.5 rounded-md text-xs font-bold transition-colors ${
                      language === 'en' ? 'bg-[#0E7438] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => onSelectLanguage('hi')}
                    className={`px-2 py-0.5 rounded-md text-xs font-bold transition-colors ${
                      language === 'hi' ? 'bg-[#0E7438] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    हिंदी
                  </button>
                  <button
                    onClick={() => onSelectLanguage('bn')}
                    className={`px-2 py-0.5 rounded-md text-xs font-bold transition-colors ${
                      language === 'bn' ? 'bg-[#0E7438] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    বাংলা
                  </button>
                </div>
              </div>
            )}

            {/* PWA Home Screen Install Card */}
            <div className="py-2.5">
              <PWAInstallButton variant="drawer" showInstalledStatus={true} />
            </div>

            {/* Customer Quick Links */}
            <div className="py-2 space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1 block mb-1">
                My Shopping & Account
              </span>

              <button
                onClick={() => {
                  onSelectTab('home');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0E7438] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-emerald-700" />
                  <span>Home</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('categories');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0E7438] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-emerald-700" />
                  <span>Browse Categories & Deals</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('orders');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0E7438] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-emerald-700" />
                  <span>My Orders</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  onTrackOrder();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0E7438] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-sky-700" />
                  <span>Track Active Delivery</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  onSelectTab('account');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0E7438] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>My Profile & Saved Address</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            {/* Hyperlocal Marketplace Services */}
            <div className="space-y-0.5 py-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1 block mb-1">
                Hyperlocal Marketplace
              </span>
              {customerServices.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                      item.highlight
                        ? 'bg-rose-50 text-rose-950 border border-rose-200 hover:bg-rose-100 font-bold'
                        : 'text-gray-700 hover:bg-emerald-50 hover:text-[#0E7438]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${item.highlight ? 'text-rose-600' : 'text-emerald-700'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {item.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          item.highlight ? 'bg-rose-600 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Customer Support & Policies */}
            <div className="space-y-0.5 py-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1 block mb-1">
                Support & Information
              </span>

              <button
                onClick={() => setActivePolicy('help')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-purple-700" />
                  <span>Help & Customer Support</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                onClick={() => setActivePolicy('about')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-emerald-700" />
                  <span>About Torsa Bazaar</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                onClick={() => setActivePolicy('privacy')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Privacy Policy</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                onClick={() => setActivePolicy('terms')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Terms & Conditions</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenUniversalQr) onOpenUniversalQr();
                  else onOpenPosterModal();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-4 h-4 text-yellow-600" />
                  <span>Scan Universal App QR</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            {/* Logout / Switch Account */}
            {onLogout && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Customer Account</span>
                </button>
              </div>
            )}
          </div>
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
    </>
  );
};

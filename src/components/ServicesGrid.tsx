import React from 'react';
import { 
  ShoppingBag, 
  Car, 
  Package, 
  Wrench, 
  Briefcase, 
  Smartphone,
  Zap,
  Navigation,
  Pill,
  Beef,
  Recycle,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import { ServiceType, LanguageCode } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface ServicesGridProps {
  onSelectService: (service: ServiceType) => void;
  language?: LanguageCode;
}

export const ServicesGrid: React.FC<ServicesGridProps> = ({ 
  onSelectService,
  language = 'en'
}) => {
  const t = (key: string, fallback: string) => {
    return TRANSLATIONS[language]?.[key] || fallback;
  };

  const services: {
    id: ServiceType;
    label: string;
    sublabel?: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    badge?: string;
  }[] = [
    {
      id: 'emergency_doctor',
      label: 'Emergency Doctor',
      sublabel: 'MBBS & Home Visits',
      icon: <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600" />,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 hover:bg-rose-100/80',
      borderColor: 'border-rose-300',
      badge: '24x7 Urgent'
    },
    {
      id: 'shopping',
      label: t('service_kirana', 'Kirana & Grocery'),
      sublabel: 'Daily essentials',
      icon: <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-[#0E7438]" />,
      color: 'text-[#0E7438]',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100/80',
      borderColor: 'border-emerald-200/80',
      badge: 'Popular'
    },
    {
      id: 'mobile',
      label: t('service_mobiles', 'Brand-New Mobiles'),
      sublabel: 'New phones & accessories',
      icon: <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100/80',
      borderColor: 'border-indigo-200/80',
      badge: '100% Brand New'
    },
    {
      id: 'medical',
      label: t('service_medical', 'Medical Shop'),
      sublabel: 'Prescription medicines',
      icon: <Pill className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100/80',
      borderColor: 'border-red-200/80',
      badge: 'Rx'
    },
    {
      id: 'meat',
      label: t('service_meat', 'Fresh Meat & Chicken'),
      sublabel: 'Weight-based daily cuts',
      icon: <Beef className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600" />,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 hover:bg-rose-100/80',
      borderColor: 'border-rose-200/80',
      badge: 'Fresh'
    },
    {
      id: 'scrap',
      label: t('service_scrap', 'Sell Scrap (Kabari)'),
      sublabel: 'Highest Mandi rates',
      icon: <Recycle className="w-6 h-6 sm:w-7 sm:h-7 text-lime-700" />,
      color: 'text-lime-700',
      bgColor: 'bg-lime-50 hover:bg-lime-100/80',
      borderColor: 'border-lime-300/80',
      badge: 'Cash Pickup'
    },
    {
      id: 'toto',
      label: t('service_toto', 'Toto (E-Rickshaw)'),
      sublabel: 'Eco local commute',
      badge: 'Eco',
      icon: (
        <div className="relative">
          <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-sky-600" />
          <span className="absolute -bottom-1 -right-1 text-[8px] font-black bg-sky-500 text-white px-1 rounded">E</span>
        </div>
      ),
      color: 'text-sky-600',
      bgColor: 'bg-sky-50 hover:bg-sky-100/80',
      borderColor: 'border-sky-200/80'
    },
    {
      id: 'auto',
      label: t('service_auto', 'Auto Rickshaw'),
      sublabel: 'Point to point 3-wheeler',
      icon: (
        <div className="relative">
          <Navigation className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
          <span className="absolute -bottom-1 -right-1 text-[8px] font-black bg-yellow-400 text-black px-1 rounded">3W</span>
        </div>
      ),
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100/80',
      borderColor: 'border-emerald-200/80'
    },
    {
      id: 'taxi',
      label: t('service_taxi', 'Taxi & Cab'),
      sublabel: 'Outstation & Station rides',
      icon: <Car className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 hover:bg-amber-100/80',
      borderColor: 'border-amber-200/80'
    },
    {
      id: 'delivery',
      label: t('service_courier', 'Local Delivery'),
      sublabel: 'Doorstep parcel pickup',
      icon: <Package className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" />,
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 hover:bg-orange-100/80',
      borderColor: 'border-orange-200/80'
    },
    {
      id: 'services',
      label: t('service_services', 'Home Services'),
      sublabel: 'Electrician, plumber, etc.',
      icon: <Wrench className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600" />,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50 hover:bg-teal-100/80',
      borderColor: 'border-teal-200/80'
    },
    {
      id: 'jobs',
      label: t('service_jobs', 'Local Jobs'),
      sublabel: 'Tea gardens & local stores',
      icon: <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-stone-700" />,
      color: 'text-stone-800',
      bgColor: 'bg-stone-50 hover:bg-stone-100/80',
      borderColor: 'border-stone-200'
    }
  ];

  return (
    <div className="px-3 sm:px-4 py-2.5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
          <span>Hyperlocal Services</span>
          <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Dooars Region
          </span>
        </h3>
        <span className="text-[10px] font-bold text-gray-400">Zero Bike Taxi</span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        {services.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectService(item.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl bg-white border ${item.borderColor} shadow-xs hover:shadow-sm active:scale-95 transition-all text-center relative group`}
          >
            {item.badge && (
              <span className={`absolute -top-1 -right-1 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase shadow-xs ${
                item.id === 'scrap' ? 'bg-lime-700 text-white' :
                item.id === 'mobile' ? 'bg-indigo-700 text-white' :
                item.id === 'meat' ? 'bg-rose-700 text-white' :
                item.id === 'medical' ? 'bg-red-600 text-white' :
                'bg-emerald-700 text-white'
              }`}>
                {item.badge}
              </span>
            )}
            
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${item.bgColor} mb-1 transition-transform group-hover:scale-105 duration-200`}>
              {item.icon}
            </div>

            <span className="text-[10px] sm:text-[11px] font-bold text-gray-800 leading-tight line-clamp-2 px-0.5">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};


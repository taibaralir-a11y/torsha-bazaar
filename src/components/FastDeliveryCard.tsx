import React from 'react';
import { ArrowRight, Clock, ShieldCheck } from 'lucide-react';

interface FastDeliveryCardProps {
  onTrackOrder: () => void;
  activeOrderEta?: string;
}

export const FastDeliveryCard: React.FC<FastDeliveryCardProps> = ({
  onTrackOrder,
  activeOrderEta = '15-20 mins'
}) => {
  return (
    <div className="px-4 py-3">
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-100/60 rounded-2xl border border-emerald-200/80 p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex items-center justify-between">
        {/* Left side rider illustration & info */}
        <div className="flex items-center gap-3 z-10 max-w-[65%]">
          {/* Rider Icon Badge */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0E7438] flex items-center justify-center shrink-0 shadow-md relative">
            <span className="text-3xl select-none" role="img" aria-label="Delivery Scooter">
              🛵
            </span>
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-[9px] font-black text-black px-1.5 py-0.2 rounded-full">
              LIVE
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                Fast Delivery
              </h3>
            </div>
            <p className="text-xs text-gray-600 font-medium leading-snug">
              Get your order at your door step
            </p>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-800 font-semibold">
              <Clock className="w-3 h-3 text-emerald-600" />
              <span>Avg: {activeOrderEta}</span>
            </div>
          </div>
        </div>

        {/* Right action button */}
        <div className="z-10">
          <button
            onClick={onTrackOrder}
            className="bg-[#0E7438] hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm py-2 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all whitespace-nowrap"
          >
            <span>Track Order</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Background decorative watermark */}
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
          <ShieldCheck className="w-36 h-36 text-emerald-900" />
        </div>
      </div>
    </div>
  );
};

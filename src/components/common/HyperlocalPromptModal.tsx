import React from 'react';
import { MapPin, AlertCircle, ArrowRight, X, Clock, ShieldCheck } from 'lucide-react';

interface HyperlocalPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocality: string;
  targetLocality: string;
  distanceKm: number;
  deliveryTime: string;
  deliveryCharge: number;
  onConfirmExpand: () => void;
}

export const HyperlocalPromptModal: React.FC<HyperlocalPromptModalProps> = ({
  isOpen,
  onClose,
  currentLocality,
  targetLocality,
  distanceKm,
  deliveryTime,
  deliveryCharge,
  onConfirmExpand
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Hyperlocal Search Notice</h3>
              <p className="text-[11px] text-gray-500">Local-First Rule Enforced</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200/70 text-xs text-amber-950 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              No store in your locality <strong>({currentLocality})</strong> currently has this item in stock.
            </p>
          </div>

          <div className="bg-white/80 rounded-xl p-2.5 space-y-1 text-gray-800 border border-amber-100">
            <p className="font-bold text-xs text-emerald-800">Available from nearby verified store:</p>
            <p className="flex items-center justify-between text-[11px]">
              <span>Store Location:</span>
              <strong className="text-gray-900">{targetLocality} (~{distanceKm} km away)</strong>
            </p>
            <p className="flex items-center justify-between text-[11px]">
              <span>Estimated Delivery:</span>
              <strong>{deliveryTime}</strong>
            </p>
            <p className="flex items-center justify-between text-[11px]">
              <span>Delivery Fee:</span>
              <strong className="text-emerald-700">₹{deliveryCharge}</strong>
            </p>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 text-center">
          Torsha Bazaar never silently redirects your order. Would you like to view items from {targetLocality}?
        </p>

        <div className="pt-1 flex flex-col gap-2">
          <button
            onClick={() => {
              onConfirmExpand();
              onClose();
            }}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>Explore Stores from {targetLocality}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Stay in {currentLocality} Only
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, CheckCircle2, QrCode, Share2, Sparkles } from 'lucide-react';

interface PosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PosterModal: React.FC<PosterModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
    'Online Shopping',
    'Taxi Booking',
    'Auto Booking',
    'Toto Booking',
    'Local Delivery',
    'Local Services',
    'Jobs',
    'Second-hand Phones'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0E7438] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <div>
              <h3 className="text-base font-bold">TORSA BAZAAR</h3>
              <p className="text-[11px] text-emerald-100">Your Local Super App • Official Poster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-emerald-800 text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Poster Image Display */}
        <div className="p-3 bg-gray-900 flex justify-center">
          <div className="max-h-[60vh] overflow-hidden rounded-xl border-2 border-emerald-500/40 shadow-inner">
            <img
              src="/public/assets/aistudio/IMG-20261107-WA0006_ea0c401d.jpg"
              alt="Torsa Bazaar Official Banner and Super App Poster"
              className="w-full h-auto max-h-[60vh] object-contain"
            />
          </div>
        </div>

        {/* Feature List & Tagline */}
        <div className="p-4 space-y-3">
          <div className="text-center">
            <span className="text-xs font-black uppercase text-[#0E7438] tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">
              Apne Sheher Ka Apna Bazaar
            </span>
            <h4 className="text-sm font-bold text-gray-900 mt-1.5">
              Scan • Shop • Ride • Delivery • More
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-2xl border border-gray-100">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-gray-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0E7438] shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Free For All Users
            </span>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Torsa Bazaar - Local Super App',
                    text: 'Download Torsa Bazaar for online shopping, Toto & Taxi booking, parcel delivery and services in Kalchini!',
                    url: window.location.href
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Torsa Bazaar app link copied to clipboard!');
                }
              }}
              className="bg-[#0E7438] hover:bg-emerald-800 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share App Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

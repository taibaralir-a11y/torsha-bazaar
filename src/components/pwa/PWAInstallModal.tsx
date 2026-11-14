import React from 'react';
import { X, Smartphone, Share, MoreVertical, PlusSquare, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isAndroid: boolean;
  onNativeInstall?: () => void;
  hasNativePrompt: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isAndroid,
  onNativeInstall,
  hasNativePrompt
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-emerald-100 flex flex-col gap-4 text-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center shadow-md overflow-hidden p-1 border border-emerald-600">
              <img src="/pwa-192x192.png" alt="Torsha" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Install TORSHA BAZAAR</h3>
              <p className="text-xs text-emerald-700 font-semibold">Official Progressive Web App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits Badges */}
        <div className="grid grid-cols-3 gap-2 py-1 text-center">
          <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
            <Zap className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-emerald-900 block leading-tight">Instant Open</span>
            <span className="text-[9px] text-gray-500">Zero loading delay</span>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
            <Smartphone className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-emerald-900 block leading-tight">Home Screen</span>
            <span className="text-[9px] text-gray-500">Standalone App</span>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-emerald-900 block leading-tight">Safe Offline</span>
            <span className="text-[9px] text-gray-500">Cached Shell</span>
          </div>
        </div>

        {/* Native 1-Click Install if supported */}
        {hasNativePrompt && onNativeInstall ? (
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => {
                onNativeInstall();
                onClose();
              }}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition"
            >
              <Smartphone className="w-4 h-4" />
              1-Click Install Now
            </button>
            <p className="text-[11px] text-center text-gray-500">
              Adds TORSHA BAZAAR icon directly to your phone's home screen.
            </p>
          </div>
        ) : isIOS ? (
          /* iOS Safari Step-by-Step Instructions */
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs flex flex-col gap-2.5">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[11px] flex items-center justify-center">🍎</span>
              How to install on iPhone & iPad:
            </span>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700 shrink-0">1.</span>
                <span>Tap the <strong className="inline-flex items-center gap-1 font-semibold text-gray-900"><Share className="w-3.5 h-3.5 text-blue-600 inline" /> Share</strong> button in Safari's bottom toolbar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700 shrink-0">2.</span>
                <span>Scroll down and tap <strong className="inline-flex items-center gap-1 font-semibold text-gray-900"><PlusSquare className="w-3.5 h-3.5 text-emerald-700 inline" /> Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700 shrink-0">3.</span>
                <span>Tap <strong className="font-semibold text-blue-600">Add</strong> at the top right to finish!</span>
              </li>
            </ol>
          </div>
        ) : isAndroid ? (
          /* Android Chrome / Browser Step-by-Step */
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs flex flex-col gap-2.5">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center">🤖</span>
              How to install on Android:
            </span>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700 shrink-0">1.</span>
                <span>Tap the <strong className="inline-flex items-center gap-1 font-semibold text-gray-900"><MoreVertical className="w-3.5 h-3.5 text-gray-700 inline" /> Menu (3 dots)</strong> at the top right of Chrome.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700 shrink-0">2.</span>
                <span>Select <strong className="font-semibold text-gray-900">"Install app"</strong> or <strong className="font-semibold text-gray-900">"Add to Home screen"</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700 shrink-0">3.</span>
                <span>Confirm <strong className="font-semibold text-emerald-700">Install</strong> to launch Torsha Bazaar in full screen.</span>
              </li>
            </ol>
          </div>
        ) : (
          /* Desktop Chrome / Edge Instructions */
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs flex flex-col gap-2.5">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-700" />
              How to install on Desktop / Laptop:
            </span>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700 shrink-0">1.</span>
                <span>Look for the <strong className="font-semibold text-gray-900">Install app icon (⊕)</strong> on the right side of your address bar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700 shrink-0">2.</span>
                <span>Or click <strong className="font-semibold text-gray-900">Browser Menu (⋮)</strong> &gt; <strong className="font-semibold text-gray-900">"Install TORSHA BAZAAR"</strong>.</span>
              </li>
            </ol>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            No Play Store / App Store login needed
          </span>
          <button
            onClick={onClose}
            className="text-emerald-700 font-bold hover:underline"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Download, CheckCircle2, Smartphone, ArrowDownToLine } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'drawer' | 'banner' | 'chip';
  className?: string;
  showInstalledStatus?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
  showInstalledStatus = false,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install, hasPrompt } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running in standalone mode
  if (isInstalled) {
    if (!showInstalledStatus) return null;
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>App Installed</span>
      </div>
    );
  }

  const handleClick = async () => {
    if (hasPrompt) {
      const outcome = await install();
      if (outcome === 'accepted') {
        return;
      }
    }
    // Show instruction modal if not native or if prompt dismissed
    setIsModalOpen(true);
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleClick}
          title="Install TORSHA BAZAAR App on your phone"
          className={`flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-95 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md shadow-emerald-950/20 transition-all border border-emerald-400/30 ${className}`}
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {variant === 'chip' && (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 active:scale-95 transition shadow-sm ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      )}

      {variant === 'drawer' && (
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 hover:border-emerald-300 text-left transition group ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                Install TORSHA BAZAAR
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-600 text-white">PWA</span>
              </div>
              <p className="text-[11px] text-gray-500">Fast 1-tap launcher on home screen</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
            Free
          </span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`p-3 rounded-xl bg-gradient-to-r from-emerald-700 to-green-800 text-white shadow-md flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Smartphone className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Install TORSHA App for Quick Access</p>
              <p className="text-[10px] text-emerald-100">Works offline • High speed • Zero storage waste</p>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="shrink-0 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition"
          >
            Install
          </button>
        </div>
      )}

      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        hasNativePrompt={hasPrompt}
        onNativeInstall={install}
      />
    </>
  );
};

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedToast(true);
      const timer = setTimeout(() => {
        setShowReconnectedToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showReconnectedToast) {
    return (
      <aside
        aria-live="polite"
        className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xl animate-in slide-in-from-top-4 duration-300"
      >
        <Wifi className="w-4 h-4 text-emerald-200" />
        <span>Back Online — Live sync restored</span>
      </aside>
    );
  }

  if (isOnline) return null;

  return (
    <aside
      aria-live="assertive"
      className="fixed bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md rounded-2xl bg-amber-500 text-white p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-300 border border-amber-400"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-600/50 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold leading-tight">Offline Mode</p>
          <p className="text-[11px] text-amber-100">Showing cached app shell. Live orders need internet.</p>
        </div>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="shrink-0 flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    </aside>
  );
};

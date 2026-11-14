import React from 'react';
import { Menu, Bell, ShoppingCart, Search, MapPin, ChevronDown, Crosshair, QrCode, Globe, User } from 'lucide-react';
import { InstallAppButton } from './InstallAppButton';
import { LanguageCode } from '../types';

interface HeaderProps {
  currentLocation: string;
  currentPincode?: string;
  language: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onOpenLocationModal: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenCart: () => void;
  onOpenPosterModal: () => void;
  onOpenShopkeeper: () => void;
  onOpenPortalSwitcher?: () => void;
  onOpenUniversalQr?: () => void;
  onOpenAuthModal?: () => void;
  cartCount: number;
  notificationCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  currentPincode = '735215',
  language,
  onSelectLanguage,
  onOpenLocationModal,
  onOpenMenu,
  onOpenNotifications,
  onOpenCart,
  onOpenPosterModal,
  onOpenShopkeeper,
  onOpenPortalSwitcher,
  onOpenUniversalQr,
  onOpenAuthModal,
  cartCount,
  notificationCount,
  searchQuery,
  onSearchChange,
  onSearchSubmit
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0E7438] text-white shadow-md">
      {/* Top Bar with Brand, Language, PWA, Menu, and Action Icons */}
      <div className="px-3 sm:px-4 pt-3 pb-2 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMenu}
            className="p-1.5 rounded-lg hover:bg-emerald-800/80 active:scale-95 transition-transform"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold tracking-wider text-[#FBBF24] font-heading drop-shadow-sm">
                TORSHA BAZAAR
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-emerald-100 tracking-tight leading-none">
              Dooars Hyperlocal Super App
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Language Switcher Button (EN / हि / বা) */}
          <div className="flex items-center bg-emerald-900/90 rounded-full p-0.5 border border-emerald-600/70 text-[10px] font-bold">
            <button
              onClick={() => onSelectLanguage('en')}
              className={`px-1.5 py-0.5 rounded-full transition-colors ${
                language === 'en' ? 'bg-[#FBBF24] text-black font-extrabold' : 'text-emerald-100 hover:text-white'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => onSelectLanguage('hi')}
              className={`px-1.5 py-0.5 rounded-full transition-colors ${
                language === 'hi' ? 'bg-[#FBBF24] text-black font-extrabold' : 'text-emerald-100 hover:text-white'
              }`}
              title="हिंदी"
            >
              हि
            </button>
            <button
              onClick={() => onSelectLanguage('bn')}
              className={`px-1.5 py-0.5 rounded-full transition-colors ${
                language === 'bn' ? 'bg-[#FBBF24] text-black font-extrabold' : 'text-emerald-100 hover:text-white'
              }`}
              title="বাংলা"
            >
              বা
            </button>
          </div>

          {/* In-App PWA Install Button */}
          <InstallAppButton />

          {/* Customer Auth Button */}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="p-1.5 rounded-full hover:bg-emerald-800 text-white active:scale-95 transition-transform"
              title="Customer Login / Register"
              aria-label="Customer Account"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Universal QR code button */}
          <button
            onClick={onOpenUniversalQr || onOpenPosterModal}
            className="p-1.5 rounded-full hover:bg-emerald-800/80 text-emerald-100 active:scale-95 transition-transform"
            title="Scan Universal QR"
          >
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-full hover:bg-emerald-800 active:scale-95 transition-transform"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-white" />
            {notificationCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0E7438]">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Cart */}
          <button
            onClick={onOpenCart}
            className="relative p-1.5 rounded-full hover:bg-emerald-800 active:scale-95 transition-transform"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0E7438]">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="px-3 sm:px-4 pb-2.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (onSearchSubmit) onSearchSubmit();
          }}
          className="relative flex items-center"
        >
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search brand-new mobiles, kirana, medicines, meat..."
            className="w-full bg-white text-gray-800 placeholder-gray-400 text-xs sm:text-sm rounded-full pl-10 pr-4 py-2 sm:py-2.5 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </form>
      </div>

      {/* Location Selector Bar with PIN */}
      <div className="bg-[#0B6530] px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs border-t border-emerald-700/50">
        <button
          onClick={onOpenLocationModal}
          className="flex items-center gap-1.5 text-white hover:text-yellow-200 transition-colors font-medium truncate max-w-[70%]"
        >
          <MapPin className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
          <span className="font-bold truncate">{currentLocation}</span>
          <span className="text-[10px] font-mono bg-emerald-900/80 text-yellow-300 px-1.5 py-0.2 rounded border border-emerald-600/60">
            {currentPincode}
          </span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80 shrink-0" />
        </button>

        <button
          onClick={onOpenLocationModal}
          className="flex items-center gap-1 text-emerald-100 hover:text-white font-medium transition-colors text-[11px]"
        >
          <span>Change Area</span>
          <Crosshair className="w-3 h-3 text-yellow-300" />
        </button>
      </div>
    </header>
  );
};


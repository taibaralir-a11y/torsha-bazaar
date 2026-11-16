import React from 'react';
import { 
  X, 
  ShoppingBag, 
  Store, 
  ShieldAlert, 
  Car, 
  Truck, 
  Wrench, 
  Briefcase, 
  Check, 
  ArrowRight,
  Stethoscope,
  KeyRound,
  LogOut
} from 'lucide-react';
import { PartnerAccount, PortalMode } from '../../types';

interface PortalSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: PortalMode;
  onSelectMode: (mode: PortalMode) => void;
  userEmail?: string | null;
  isAdmin?: boolean;
  partnerAccount?: PartnerAccount | null;
  onOpenPartnerLogin?: () => void;
  onLogout?: () => void;
}

export const PortalSwitcherModal: React.FC<PortalSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
  userEmail,
  isAdmin = false,
  partnerAccount = null,
  onOpenPartnerLogin,
  onLogout
}) => {
  if (!isOpen) return null;

  const hasActivePartnerRole = Boolean(partnerAccount && partnerAccount.status === 'active');

  const displaySessionLabel = isAdmin
    ? `Super Admin: ${userEmail || 'Verified'}`
    : hasActivePartnerRole && partnerAccount
      ? `Partner (${partnerAccount.role.replace('_', ' ').toUpperCase()}): ${partnerAccount.loginEmail}`
      : userEmail && userEmail.trim()
        ? `Customer Session: ${userEmail}`
        : 'Guest / Customer Session';

  const allPortals = [
    {
      id: 'customer' as PortalMode,
      title: 'Customer Super App',
      desc: 'Browse groceries, order deals, book rides, request services & apply for jobs',
      icon: ShoppingBag,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      badge: 'Public'
    },
    {
      id: 'shopkeeper' as PortalMode,
      title: 'Shopkeeper Dashboard',
      desc: 'Manage store profile, inventory, stock, accept/reject incoming orders & update fulfillment',
      icon: Store,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      badge: 'Merchant'
    },
    {
      id: 'admin' as PortalMode,
      title: 'Super Admin Dashboard',
      desc: 'Approve shops, verify drivers & technicians, issue role accounts & monitor platform operations',
      icon: ShieldAlert,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
      badge: 'Authorized Admin'
    },
    {
      id: 'driver' as PortalMode,
      title: 'Driver Partner Portal',
      desc: 'Taxi, Auto & Toto ride dispatch (No bike taxi), accept ride requests & view daily earnings',
      icon: Car,
      color: 'text-sky-700 bg-sky-50 border-sky-200',
      badge: 'Rides'
    },
    {
      id: 'delivery' as PortalMode,
      title: 'Delivery Fleet Portal',
      desc: 'Accept assigned store & parcel deliveries, view customer route & update delivery steps',
      icon: Truck,
      color: 'text-orange-700 bg-orange-50 border-orange-200',
      badge: 'Courier'
    },
    {
      id: 'service_provider' as PortalMode,
      title: 'Service Provider Portal',
      desc: 'Electricians, plumbers, carpenters & mechanics dashboard to receive local home service requests',
      icon: Wrench,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
      badge: 'Technician'
    },
    {
      id: 'employer' as PortalMode,
      title: 'Employer & Jobs Portal',
      desc: 'Post local job vacancies for tea gardens, shops & logistics, and review applicants',
      icon: Briefcase,
      color: 'text-stone-700 bg-stone-100 border-stone-200',
      badge: 'Recruiter'
    },
    {
      id: 'doctor' as PortalMode,
      title: 'Doctor Partner Portal',
      desc: 'Verified MBBS & Specialists portal: emergency home visits, consultation fees & schedule',
      icon: Stethoscope,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      badge: 'Healthcare'
    },
    {
      id: 'kabari' as PortalMode,
      title: 'Kabari & Scrap Buyer Portal',
      desc: 'Review local scrap selling requests, submit purchase quotes (₹/kg) and schedule pickups',
      icon: Truck,
      color: 'text-lime-700 bg-lime-50 border-lime-300',
      badge: 'Recycler'
    }
  ];

  // Strict Role Isolation:
  // - Admin sees all portals
  // - Active Partner sees Customer view + strictly their assigned role portal
  // - Customer / Guest sees Customer view only (partner portals require Admin-issued login)
  const portals = isAdmin
    ? allPortals
    : hasActivePartnerRole && partnerAccount
      ? allPortals.filter((p) => p.id === 'customer' || p.id === partnerAccount.role)
      : allPortals.filter((p) => p.id === 'customer');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="min-w-0 pr-2">
            <h3 className="text-base font-bold text-gray-900">Portal Access & Role Switcher</h3>
            <p className="text-[11px] text-gray-500 truncate">{displaySessionLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {portals.map((portal) => {
            const Icon = portal.icon;
            const isCurrent = currentMode === portal.id;

            return (
              <button
                key={portal.id}
                onClick={() => {
                  onSelectMode(portal.id);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isCurrent
                    ? 'border-[#0E7438] bg-emerald-50/70 shadow-xs ring-1 ring-[#0E7438]'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${portal.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                        {portal.title}
                      </h4>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded">
                        {portal.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                      {portal.desc}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 mt-1">
                  {isCurrent ? (
                    <span className="w-6 h-6 rounded-full bg-[#0E7438] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  )}
                </div>
              </button>
            );
          })}

          {!isAdmin && onOpenPartnerLogin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPartnerLogin();
              }}
              className="w-full text-left p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-300 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {hasActivePartnerRole ? 'Switch Partner Credentials' : 'Authorized Partner Sign In'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sign in with Admin-issued email/mobile & password for Shopkeeper, Rider, Driver, Doctor or Business Partner.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          )}

          {hasActivePartnerRole && !isAdmin && onLogout && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full p-3 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Partner Session</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

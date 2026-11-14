import React from 'react';
import { Store, ArrowLeft, ShieldCheck, Clock, AlertTriangle, XCircle, LogOut } from 'lucide-react';
import { Shop, ShopApprovalStatus } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface ShopkeeperHeaderProps {
  shop: Shop;
  isAdmin?: boolean;
  onSwitchToCustomer: () => void;
  onAdminChangeStatus: (status: ShopApprovalStatus) => void;
}

export const ShopkeeperHeader: React.FC<ShopkeeperHeaderProps> = ({
  shop,
  isAdmin = false,
  onSwitchToCustomer,
  onAdminChangeStatus
}) => {
  const getStatusBadge = () => {
    switch (shop.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Approved & Live
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Rejected
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-gray-300">
            <AlertTriangle className="w-3.5 h-3.5 text-gray-600" />
            Suspended
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0E7438] text-white shadow-md">
      {/* Top action row */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-emerald-700/60 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToCustomer}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-100 hover:text-white bg-emerald-800/80 hover:bg-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-600/60 transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-yellow-300" />
            <span>Customer App</span>
          </button>
          <PWAInstallButton variant="header" />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1.5 bg-emerald-950/60 px-2.5 py-1 rounded-xl text-[11px] border border-emerald-700/50">
            <span className="text-gray-300 hidden sm:inline">Admin Status Control:</span>
            <select
              value={shop.status}
              onChange={(e) => onAdminChangeStatus(e.target.value as ShopApprovalStatus)}
              className="bg-transparent text-yellow-300 font-bold focus:outline-none cursor-pointer"
              title="Admin Approval/Rejection Control"
            >
              <option value="approved" className="text-gray-900 font-semibold">Approved (Selling Enabled)</option>
              <option value="pending" className="text-gray-900 font-semibold">Pending (Awaiting Admin)</option>
              <option value="rejected" className="text-gray-900 font-semibold">Rejected (Blocked)</option>
              <option value="suspended" className="text-gray-900 font-semibold">Suspended (Paused)</option>
            </select>
          </div>
        )}
      </div>

      {/* Main merchant branding header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
            {shop.imageUrl ? (
              <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-6 h-6 text-yellow-300" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white font-heading leading-tight truncate max-w-[200px] sm:max-w-xs">
                {shop.name}
              </h1>
            </div>
            <p className="text-[11px] text-emerald-100 flex items-center gap-1.5 mt-0.5">
              <span>{shop.locality}</span>
              <span>•</span>
              <span className="font-mono">{shop.contactNumber}</span>
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {getStatusBadge()}
        </div>
      </div>
    </header>
  );
};

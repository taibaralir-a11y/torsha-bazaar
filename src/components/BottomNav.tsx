import React from 'react';
import { Home, LayoutGrid, ClipboardList, User, MoreHorizontal } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  activeOrdersCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  activeOrdersCount
}) => {
  const tabs = [
    {
      id: 'home' as AppTab,
      label: 'Home',
      icon: Home
    },
    {
      id: 'categories' as AppTab,
      label: 'Categories',
      icon: LayoutGrid
    },
    {
      id: 'orders' as AppTab,
      label: 'My Orders',
      icon: ClipboardList,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined
    },
    {
      id: 'account' as AppTab,
      label: 'Account',
      icon: User
    },
    {
      id: 'more' as AppTab,
      label: 'More',
      icon: MoreHorizontal
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200/90 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] safe-area-bottom">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-[#0E7438] font-bold'
                  : 'text-gray-500 hover:text-gray-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-bold' : 'font-normal'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#0E7438] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

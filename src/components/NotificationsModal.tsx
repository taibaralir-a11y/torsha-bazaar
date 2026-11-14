import React from 'react';
import { X, Bell, Flame, Truck, Tag, Sparkles } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeal: () => void;
  onSelectTrack: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onSelectDeal,
  onSelectTrack
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      title: '🔥 Best Deal Alert: Fresh Tomato @ ₹30/kg',
      desc: 'Local farm fresh red tomatoes now at lowest mandi price in Kalchini. Limited stock today!',
      time: '15 mins ago',
      type: 'deal',
      onClick: () => {
        onClose();
        onSelectDeal();
      }
    },
    {
      id: 2,
      title: '🛵 Order #TB-9281 Out For Delivery',
      desc: 'Bikash Roy is riding to your address in Torsa, Kalchini. Expected delivery in 15 mins.',
      time: '25 mins ago',
      type: 'order',
      onClick: () => {
        onClose();
        onSelectTrack();
      }
    },
    {
      id: 3,
      title: '🛺 Instant Toto & Auto Rides now Active',
      desc: 'Book eco-friendly Toto e-rickshaw across Kalchini & Hamiltonganj starting at ₹20.',
      time: '2 hours ago',
      type: 'ride'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0E7438]" />
            <h3 className="text-base font-bold text-gray-900">Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={item.onClick}
              className={`p-3 rounded-2xl border transition-all text-xs cursor-pointer ${
                item.type === 'deal'
                  ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70'
                  : item.type === 'order'
                  ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70'
                  : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
              }`}
            >
              <h4 className="font-bold text-gray-900 leading-snug">{item.title}</h4>
              <p className="text-gray-600 mt-1 leading-relaxed">{item.desc}</p>
              <span className="text-[10px] text-gray-400 mt-1.5 block font-medium">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

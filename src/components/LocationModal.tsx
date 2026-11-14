import React, { useState, useMemo } from 'react';
import { X, MapPin, Check, Crosshair, Sparkles, Compass, Search, Filter } from 'lucide-react';
import { LocalityInfo } from '../types';
import { INITIAL_SERVICE_LOCALITIES } from '../utils/hyperlocalRouting';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  onSelectLocation: (localityName: string, pincode?: string) => void;
  localities?: LocalityInfo[];
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  localities = INITIAL_SERVICE_LOCALITIES
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPinFilter, setSelectedPinFilter] = useState<'all' | '735214' | '735215' | '735217' | '735182'>('all');
  const [selectedParentFilter, setSelectedParentFilter] = useState<'all' | 'Satali' | 'Hasimara' | 'Kalchini' | 'Jaigaon'>('all');

  const filteredLocalities = useMemo(() => {
    return localities.filter((loc) => {
      // PIN filter
      if (selectedPinFilter !== 'all' && loc.pincode !== selectedPinFilter) {
        return false;
      }
      // Parent area filter
      if (selectedParentFilter !== 'all' && loc.parentArea !== selectedParentFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = loc.name.toLowerCase().includes(q);
        const matchesPin = loc.pincode.includes(q);
        const matchesParent = loc.parentArea?.toLowerCase().includes(q);
        const matchesHub = loc.hubName?.toLowerCase().includes(q);
        const matchesLandmark = loc.popularLandmarks?.some((lm) => lm.toLowerCase().includes(q));
        return matchesName || matchesPin || matchesParent || matchesHub || matchesLandmark;
      }
      return true;
    });
  }, [localities, searchQuery, selectedPinFilter, selectedParentFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#0E7438]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Choose Your Exact Locality</h3>
              <p className="text-[11px] text-gray-500">Satali, Hasimara, Kalchini & Jaigaon Hubs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative shrink-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search locality, PIN (735214, 735215) or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl pl-9 pr-8 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0E7438] focus:bg-white transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Filter Badges (PIN codes & Parent Hubs) */}
        <div className="flex flex-wrap gap-1.5 shrink-0 text-[11px]">
          <button
            onClick={() => { setSelectedPinFilter('all'); setSelectedParentFilter('all'); }}
            className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
              selectedPinFilter === 'all' && selectedParentFilter === 'all'
                ? 'bg-[#0E7438] text-white border-[#0E7438]'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            All Localities
          </button>

          <button
            onClick={() => { setSelectedPinFilter('735214'); setSelectedParentFilter('all'); }}
            className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
              selectedPinFilter === '735214'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            PIN 735214 (Satali)
          </button>

          <button
            onClick={() => { setSelectedPinFilter('735215'); setSelectedParentFilter('all'); }}
            className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
              selectedPinFilter === '735215'
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
            }`}
          >
            PIN 735215 (Hasimara)
          </button>

          <button
            onClick={() => { setSelectedPinFilter('735217'); setSelectedParentFilter('all'); }}
            className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
              selectedPinFilter === '735217'
                ? 'bg-purple-700 text-white border-purple-700'
                : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
            }`}
          >
            PIN 735217 (Kalchini)
          </button>
        </div>

        {/* GPS Quick Detect button */}
        <button
          onClick={() => {
            // Find Satali or Hasimara default based on location
            const defaultLoc = localities[0];
            onSelectLocation(defaultLoc.name, defaultLoc.pincode);
            onClose();
          }}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs font-bold text-[#0E7438] hover:bg-emerald-100 transition-colors shadow-xs active:scale-98 shrink-0"
        >
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-[#0E7438] animate-pulse" />
            <div className="text-left">
              <span>Auto-detect Location (Nearest Local Hub)</span>
              <p className="text-[10px] font-normal text-emerald-800">Direct GPS satellite matching</p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">Fast</span>
        </button>

        {/* Localities List */}
        <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[220px]">
          <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
            <span>Verified Localities ({filteredLocalities.length})</span>
            <span>Do Not Group Together</span>
          </div>

          {filteredLocalities.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs space-y-1">
              <Compass className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-bold text-gray-700">No locality found matching "{searchQuery}"</p>
              <p className="text-[11px]">Try searching by PIN code 735214 or 735215</p>
            </div>
          ) : (
            filteredLocalities.map((loc: LocalityInfo) => {
              const cleanCurrent = currentLocation.toLowerCase().replace(/\(.*?\)/g, '').trim();
              const isSelected = cleanCurrent === loc.name.toLowerCase() || currentLocation.toLowerCase().includes(loc.name.toLowerCase());

              return (
                <button
                  key={loc.id}
                  onClick={() => {
                    onSelectLocation(loc.name, loc.pincode);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl text-left border transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'border-[#0E7438] bg-emerald-50/95 shadow-sm ring-2 ring-[#0E7438]/20'
                      : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-gray-900">{loc.name}</span>
                      <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md border border-gray-200">
                        PIN: {loc.pincode}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                        {loc.parentArea} Area
                      </span>
                    </div>
                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-[#0E7438] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <Compass className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-gray-600 font-medium">
                    {loc.hubName}
                  </p>

                  {loc.popularLandmarks && loc.popularLandmarks.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {loc.popularLandmarks.slice(0, 3).map((landmark: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-white text-gray-600 px-1.5 py-0.5 rounded border border-gray-200"
                        >
                          {landmark}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600 flex items-center gap-2 shrink-0">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Local shops serving your exact locality & PIN are prioritized automatically.</span>
        </div>
      </div>
    </div>
  );
};

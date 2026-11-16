import React, { useMemo, useState } from 'react';
import { ArrowLeft, Package, MapPin, Truck, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { LOCATIONS } from '../data/mockData';
import {
  DeliveryPerson,
  LocalityInfo,
  PartnerAccount,
  UniversalRoutingConfig
} from '../types';
import {
  evaluateDeliveryRiderEligibility,
  resolveAreaKey
} from '../utils/hyperlocalRouting';

interface DeliveryViewProps {
  onBackToHome: () => void;
  currentLocation: string;
  onRequestDelivery?: (req: any) => void;
  deliveryPersons?: DeliveryPerson[];
  routingConfig?: UniversalRoutingConfig;
  partnerAccounts?: PartnerAccount[];
  localities?: LocalityInfo[];
}

export const DeliveryView: React.FC<DeliveryViewProps> = ({ 
  onBackToHome, 
  currentLocation,
  onRequestDelivery,
  deliveryPersons = [],
  routingConfig,
  partnerAccounts = [],
  localities
}) => {
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState(currentLocation);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [dropAddress, setDropAddress] = useState('Kalchini Market');
  const [packageType, setPackageType] = useState('Documents & Files');
  const [packageWeight, setPackageWeight] = useState('Under 1 kg');
  const [isBooked, setIsBooked] = useState(false);

  const packageOptions = ['Documents & Files', 'Food / Home Tiffin', 'Medicines', 'Electronics / Spare Parts', 'Clothes / Gifts'];
  const weightOptions = ['Under 1 kg (₹35)', '1 - 3 kg (₹55)', '3 - 5 kg (₹85)', '5 - 10 kg (₹130)'];

  const pickupArea = resolveAreaKey(pickupAddress, localities);
  const dropArea = resolveAreaKey(dropAddress, localities);

  const eligibleLocalRiders = useMemo(() => {
    if (!routingConfig) {
      return deliveryPersons.filter(
        (d) =>
          d.status === 'approved' &&
          d.isOnline &&
          resolveAreaKey(d.currentLocation || d.locality, localities) === pickupArea
      );
    }
    return deliveryPersons.filter(
      (d) =>
        evaluateDeliveryRiderEligibility(
          pickupArea,
          d,
          routingConfig,
          partnerAccounts,
          localities
        ).isEligible
    );
  }, [deliveryPersons, routingConfig, partnerAccounts, localities, pickupArea]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName || !receiverPhone) {
      alert('Please enter receiver name and phone number');
      return;
    }
    setIsBooked(true);

    if (onRequestDelivery) {
      const price = packageWeight.includes('130') ? 130 : packageWeight.includes('85') ? 85 : packageWeight.includes('55') ? 55 : 35;
      onRequestDelivery({
        id: `TB-DEL-${Math.floor(100 + Math.random() * 900)}`,
        senderName,
        senderPhone,
        senderAddress: pickupAddress,
        pickupLocality: pickupArea,
        receiverName,
        receiverPhone,
        receiverAddress: dropAddress,
        dropLocality: dropArea,
        parcelDescription: packageType,
        weightCategory: packageWeight,
        estimatedPrice: price,
        status: 'pending_assignment',
        routingStatus: eligibleLocalRiders.length > 0 ? 'pending_admin_routing' : 'unavailable_in_locality',
        createdAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 sticky top-14 z-20 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHome}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Local Parcel Delivery
            </h2>
            <p className="text-xs text-emerald-700 font-medium">Same-day doorstep courier in Kalchini & Dooars</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isBooked ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm space-y-4 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
              eligibleLocalRiders.length > 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {eligibleLocalRiders.length > 0 ? (
                <Clock className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {eligibleLocalRiders.length > 0
                  ? 'Delivery Request Submitted — Pending Local Rider Assignment'
                  : 'Request Kept Pending — Admin Notified'}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {eligibleLocalRiders.length > 0 ? (
                  <>
                    Your parcel pickup from <span className="font-semibold text-gray-800">{pickupArea}</span> is queued for Admin-approved local delivery riders ({eligibleLocalRiders.length} active in {pickupArea}). You will see rider details once accepted.
                  </>
                ) : (
                  <>
                    No eligible delivery rider is currently online in <span className="font-semibold text-gray-800">{pickupArea}</span>. Per locality routing policy, your request is NOT sent to a distant town; Admin has been notified to assign a rider.
                  </>
                )}
              </p>
            </div>

            <div className="bg-emerald-50 rounded-xl p-3 text-left text-xs space-y-1.5 border border-emerald-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Receiver:</span>
                <span className="font-bold text-gray-900">{receiverName} ({receiverPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Destination:</span>
                <span className="font-bold text-gray-900">{dropAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Package:</span>
                <span className="font-bold text-gray-900">{packageType} ({packageWeight})</span>
              </div>
            </div>

            <button
              onClick={() => setIsBooked(false)}
              className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-transform"
            >
              Send Another Package
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sender Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pickup Details (Sender)</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 block mb-1">Your Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 block mb-1">Your Phone</label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Pickup Area</label>
                <select
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-semibold"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={`sender-loc-${loc}`} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Receiver Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-red-500" />
                <span>Drop Details (Receiver)</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 block mb-1">Receiver Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Roy"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 block mb-1">Receiver Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765-XXXXX"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Drop Area</label>
                <select
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-semibold"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={`receiver-loc-${loc}`} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Package Details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>Package Info</span>
              </h3>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Item Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {packageOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPackageType(item)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                        packageType === item
                          ? 'bg-[#0E7438] text-white border-[#0E7438]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Package Weight & Base Fare</label>
                <select
                  value={packageWeight}
                  onChange={(e) => setPackageWeight(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-semibold"
                >
                  {weightOptions.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold py-3 rounded-2xl shadow-md text-sm active:scale-95 transition-all"
            >
              Request Doorstep Pickup
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowLeft, Wrench, Calendar, Clock, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';
import { LOCAL_SERVICES } from '../data/mockData';

interface ServicesViewProps {
  onBackToHome: () => void;
  currentLocation: string;
  onRequestService?: (req: any) => void;
  customerName?: string;
  customerPhone?: string;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ 
  onBackToHome, 
  currentLocation,
  onRequestService,
  customerName = '',
  customerPhone = ''
}) => {
  const [selectedService, setSelectedService] = useState(LOCAL_SERVICES[0]);
  const [bookingDate, setBookingDate] = useState('Today (Within 2 Hours)');
  const [address, setAddress] = useState(currentLocation);
  const [phone, setPhone] = useState(customerPhone);
  const [serviceBooked, setServiceBooked] = useState(false);

  const timeSlots = [
    'Today (Within 2 Hours)',
    'Today Evening (4 PM - 7 PM)',
    'Tomorrow Morning (9 AM - 12 PM)',
    'Tomorrow Afternoon (12 PM - 3 PM)'
  ];

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setServiceBooked(true);

    if (onRequestService) {
      onRequestService({
        id: `TB-SRV-${Math.floor(500 + Math.random() * 500)}`,
        customerName: customerName || 'Customer',
        customerPhone: phone || customerPhone,
        category: selectedService.name,
        address,
        preferredDate: bookingDate.includes('Today') ? 'Today' : 'Tomorrow',
        preferredTime: bookingDate,
        issueDescription: `Service request for ${selectedService.name} (${selectedService.popularFor})`,
        estimatedFee: selectedService.startingPrice,
        status: 'requested',
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
              Local Home Services
            </h2>
            <p className="text-xs text-emerald-700 font-medium">Verified Electricians, Plumbers & Mechanics in Kalchini</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {serviceBooked ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm space-y-4 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Service Appointment Booked!</h3>
              <p className="text-xs text-gray-600 mt-1">
                A verified expert for <span className="font-bold text-gray-800">{selectedService.name}</span> will arrive at your address during your selected slot.
              </p>
            </div>

            <div className="bg-emerald-50 rounded-xl p-3 text-left text-xs space-y-1.5 border border-emerald-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Service:</span>
                <span className="font-bold text-gray-900">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Inspection Fee:</span>
                <span className="font-bold text-emerald-800">₹{selectedService.startingPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Slot:</span>
                <span className="font-bold text-gray-900">{bookingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Service Address:</span>
                <span className="font-bold text-gray-900">{address}</span>
              </div>
            </div>

            <button
              onClick={() => setServiceBooked(false)}
              className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-transform"
            >
              Book Another Service
            </button>
          </div>
        ) : (
          <>
            {/* Service Selection Cards */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Select Service Required
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {LOCAL_SERVICES.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setSelectedService(srv)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedService.id === srv.id
                        ? 'bg-emerald-50/80 border-[#0E7438] shadow-xs'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-2xl mb-1 block">{srv.icon}</span>
                    <h4 className="text-xs font-bold text-gray-900 leading-tight">{srv.name}</h4>
                    <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{srv.popularFor}</p>
                    <span className="inline-block mt-1 text-[11px] font-extrabold text-[#0E7438]">
                      Starts ₹{srv.startingPrice}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Service Details & Schedule Form */}
            <form onSubmit={handleBooking} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="text-2xl">{selectedService.icon}</span>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{selectedService.name}</h4>
                  <p className="text-xs text-gray-500">{selectedService.popularFor}</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Preferred Time Slot
                </label>
                <select
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Service Address in Kalchini / Dooars
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-2.5 text-[11px] text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>30-Day Service Warranty • Background Verified Local Technicians</span>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0E7438] hover:bg-emerald-800 text-white font-bold py-3 rounded-2xl shadow-md text-sm active:scale-95 transition-all"
              >
                Book Inspection • ₹{selectedService.startingPrice}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

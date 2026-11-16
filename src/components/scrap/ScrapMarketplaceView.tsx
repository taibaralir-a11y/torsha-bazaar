import React, { useState } from 'react';
import { 
  Recycle, 
  ArrowLeft, 
  Plus, 
  MapPin, 
  Camera, 
  Phone, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Package, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { ScrapRequest, ScrapOffer, ScrapCategory, UserProfile, PublicScrapListing } from '../../types';
import { SCRAP_PRICE_GUIDE } from '../../data/mockData';
import { SERVICE_LOCALITIES } from '../../utils/hyperlocalRouting';

interface ScrapActionResult {
  ok: boolean;
  backendRequired?: boolean;
  error?: string;
}

interface ScrapMarketplaceViewProps {
  onBackToHome: () => void;
  user: UserProfile;
  currentLocality: string;
  scrapRequests: ScrapRequest[];
  publicScrapListings?: PublicScrapListing[];
  isAdmin?: boolean;
  isAuthorizedBuyer?: boolean;
  activeBuyerId?: string;
  activeBuyerName?: string;
  onAddScrapRequest: (req: ScrapRequest) => Promise<ScrapActionResult | void> | void;
  onSendOffer: (offer: ScrapOffer) => Promise<ScrapActionResult | void> | void;
  onAcceptOffer: (
    requestId: string,
    offerId: string,
    buyerName: string,
    buyerPhone: string,
    amount: number,
    buyerId?: string
  ) => Promise<ScrapActionResult | void> | void;
  onUpdateScrapStatus: (requestId: string, status: ScrapRequest['status']) => Promise<ScrapActionResult | void> | void;
}

export const ScrapMarketplaceView: React.FC<ScrapMarketplaceViewProps> = ({
  onBackToHome,
  user,
  currentLocality,
  scrapRequests,
  publicScrapListings = [],
  isAdmin = false,
  isAuthorizedBuyer = false,
  activeBuyerId = '',
  activeBuyerName = '',
  onAddScrapRequest,
  onSendOffer,
  onAcceptOffer,
  onUpdateScrapStatus
}) => {
  const canOperateBuyerPortal = isAdmin || isAuthorizedBuyer;
  const [activeTab, setActiveTab] = useState<'sell' | 'my_requests' | 'rates' | 'buyer_portal'>(
    canOperateBuyerPortal && !isAdmin ? 'buyer_portal' : 'sell'
  );
  const [category, setCategory] = useState<ScrapCategory>('iron');
  const [categoryLabel, setCategoryLabel] = useState('Old Construction Iron & Grilles');
  const [estimatedWeight, setEstimatedWeight] = useState('15 - 25 kg');
  const [description, setDescription] = useState('');
  const [pickupAddress, setPickupAddress] = useState(user.address || '');
  const [locality, setLocality] = useState(currentLocality.split(' ')[0] || 'Hasimara');
  const [pincode, setPincode] = useState('735215');
  const [phone, setPhone] = useState(user.phone || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);
  const [scrapNotice, setScrapNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const myScrapRequests = scrapRequests.filter((r) => Boolean(user.id) && r.customerId === user.id);

  // Buyer Portal offer form states
  const [selectedRequestForOffer, setSelectedRequestForOffer] = useState<PublicScrapListing | ScrapRequest | null>(null);
  const [offerPricePerKg, setOfferPricePerKg] = useState<number>(30);
  const [offerTotalAmount, setOfferTotalAmount] = useState<number>(600);
  const [offerPickupTime, setOfferPickupTime] = useState('Today within 2 Hours');
  const [offerNotes, setOfferNotes] = useState('Digital scale weighing at your doorstep. Cash or UPI on pickup.');

  const openBuyerListings: (PublicScrapListing | ScrapRequest)[] = isAdmin
    ? scrapRequests.filter((r) => r.status === 'open' || r.status === 'offers_received')
    : publicScrapListings.filter((r) => r.status === 'open' || r.status === 'offers_received');

  const assignedBuyerPickups = scrapRequests.filter(
    (r) =>
      ['accepted', 'pickup_scheduled', 'picked_up', 'completed'].includes(r.status) &&
      (isAdmin || (Boolean(activeBuyerId) && r.selectedBuyerId === activeBuyerId))
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRequest) return;
    setScrapNotice(null);
    const newRequest: ScrapRequest = {
      id: `SCRAP-${Math.floor(100 + Math.random() * 900)}`,
      customerId: user.id || '',
      customerName: user.name || 'Customer',
      customerPhone: phone,
      category,
      categoryLabel: categoryLabel || `${category.toUpperCase()} Scrap`,
      estimatedWeight,
      description: description || `Household ${category} scrap ready for pickup.`,
      photos: photoPreview ? [photoPreview] : ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400'],
      pickupAddress,
      locality,
      pincode,
      status: 'open',
      offers: [],
      createdAt: new Date().toISOString()
    };

    setIsSubmittingRequest(true);
    try {
      const res = await onAddScrapRequest(newRequest);
      if (res && res.ok === false) {
        setScrapNotice({ type: 'err', text: res.error || 'Could not post scrap pickup request.' });
        return;
      }
      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setActiveTab('my_requests');
      }, 1500);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleBuyerSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForOffer || !canOperateBuyerPortal || isSubmittingOffer) return;
    setScrapNotice(null);
    const resolvedBuyerId = activeBuyerId || user.id || '';
    const resolvedBuyerName = activeBuyerName || user.name || 'Verified Kabari Partner';
    if (!resolvedBuyerId) {
      setScrapNotice({ type: 'err', text: 'Authenticated Kabari buyer session is required to submit quotes.' });
      return;
    }

    const offer: ScrapOffer = {
      id: `${selectedRequestForOffer.id}_${resolvedBuyerId}`,
      requestId: selectedRequestForOffer.id,
      scrapRequestId: selectedRequestForOffer.id,
      buyerId: resolvedBuyerId,
      buyerName: resolvedBuyerName,
      buyerPhone: user.phone || '',
      pricePerKg: Number(offerPricePerKg),
      totalOfferAmount: Number(offerTotalAmount),
      pickupTimeEstimate: offerPickupTime,
      notes: offerNotes,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setIsSubmittingOffer(true);
    try {
      const res = await onSendOffer(offer);
      if (res && res.ok === false) {
        setScrapNotice({ type: 'err', text: res.error || 'Could not submit purchase quote.' });
        return;
      }
      setSelectedRequestForOffer(null);
      setScrapNotice({ type: 'ok', text: `Quote submitted for ${selectedRequestForOffer.id}.` });
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-emerald-800 text-white p-4 sticky top-14 z-20 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wide text-yellow-300">SELL SCRAP ONLINE</span>
                <span className="text-[10px] bg-emerald-600 px-1.5 py-0.5 rounded font-black uppercase">KABARI</span>
              </div>
              <p className="text-xs text-emerald-100">Doorstep Weighing • Instant Cash / UPI • Dooars Recyclers</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`grid ${canOperateBuyerPortal ? 'grid-cols-4' : 'grid-cols-3'} gap-1 pt-2 border-t border-emerald-700/60 text-[11px] font-bold`}>
          <button
            onClick={() => setActiveTab('sell')}
            className={`py-1.5 rounded-lg text-center transition-all ${
              activeTab === 'sell' ? 'bg-yellow-400 text-gray-950 font-black shadow-xs' : 'text-emerald-100 hover:bg-emerald-700'
            }`}
          >
            Sell Scrap
          </button>
          <button
            onClick={() => setActiveTab('my_requests')}
            className={`py-1.5 rounded-lg text-center transition-all ${
              activeTab === 'my_requests' ? 'bg-yellow-400 text-gray-950 font-black shadow-xs' : 'text-emerald-100 hover:bg-emerald-700'
            }`}
          >
            My Requests ({myScrapRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`py-1.5 rounded-lg text-center transition-all ${
              activeTab === 'rates' ? 'bg-yellow-400 text-gray-950 font-black shadow-xs' : 'text-emerald-100 hover:bg-emerald-700'
            }`}
          >
            Mandi Rates
          </button>
          {canOperateBuyerPortal && (
            <button
              onClick={() => setActiveTab('buyer_portal')}
              className={`py-1.5 rounded-lg text-center transition-all ${
                activeTab === 'buyer_portal' ? 'bg-yellow-400 text-gray-950 font-black shadow-xs' : 'text-emerald-100 hover:bg-emerald-700'
              }`}
            >
              Buyer Portal
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {scrapNotice && (
          <div
            className={`rounded-2xl p-3 text-xs font-semibold flex items-start justify-between gap-2 border ${
              scrapNotice.type === 'err'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{scrapNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setScrapNotice(null)}
              className="font-bold opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}
        {/* TAB 1: SELL SCRAP FORM */}
        {activeTab === 'sell' && (
          <div className="space-y-4">
            {/* Value Proposition Banner */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Recycle className="w-5 h-5 text-yellow-300" />
                <h3 className="font-bold text-sm">Sell Recyclable Scrap from Your Home</h3>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                No need to carry heavy junk to distant shops. Certified local Kabari buyers in <strong>{locality}</strong> will arrive at your doorstep with certified electronic hanging scales.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] text-emerald-100">
                <div className="bg-emerald-900/60 p-1.5 rounded-lg text-center">✓ Doorstep Pickup</div>
                <div className="bg-emerald-900/60 p-1.5 rounded-lg text-center">✓ Compare Rates</div>
                <div className="bg-emerald-900/60 p-1.5 rounded-lg text-center">✓ Instant Cash/UPI</div>
              </div>
            </div>

            {successNotice && (
              <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Scrap pickup request posted! Local kabari buyers are preparing quotes for your review.</span>
              </div>
            )}

            {/* Request Form */}
            <form onSubmit={handleSubmitRequest} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3.5 text-xs">
              <h4 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">Scrap Item Information</h4>

              {/* Scrap Category Selection */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Scrap Material Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'iron', name: 'Iron & Steel (लोहा/स्टील)', rate: '₹28-₹32/kg' },
                    { id: 'copper', name: 'Copper & Motors (तांबा)', rate: '₹420-₹480/kg' },
                    { id: 'aluminium', name: 'Aluminium (एल्युमिनियम)', rate: '₹110-₹130/kg' },
                    { id: 'plastic', name: 'Plastic Bottles (प्लास्टिक)', rate: '₹14-₹18/kg' },
                    { id: 'cardboard', name: 'Cartons & Paper (रद्दी/गत्ता)', rate: '₹10-₹14/kg' },
                    { id: 'e_waste', name: 'Electronic E-Waste', rate: 'Custom Quote' },
                  ].map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id as ScrapCategory);
                        setCategoryLabel(cat.name);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        category === cat.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500 font-bold'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-bold text-xs">{cat.name}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">{cat.rate}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated Weight */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Estimated Approximate Weight</label>
                <select
                  value={estimatedWeight}
                  onChange={(e) => setEstimatedWeight(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white font-medium"
                >
                  <option value="5 - 10 kg">5 - 10 kg (Small Bundle / Carton)</option>
                  <option value="15 - 25 kg">15 - 25 kg (Medium Sack / Heavy Scrap)</option>
                  <option value="25 - 50 kg">25 - 50 kg (Large Batch / Construction Rods)</option>
                  <option value="50 - 100 kg">50 - 100 kg (Commercial / Bulk Scrap)</option>
                  <option value="100+ kg Bulk">100+ kg Bulk Load</option>
                </select>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Upload Photo of Scrap (Recommended)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold cursor-pointer hover:bg-emerald-100 transition-colors">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>Take or Choose Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  {photoPreview && (
                    <img src={photoPreview} alt="Scrap preview" className="w-12 h-12 object-cover rounded-xl border border-emerald-300" />
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Description / Scrap Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Old window grilles, unserviceable water motor, cardboard packaging"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              {/* Pickup Address & Locality */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Locality</label>
                  <select
                    value={locality}
                    onChange={(e) => {
                      setLocality(e.target.value);
                      const loc = SERVICE_LOCALITIES.find((l: any) => l.name === e.target.value);
                      if (loc) setPincode(loc.pincode);
                    }}
                    className="w-full px-3 py-2 border rounded-xl bg-white font-medium"
                  >
                    <option value="Hasimara">Hasimara</option>
                    <option value="Kalchini">Kalchini</option>
                    <option value="Jaigaon">Jaigaon</option>
                    <option value="Satali">Satali</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Pickup Doorstep Address</label>
                <input
                  type="text"
                  required
                  placeholder="House number, landmark, road name"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Contact Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md mt-2"
              >
                <Plus className="w-4 h-4" />
                {isSubmittingRequest ? 'Submitting Request...' : 'Submit Scrap Request for Buyer Offers'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: MY SCRAP REQUESTS & OFFERS */}
        {activeTab === 'my_requests' && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 text-sm">Your Scrap Pickup Requests</h3>

            {myScrapRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                  <Recycle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm">No Active Scrap Requests</h4>
                <p className="text-xs text-gray-500">Post your recyclable scrap to receive quotes from buyers.</p>
                <button
                  onClick={() => setActiveTab('sell')}
                  className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Sell Scrap Now
                </button>
              </div>
            ) : (
              myScrapRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {req.id}
                    </span>
                    <div className="flex items-center gap-2">
                      {req.status === 'open' && (
                        <button
                          type="button"
                          disabled={busyRequestId === req.id}
                          onClick={async () => {
                            setScrapNotice(null);
                            setBusyRequestId(req.id);
                            try {
                              const res = await onUpdateScrapStatus(req.id, 'cancelled');
                              if (res && res.ok === false) {
                                setScrapNotice({ type: 'err', text: res.error || 'Could not cancel request.' });
                              }
                            } finally {
                              setBusyRequestId(null);
                            }
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                        >
                          Cancel Request
                        </button>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        req.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'accepted'
                          ? 'bg-blue-100 text-blue-800'
                          : req.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {req.photos && req.photos[0] && (
                      <img src={req.photos[0]} alt="Scrap" className="w-16 h-16 object-cover rounded-xl border border-gray-200 shrink-0" />
                    )}
                    <div className="text-xs space-y-1">
                      <h4 className="font-bold text-gray-900">{req.categoryLabel}</h4>
                      <p className="text-gray-500">Weight: <strong>{req.estimatedWeight}</strong></p>
                      <p className="text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500" />
                        {req.pickupAddress}, {req.locality} ({req.pincode})
                      </p>
                    </div>
                  </div>

                  {/* Buyer Offers Section */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-800">Buyer Quotes Received:</span>
                      <span className="text-xs font-bold text-emerald-700">
                        {req.offers ? req.offers.length : 0} Offer(s)
                      </span>
                    </div>

                    {(!req.offers || req.offers.length === 0) ? (
                      <p className="text-[11px] text-gray-500 bg-slate-50 p-2 rounded-lg">
                        Request saved securely. Verified Kabari buyer matching & live quotes will appear once buyers submit quotes.
                      </p>
                    ) : (
                      req.offers.map((offer) => (
                        <div
                          key={offer.id}
                          className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                            req.selectedOfferId === offer.id
                              ? 'bg-emerald-50 border-emerald-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <strong className="text-gray-900">{offer.buyerName}</strong>
                              {offer.buyerPhone && (
                                <p className="text-[10px] text-gray-500 font-mono">{offer.buyerPhone}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black text-emerald-700">₹{offer.totalOfferAmount}</span>
                              {offer.pricePerKg && (
                                <span className="text-[10px] text-gray-500 block">(@ ₹{offer.pricePerKg}/kg)</span>
                              )}
                            </div>
                          </div>

                          {offer.notes && (
                            <p className="text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-gray-100">
                              "{offer.notes}"
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-gray-500">ETA: {offer.pickupTimeEstimate}</span>
                            {req.selectedOfferId === offer.id ? (
                              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Accepted Buyer
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={!isAdmin || busyRequestId === req.id}
                                onClick={async () => {
                                  if (!isAdmin) return;
                                  setScrapNotice(null);
                                  setBusyRequestId(req.id);
                                  try {
                                    const res = await onAcceptOffer(
                                      req.id,
                                      offer.id,
                                      offer.buyerName,
                                      offer.buyerPhone,
                                      offer.totalOfferAmount,
                                      offer.buyerId
                                    );
                                    if (res && res.ok === false) {
                                      setScrapNotice({ type: 'err', text: res.error || 'Could not accept offer.' });
                                    }
                                  } finally {
                                    setBusyRequestId(null);
                                  }
                                }}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-600 text-white font-bold rounded-lg text-[11px]"
                              >
                                {isAdmin ? `Accept Quote (₹${offer.totalOfferAmount})` : 'Accept Quote (BACKEND REQUIRED)'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: CURRENT MARKET RATES */}
        {activeTab === 'rates' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Current Dooars Mandi Scrap Rates</h3>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Updated Daily</span>
            </div>
            <p className="text-xs text-gray-500">
              Fair benchmark rates offered by verified kabari buyers across Hasimara, Kalchini, Jaigaon and Satali.
            </p>

            <div className="divide-y divide-gray-100 text-xs">
              {SCRAP_PRICE_GUIDE.map((item) => (
                <div key={item.category} className="py-2.5 flex items-center justify-between">
                  <div>
                    <strong className="text-gray-900 block">{item.name}</strong>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Category: {item.category}</span>
                  </div>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {item.avgRate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: KABARI BUYER PORTAL */}
        {activeTab === 'buyer_portal' && canOperateBuyerPortal && (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <strong className="block">Authorized Kabari Buyer Dispatch Terminal</strong>
              <p>
                Customer doorstep addresses and phone numbers stay strictly protected until your quote is accepted. Submit purchase quotes on PII-free local summaries below.
              </p>
            </div>

            {assignedBuyerPickups.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="font-bold text-sm text-gray-800">Assigned Scrap Pickups ({assignedBuyerPickups.length})</h4>
                {assignedBuyerPickups.map((req) => (
                  <div key={req.id} className="bg-white rounded-2xl border-2 border-emerald-200 p-4 shadow-sm space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">{req.id}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900">{req.categoryLabel} ({req.estimatedWeight})</h5>
                      <p className="text-gray-700">Customer: <strong>{req.customerName}</strong> · <span className="font-mono">{req.customerPhone}</span></p>
                      <p className="text-gray-600">{req.pickupAddress}, {req.locality} ({req.pincode})</p>
                    </div>
                    {req.status !== 'completed' && (
                      <div className="flex gap-2 pt-1">
                        {req.status === 'accepted' && (
                          <button
                            type="button"
                            disabled={busyRequestId === req.id}
                            onClick={async () => {
                              setBusyRequestId(req.id);
                              try {
                                const res = await onUpdateScrapStatus(req.id, 'pickup_scheduled');
                                if (res && res.ok === false) setScrapNotice({ type: 'err', text: res.error || 'Update failed.' });
                              } finally {
                                setBusyRequestId(null);
                              }
                            }}
                            className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl"
                          >
                            Schedule Pickup
                          </button>
                        )}
                        {(req.status === 'accepted' || req.status === 'pickup_scheduled') && (
                          <button
                            type="button"
                            disabled={busyRequestId === req.id}
                            onClick={async () => {
                              setBusyRequestId(req.id);
                              try {
                                const res = await onUpdateScrapStatus(req.id, 'picked_up');
                                if (res && res.ok === false) setScrapNotice({ type: 'err', text: res.error || 'Update failed.' });
                              } finally {
                                setBusyRequestId(null);
                              }
                            }}
                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl"
                          >
                            Mark Picked Up
                          </button>
                        )}
                        {(req.status === 'pickup_scheduled' || req.status === 'picked_up') && (
                          <button
                            type="button"
                            disabled={busyRequestId === req.id}
                            onClick={async () => {
                              setBusyRequestId(req.id);
                              try {
                                const res = await onUpdateScrapStatus(req.id, 'completed');
                                if (res && res.ok === false) setScrapNotice({ type: 'err', text: res.error || 'Update failed.' });
                              } finally {
                                setBusyRequestId(null);
                              }
                            }}
                            className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <h4 className="font-bold text-sm text-gray-800">Open Customer Scrap Summaries</h4>

            {openBuyerListings.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No open customer requests in this area currently.</p>
            ) : (
              openBuyerListings.map((req) => {
                const existingMyOffer = 'myOffer' in req ? req.myOffer : undefined;
                return (
                  <div key={req.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{req.id}</span>
                      <span className="font-bold text-emerald-700">{req.locality} ({req.pincode})</span>
                    </div>

                    <div className="flex gap-3">
                      {req.photos && req.photos[0] && (
                        <img src={req.photos[0]} alt="Scrap" className="w-16 h-16 object-cover rounded-xl border" />
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900">{req.categoryLabel}</h4>
                        <p className="text-gray-600">Approx: <strong>{req.estimatedWeight}</strong></p>
                        {req.description && <p className="text-gray-600 mt-0.5">{req.description}</p>}
                        <p className="text-gray-500 mt-0.5">Doorstep address & phone hidden until offer acceptance.</p>
                      </div>
                    </div>

                    {existingMyOffer && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-900 flex items-center justify-between">
                        <span>Your Quote Sent: <strong>₹{existingMyOffer.totalOfferAmount}</strong> ({existingMyOffer.pickupTimeEstimate})</span>
                        <span className="uppercase font-bold text-emerald-700">{existingMyOffer.status}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (existingMyOffer) {
                          setOfferPricePerKg(existingMyOffer.pricePerKg || 30);
                          setOfferTotalAmount(existingMyOffer.totalOfferAmount);
                          setOfferPickupTime(existingMyOffer.pickupTimeEstimate);
                          setOfferNotes(existingMyOffer.notes || '');
                        }
                        setSelectedRequestForOffer(req);
                      }}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <DollarSign className="w-4 h-4" />
                      {existingMyOffer ? 'Update Your Purchase Quote' : 'Send Purchase Quote to Customer'}
                    </button>
                  </div>
                );
              })
            )}

            {/* Offer Submission Modal */}
            {selectedRequestForOffer && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
                  <h3 className="font-bold text-sm text-gray-900">
                    Send Quote for {selectedRequestForOffer.categoryLabel}
                  </h3>
                  <form onSubmit={handleBuyerSubmitOffer} className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Your Offered Rate (₹/kg)</label>
                      <input
                        type="number"
                        required
                        value={offerPricePerKg}
                        onChange={(e) => {
                          const rate = Number(e.target.value);
                          setOfferPricePerKg(rate);
                          setOfferTotalAmount(rate * (selectedRequestForOffer.approxWeightKg || 20));
                        }}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Total Estimated Offer (₹)</label>
                      <input
                        type="number"
                        required
                        value={offerTotalAmount}
                        onChange={(e) => setOfferTotalAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Pickup Time</label>
                      <input
                        type="text"
                        required
                        value={offerPickupTime}
                        onChange={(e) => setOfferPickupTime(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Notes for Customer</label>
                      <textarea
                        rows={2}
                        value={offerNotes}
                        onChange={(e) => setOfferNotes(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={isSubmittingOffer}
                        onClick={() => setSelectedRequestForOffer(null)}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingOffer}
                        className="flex-1 py-2 bg-emerald-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
                      >
                        {isSubmittingOffer ? 'Sending...' : 'Send Offer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

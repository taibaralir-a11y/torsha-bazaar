import React from 'react';
import { X, ShieldCheck, FileText, Info, HelpCircle, Phone, Mail, MapPin, Clock, AlertTriangle } from 'lucide-react';

export type CustomerPolicyType = 'about' | 'privacy' | 'terms' | 'help';

interface CustomerPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: CustomerPolicyType;
}

export const CustomerPolicyModal: React.FC<CustomerPolicyModalProps> = ({
  isOpen,
  onClose,
  type
}) => {
  if (!isOpen) return null;

  const contentMap = {
    about: {
      title: 'About Torsa Bazaar',
      subtitle: 'Apne Sheher Ka Apna Hyperlocal Super App',
      icon: Info,
      color: 'text-emerald-700 bg-emerald-50',
      body: (
        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
          <p>
            <strong>TORSHA BAZAAR</strong> is a dedicated hyperlocal marketplace built specifically for the residents, tea garden communities, and local businesses of the Dooars region — covering <strong>Satali, Hasimara, Malangi, Kalchini, Hamiltonganj, Birpara, Jaigaon, and Alipurduar</strong>.
          </p>
          <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100 space-y-1.5">
            <h4 className="font-bold text-emerald-950 text-xs">Our Hyperlocal Mission</h4>
            <p className="text-[11px] text-emerald-800">
              Deliver everyday essentials from your neighborhood stores within 15–30 minutes, provide fast Toto and Taxi rides without surge pricing, ensure 24x7 emergency medical access, and support local merchants with ₹0 initial setup barriers.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Key Service Pillars</h4>
            <ul className="list-disc pl-4 space-y-1 text-gray-600">
              <li><strong>Local Kirana & Daily Grocery:</strong> Fresh flour, rice, pulses, and pantry essentials sourced directly from trusted neighborhood grocers.</li>
              <li><strong>Brand-New Mobiles & Tech:</strong> 100% genuine sealed smartphones with manufacturer warranty (zero refurbished units).</li>
              <li><strong>Medical Shop & Prescription Delivery:</strong> Verified pharmacy supplies delivered quickly with easy prescription upload.</li>
              <li><strong>Emergency Doctor & Healthcare:</strong> 24x7 doctor home visits, MBBS tele-consultations, and verified local hospital directory.</li>
              <li><strong>Toto, Auto & Taxi Booking:</strong> Clean point-to-point local transit with transparent fare bidding (strictly zero bike taxis).</li>
              <li><strong>Fair Scrap / Kabari Marketplace:</strong> Sell old newspapers, metals, and electronics at honest ₹/kg rates.</li>
            </ul>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Operating Region: Alipurduar District, WB</span>
            <span>Version: 2.5.0</span>
          </div>
        </div>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'Your Data Privacy & Security Guarantee',
      icon: ShieldCheck,
      color: 'text-blue-700 bg-blue-50',
      body: (
        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
          <p>
            At TORSHA BAZAAR, we respect and safeguard your privacy. We strictly guarantee that <strong>your personal information is never sold, leased, or distributed</strong> to any third-party marketing brokers or advertisers.
          </p>
          <div className="space-y-2.5">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <h4 className="font-bold text-gray-900 text-[11px]">1. Information We Collect</h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                We only collect information necessary to fulfill your orders and bookings: your name, phone number, delivery address, selected locality (e.g. Satali / Hasimara), and optional GPS coordinates.
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <h4 className="font-bold text-gray-900 text-[11px]">2. Local Delivery Routing</h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Your location data is used strictly to calculate exact delivery distances and assign nearby delivery partners and riders within your postal hub (735214, 735215, 735217, 735182).
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <h4 className="font-bold text-gray-900 text-[11px]">3. Medical Prescription Privacy</h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Doctor consultation notes and uploaded prescription images are shared only with the dispensing pharmacist or attending verified physician for order fulfillment.
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <h4 className="font-bold text-gray-900 text-[11px]">4. Firestore Encryption & Rules</h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                All records are protected behind Firebase Firestore security rules ensuring private customer profiles cannot be read or altered by unauthenticated external parties.
              </p>
            </div>
          </div>
        </div>
      )
    },
    terms: {
      title: 'Terms & Conditions',
      subtitle: 'Customer Service Agreement & Fair Usage',
      icon: FileText,
      color: 'text-amber-700 bg-amber-50',
      body: (
        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
          <p>
            By accessing and placing orders or ride bookings through TORSHA BAZAAR, you agree to the following transparent terms:
          </p>
          <div className="space-y-2.5">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <h4 className="font-bold text-gray-900 text-[11px]">1. Order Fulfillment & Fair Pricing</h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Product prices, fresh meat weights, and medicine availability are set by approved neighborhood merchants. If any item is out of stock, customers are promptly notified before dispatch.
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <h4 className="font-bold text-gray-900 text-[11px]">2. Toto, Auto & Taxi Transit</h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Fares are agreed mutually via rider-customer bidding before ride commencement. TORSHA BAZAAR strictly permits Toto, Auto, and Taxi cars — two-wheeler bike taxis are completely prohibited.
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
              <h4 className="font-bold text-amber-950 text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>3. Emergency Healthcare Disclaimer</span>
              </h4>
              <p className="text-[11px] text-amber-900 mt-0.5 font-medium">
                TORSHA BAZAAR is not an ambulance service or emergency 112 substitute. In life-threatening emergencies, please dial 112 or head directly to the nearest Sub-Divisional Hospital (Birpara/Alipurduar).
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <h4 className="font-bold text-gray-900 text-[11px]">4. Cancellations & Grievance Resolution</h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Orders can be cancelled before merchant preparation. Customer complaints regarding overcharging or delays are reviewed by our Super Admin panel within 24 hours.
              </p>
            </div>
          </div>
        </div>
      )
    },
    help: {
      title: 'Help & Customer Support',
      subtitle: '24x7 Customer Assistance & Grievance Redressal',
      icon: HelpCircle,
      color: 'text-purple-700 bg-purple-50',
      body: (
        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
          <p>
            Need assistance with an active order, ride booking, or return? Our local support team is ready to assist you.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href="tel:+919434012891"
              className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3 hover:bg-emerald-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-950 text-xs">Direct Support Helpline</h4>
                <p className="font-mono font-bold text-emerald-800 text-[11px] mt-0.5">+91 94340 12891</p>
                <span className="text-[10px] text-emerald-700 font-medium">Daily 7:00 AM – 10:00 PM</span>
              </div>
            </a>

            <a
              href="mailto:taibaralir@gmail.com"
              className="p-3 bg-sky-50 rounded-2xl border border-sky-200 flex items-center gap-3 hover:bg-sky-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sky-950 text-xs">Customer Email Desk</h4>
                <p className="font-mono text-sky-800 text-[11px] mt-0.5 truncate">taibaralir@gmail.com</p>
                <span className="text-[10px] text-sky-700 font-medium">Response within 2 hours</span>
              </div>
            </a>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-2">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-xs">
              <Clock className="w-4 h-4 text-[#0E7438]" />
              <span>Operating Hours & Local Hubs</span>
            </div>
            <p className="text-[11px] text-gray-600">
              Deliveries run 7 days a week across <strong>Satali, Hasimara, Malangi, Kalchini, Birpara, Jaigaon & Hamiltonganj</strong>.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>Central Logistics Hub: Satali / Hasimara, Alipurduar, PIN: 735214</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900">
              <strong>Formal Grievance Filing:</strong> You can also file a formal complaint under <strong>Account → Complaints</strong> tab for instant review by the Super Admin.
            </div>
          </div>
        </div>
      )
    }
  };

  const current = contentMap[type];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
        <div className="flex items-start justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${current.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                {current.title}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {current.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto pr-1">
          {current.body}
        </div>

        <div className="pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

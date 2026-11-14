import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode as QrIcon, Share2, Copy, Check, Download, ExternalLink } from 'lucide-react';

interface UniversalQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UniversalQrModal: React.FC<UniversalQrModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // The permanent public URL that always points strictly to the customer homepage
  const publicCustomerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}`
    : 'https://ais-pre-sic5bbgmag3yaaojmrpveo-796642526796.asia-northeast1.run.app';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(publicCustomerUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0E7438',
          light: '#FFFFFF'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [isOpen, publicCustomerUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicCustomerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'torsa-bazaar-official-qr.png';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <QrIcon className="w-5 h-5 text-[#0E7438]" />
            <h3 className="text-base font-bold text-gray-900">Universal Torsa QR</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
            Apne Sheher Ka Apna Bazaar
          </span>
          <h4 className="text-sm font-bold text-gray-900">Scan to Open Customer Super App</h4>
          <p className="text-xs text-gray-500">
            Scan with any phone camera or Google Lens to shop groceries, book Toto/Taxi, or find local services.
          </p>
        </div>

        {/* QR Canvas / Image */}
        <div className="p-3 bg-gradient-to-b from-emerald-50 to-white rounded-2xl border border-emerald-200 flex justify-center shadow-inner">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Torsa Bazaar Universal Customer QR Code"
              className="w-56 h-56 rounded-xl shadow-xs"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs text-gray-400">
              Generating QR Code...
            </div>
          )}
        </div>

        {/* Security Notice: Never opens Admin */}
        <p className="text-[10px] text-gray-400 text-center bg-gray-50 p-2 rounded-xl">
          🔒 Security Guard: This QR code routes exclusively to the public customer storefront and never opens admin or internal portals.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#0E7438] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Save QR Image</span>
          </button>
        </div>
      </div>
    </div>
  );
};

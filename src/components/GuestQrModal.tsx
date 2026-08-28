import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Download, Copy, Check, Send, Sparkles } from 'lucide-react';
import { GuestEntry } from '../types';

interface GuestQrModalProps {
  guest: GuestEntry | null;
  coupleNames: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GuestQrModal: React.FC<GuestQrModalProps> = ({ guest, coupleNames, isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !guest) return null;

  const origin = window.location.origin;
  const path = window.location.pathname;
  const inviteUrl = `${origin}${path}?code=${encodeURIComponent(guest.code)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrContainerRef.current) return;
    const svgElement = qrContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 300, 300);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `Pase-Boda-${guest.primaryName.replace(/\s+/g, '_')}-${guest.code}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const cleanPhone = guest.phone ? guest.phone.replace(/[^0-9]/g, '') : '';
  const waText = `¡Hola ${guest.primaryName}! 🥂✨\n\n${coupleNames} te invitan a celebrar su boda.\n\nAccede directamente a tu pase y confirmación (RSVP) escaneando tu código QR o ingresando aquí:\n👉 ${inviteUrl}\n\nCódigo personal: ${guest.code}`;
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`
    : `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B3F35]/50 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#F7F3EC] border border-[#E5CFA3] rounded-[36px] shadow-2xl text-[#2A2A2A] overflow-hidden flex flex-col p-6 sm:p-8 text-center space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5CFA3] pb-4">
          <div className="flex items-center space-x-2 text-[#0F4C3A]">
            <QrCode className="w-5 h-5 text-[#B98A2E]" />
            <span className="font-serif italic font-medium text-lg">Pase Digital QR</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white text-[#2A2A2A]/60 hover:text-[#0F4C3A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Pass Card Container */}
        <div className="p-6 rounded-[28px] bg-white border border-[#E5CFA3] shadow-lg flex flex-col items-center space-y-4 relative">
          <div className="flex items-center space-x-1.5 text-[10px] uppercase tracking-[0.25em] text-[#B98A2E] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#0F4C3A]" />
            <span>Pase Personalizado</span>
          </div>

          <div>
            <h3 className="font-serif text-xl sm:text-2xl text-[#0F4C3A] font-medium italic">
              {guest.primaryName}
            </h3>
            <p className="text-xs text-[#2A2A2A]/70 font-sans mt-0.5">
              Cupo asignado: <span className="font-semibold text-[#0F4C3A]">{guest.partySizeAllowed} persona(s)</span>
            </p>
          </div>

          {/* QR Code Frame */}
          <div
            ref={qrContainerRef}
            className="p-4 bg-white rounded-2xl border-2 border-[#E5CFA3] shadow-inner flex items-center justify-center my-2"
          >
            <QRCodeSVG
              value={inviteUrl}
              size={180}
              fgColor="#0F4C3A"
              bgColor="#FFFFFF"
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center font-mono text-xs text-[#0F4C3A] bg-[#F7F3EC] px-4 py-1.5 rounded-full border border-[#E5CFA3] font-bold tracking-widest">
            {guest.code}
          </div>

          <p className="text-[11px] text-[#2A2A2A]/60 font-sans max-w-xs">
            Escanea este código con cualquier teléfono móvil para abrir tu pase directo de confirmación (RSVP).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 font-sans">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleDownloadQr}
              className="py-3 px-4 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-[#F7F3EC] text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md border border-[#B98A2E]/40"
            >
              <Download className="w-4 h-4 text-[#D9B872]" />
              <span>Descargar</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="py-3 px-4 rounded-full bg-white hover:bg-[#F7F3EC] text-[#0F4C3A] border border-[#E5CFA3] text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#B98A2E]" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
          >
            <Send className="w-4 h-4 fill-current" />
            <span>Enviar Invitación por WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

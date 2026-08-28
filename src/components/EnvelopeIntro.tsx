import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Check, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WeddingDetails } from '../types';

interface EnvelopeIntroProps {
  wedding: WeddingDetails;
  onClose: () => void;
  onOpenRsvp: () => void;
}

export const EnvelopeIntro: React.FC<EnvelopeIntroProps> = ({
  wedding,
  onClose,
  onOpenRsvp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cardExited, setCardExited] = useState(false);

  const formattedDate = new Date(wedding.weddingDate).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const coupleNamesParts = wedding.coupleNames.includes('&')
    ? wedding.coupleNames.split('&')
    : wedding.coupleNames.includes('y')
    ? wedding.coupleNames.split('y')
    : [wedding.coupleNames, ''];

  const initials = coupleNamesParts[0].trim().charAt(0) + ' & ' + (coupleNamesParts[1]?.trim().charAt(0) || '');

  const handleOpenEnvelope = () => {
    if (isOpen) return;

    setIsOpen(true);

    // Burst golden glitter confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#FFD700', '#0F4C3A', '#FAFAF7', '#C5A059'],
    });

    setTimeout(() => {
      setCardExited(true);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#031d14] overflow-y-auto select-none">
      {/* Background Emerald Velvet & Floating Golden Particles */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#09402c] via-[#04281c] to-[#01140e] pointer-events-none" />
      
      {/* Golden bokeh ambient circles */}
      <div className="absolute w-[500px] h-[500px] bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      
      <div className="relative z-10 w-full max-w-xl my-auto flex flex-col items-center">
        
        {/* Helper Instructions / Tagline */}
        {!isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 space-y-2"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#0F4C3A]/80 border border-[#D4AF37]/50 text-[#E5CFA3] text-xs uppercase tracking-[0.25em] font-semibold backdrop-blur-md shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" style={{ animationDuration: '4s' }} />
              <span>Invitación Formal de Boda</span>
            </div>
            <p className="text-white/80 text-xs font-light font-sans tracking-wide">
              Haz clic en el sello de cera para abrir tu sobre
            </p>
          </motion.div>
        ) : null}

        {/* Envelope Container */}
        <div className="relative w-full max-w-[480px] min-h-[580px] flex items-center justify-center">
          
          <AnimatePresence mode="wait">
            {!cardExited ? (
              /* Envelope Graphic in Luxury Marfil (Ivory) */
              <motion.div
                key="envelope"
                className="relative w-full aspect-[4/3] bg-[#F7F3EB] rounded-2xl border-2 border-[#D4AF37] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-visible cursor-pointer group"
                onClick={handleOpenEnvelope}
                whileHover={!isOpen ? { scale: 1.02 } : {}}
                transition={{ duration: 0.3 }}
              >
                {/* Emerald & Gold Silk Lining Inside Flap */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a4833] via-[#042d1f] to-[#011a12]">
                  {/* Subtle Gold Foil Damask/Texture */}
                  <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="absolute top-3 inset-x-0 text-center text-[#D4AF37]/40 text-[10px] uppercase tracking-[0.4em] font-serif">
                    ✦ ÁNGEL & KRISTER ✦
                  </div>
                </div>

                {/* Envelope Pocket / Interior Pocket */}
                <div className="absolute inset-x-2 bottom-2 top-10 bg-[#E8DEC7] rounded-b-xl border-t border-[#D4AF37]/40 shadow-inner" />

                {/* The Peek of the Invitation Card Inside Envelope */}
                <motion.div
                  className="absolute inset-x-5 top-8 bottom-4 bg-[#FAF9F5] rounded-xl border border-[#D4AF37] shadow-md p-6 flex flex-col items-center justify-center text-center space-y-2 overflow-hidden"
                  animate={
                    isOpen
                      ? { y: -220, scale: 1.05, zIndex: 40 }
                      : { y: 0, scale: 1 }
                  }
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#B98A2E] font-serif">
                    JUNTO CON SUS FAMILIAS
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-[#0F4C3A] italic">
                    {wedding.coupleNames}
                  </h2>
                  <span className="text-xs font-serif text-[#B98A2E] font-medium">Tienen el honor de invitarle</span>
                </motion.div>

                {/* Left & Right & Bottom Fold Flaps (Ivory Paper with Fine Gold Lines) */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Bottom triangle (Ivory front flap) */}
                  <div 
                    className="absolute bottom-0 inset-x-0 h-1/2 bg-[#FBF9F4] border-t border-[#D4AF37]/50 shadow-[0_-4px_10px_rgba(0,0,0,0.06)]"
                    style={{ clipPath: 'polygon(0% 100%, 50% 25%, 100% 100%)' }}
                  />
                  {/* Left triangle (Ivory side fold) */}
                  <div 
                    className="absolute inset-y-0 left-0 w-1/2 bg-[#F4EDE0] border-r border-[#D4AF37]/40 shadow-xs"
                    style={{ clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%)' }}
                  />
                  {/* Right triangle (Ivory side fold) */}
                  <div 
                    className="absolute inset-y-0 right-0 w-1/2 bg-[#EFE6D5] border-l border-[#D4AF37]/40 shadow-xs"
                    style={{ clipPath: 'polygon(100% 0%, 0% 50%, 100% 100%)' }}
                  />
                </div>

                {/* Top Flap (Animating Open - Ivory Exterior with Gold Rim) */}
                <motion.div
                  className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-[#FDFBF7] to-[#EFE6D5] border-b-2 border-[#D4AF37] origin-top z-20 shadow-xl"
                  style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}
                  animate={isOpen ? { rotateX: 180, zIndex: 5 } : { rotateX: 0 }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                />

                {/* Wax Seal Button (Center) */}
                {!isOpen && (
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Golden Wax Seal */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#8C6219] p-1 shadow-[0_12px_28px_rgba(212,175,55,0.5)] border-2 border-[#FFE89C] flex items-center justify-center group-hover:shadow-[0_0_35px_rgba(212,175,55,0.9)] transition-all">
                      <div className="w-full h-full rounded-full border border-[#8C6219]/60 flex flex-col items-center justify-center text-[#3D2802] font-serif bg-gradient-to-tl from-[#D4AF37] to-[#FFE89C] shadow-inner">
                        <Heart className="w-4 h-4 fill-[#3D2802] text-[#3D2802] mb-0.5" />
                        <span className="text-[11px] sm:text-xs font-bold tracking-widest">{initials}</span>
                      </div>
                    </div>
                    <span className="mt-3 text-[10px] uppercase tracking-[0.25em] text-[#FAFAF7] font-bold bg-[#0F4C3A] hover:bg-[#0B3F35] px-4 py-1.5 rounded-full border border-[#D4AF37] shadow-lg animate-pulse">
                      Abrir Invitación
                    </span>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* Full Unfolded Invitation Card (Luxury Marfil Edition) */
              <motion.div
                key="card-full"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[480px] rounded-[36px] border-2 border-[#D4AF37] shadow-[0_30px_80px_rgba(0,0,0,0.85)] overflow-hidden my-auto bg-[#FAF9F5] text-[#2A2A2A]"
              >
                {/* Top Emerald & Gold Arch Banner Header */}
                <div className="relative h-32 bg-gradient-to-br from-[#084530] via-[#042d1f] to-[#021811] overflow-hidden border-b-2 border-[#D4AF37]">
                  {/* Botanical Leaf Watermark / Shimmer Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent pointer-events-none animate-pulse" />
                  
                  {/* Organic Gold Wave Divider */}
                  <svg
                    className="absolute bottom-0 inset-x-0 w-full h-8 fill-current text-[#FAF9F5]"
                    viewBox="0 0 500 50"
                    preserveAspectRatio="none"
                  >
                    <path d="M0,0 C150,40 350,-20 500,20 L500,50 L0,50 Z" />
                  </svg>

                  <div className="absolute top-5 inset-x-0 text-center space-y-1">
                    <div className="text-[#D4AF37] text-xs tracking-[0.4em] font-serif">🌿 ❦ INVITACIÓN DE BODA ❦ 🌿</div>
                    <div className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#E5CFA3]/80">
                      ÁNGEL & KRISTER
                    </div>
                  </div>
                </div>

                {/* Card Inner Content Container with Emerald Frame */}
                <div className="px-8 py-7 text-center space-y-5 relative">
                  {/* Decorative Inner Emerald Frame */}
                  <div className="absolute inset-4 rounded-[28px] border border-[#0F4C3A]/25 pointer-events-none" />

                  {/* Subtitle / Header Phrase */}
                  <div className="text-[10px] uppercase tracking-[0.35em] font-bold font-serif text-[#B98A2E]">
                    JUNTO CON SUS FAMILIAS
                  </div>

                  {/* Couple Names Section with Botanical Crest */}
                  <div className="space-y-1 py-1 relative">
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight leading-tight uppercase text-[#0F4C3A]">
                      {coupleNamesParts[0]}
                    </h1>
                    <div className="font-script text-3xl text-[#D4AF37] my-0.5 italic flex items-center justify-center space-x-3">
                      <span className="w-8 h-[1px] bg-[#D4AF37]/50 inline-block" />
                      <span>y</span>
                      <span className="w-8 h-[1px] bg-[#D4AF37]/50 inline-block" />
                    </div>
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight leading-tight uppercase text-[#0F4C3A]">
                      {coupleNamesParts[1] || wedding.coupleNames}
                    </h1>
                  </div>

                  {/* Invitation Formal Phrase */}
                  <div className="text-[11px] uppercase tracking-[0.25em] font-semibold font-serif max-w-xs mx-auto leading-relaxed border-y border-[#E5CFA3] py-2.5 text-[#B98A2E]">
                    TIENEN EL HONOR DE INVITARLE A SU CELEBRACIÓN NUPCIAL
                  </div>

                  {/* Event Date & Location Pill Badge */}
                  <div className="space-y-2 py-1">
                    <div className="inline-block px-5 py-2 rounded-full border border-[#0F4C3A]/40 bg-[#0F4C3A]/10 text-[#0F4C3A] text-xs sm:text-sm font-bold uppercase tracking-[0.2em] font-serif shadow-xs">
                      {formattedDate}
                    </div>
                    <div className="text-xs uppercase tracking-widest font-sans font-semibold text-[#B98A2E]">
                      {wedding.weddingLocation}
                    </div>
                    <div className="text-[11px] font-sans font-light max-w-xs mx-auto text-[#2A2A2A]/80">
                      {wedding.venueAddress}
                    </div>
                  </div>

                  {/* Reception Phrase */}
                  <div className="font-script text-2xl text-[#D4AF37] italic">
                    Recepción a continuación
                  </div>

                  {/* Action CTA Buttons */}
                  <div className="pt-2 space-y-2.5 relative z-10">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenRsvp();
                      }}
                      className="w-full py-3.5 px-6 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-[#FAFAF7] font-semibold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#0F4C3A]/30 transition-all cursor-pointer flex items-center justify-center space-x-2 border border-[#D4AF37] active:scale-[0.98]"
                    >
                      <Heart className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                      <span>Confirmar Asistencia (RSVP)</span>
                    </button>

                    <button
                      onClick={onClose}
                      className="w-full py-3 px-6 rounded-full border border-[#E5CFA3] bg-white/80 hover:bg-white text-[#0F4C3A] font-semibold text-xs uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.98]"
                    >
                      <span>Entrar al Sitio Web</span>
                      <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                    </button>
                  </div>
                </div>

                {/* Bottom Geode Emerald & Gold Foil Border */}
                <div className="relative h-14 bg-gradient-to-tr from-[#021811] via-[#084530] to-[#042d1f] border-t-2 border-[#D4AF37] flex items-center justify-center">
                  <span className="text-[10px] text-[#E5CFA3] uppercase tracking-[0.3em] font-serif">
                    ✦ {wedding.coupleNames} • 2026 ✦
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

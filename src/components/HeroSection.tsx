import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Heart, Clock, Sparkles, Mail } from 'lucide-react';
import { WeddingDetails } from '../types';

interface HeroSectionProps {
  wedding: WeddingDetails;
  onOpenRsvp: () => void;
  onOpenEnvelope?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ wedding, onOpenRsvp, onOpenEnvelope }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const targetDate = new Date(wedding.weddingDate).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [wedding.weddingDate]);

  const formattedDate = new Date(wedding.weddingDate).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="relative min-h-[92vh] flex items-center justify-center text-[#2A2A2A] overflow-hidden py-16">
      {/* Background Cover Image with Emerald Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 scale-105 transform transition-transform duration-1000 pointer-events-none"
        style={{ backgroundImage: `url('${wedding.coverImageUrl}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#F7F3EC]/40 via-transparent to-[#F7F3EC]" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
        
        {/* Arch Frame with Emerald Green Accents */}
        <div className="relative w-full max-w-md border-2 border-[#0F4C3A]/40 border-b-0 rounded-t-[180px] p-8 sm:p-12 mb-8 bg-white/60 backdrop-blur-md shadow-xl shadow-[#0F4C3A]/10">
          <div className="absolute inset-2 border border-[#0F4C3A]/30 border-b-0 rounded-t-[160px] pointer-events-none" />
          
          <div className="text-2xl text-[#0F4C3A] mb-2 font-serif flex items-center justify-center space-x-2">
            <span className="text-xs text-[#D4AF37]">🌿</span>
            <span>❦</span>
            <span className="text-xs text-[#D4AF37]">🌿</span>
          </div>
          
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#0F4C3A] border border-[#D4AF37]/60 text-[#FAFAF7] text-[10px] uppercase tracking-[0.3em] font-bold mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Nos Casamos</span>
          </div>

          {/* Couple Names */}
          <h1 className="font-serif text-5xl sm:text-7xl font-bold text-[#0F4C3A] leading-[1.1] tracking-tight my-3 italic drop-shadow-xs">
            {wedding.coupleNames.includes('&') ? (
              <>
                {wedding.coupleNames.split('&')[0]}
                <span className="font-script font-normal text-[#D4AF37] text-4xl sm:text-5xl mx-2">&</span>
                {wedding.coupleNames.split('&')[1]}
              </>
            ) : (
              wedding.coupleNames
            )}
          </h1>

          <p className="text-[#2A2A2A]/90 text-xs sm:text-sm font-light leading-relaxed font-sans tracking-wide mt-3 max-w-xs mx-auto">
            {wedding.heroSubtitle}
          </p>
        </div>

        {/* Event Key Meta Badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 text-xs text-[#2A2A2A]">
          <div className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-[#0F4C3A]/30 shadow-xs">
            <Calendar className="w-4 h-4 text-[#0F4C3A]" />
            <span className="font-medium text-[#0F4C3A] capitalize">{formattedDate}</span>
          </div>

          <a 
            href={wedding.venueMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#0F4C3A]/10 hover:bg-[#0F4C3A] backdrop-blur-md border border-[#0F4C3A]/40 text-[#0F4C3A] hover:text-[#FAFAF7] transition-all cursor-pointer group shadow-xs"
          >
            <MapPin className="w-4 h-4 text-[#0F4C3A] group-hover:text-[#D4AF37] group-hover:scale-110 transition-transform" />
            <span className="font-semibold">{wedding.weddingLocation} • Ver Mapa →</span>
          </a>
        </div>

        {/* Live Countdown Timer */}
        <div className="w-full max-w-xl bg-white/80 backdrop-blur-2xl border-2 border-[#0F4C3A]/20 rounded-[32px] p-6 sm:p-8 mb-10 shadow-xl shadow-[#0F4C3A]/10">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#0F4C3A] font-bold mb-5 flex items-center justify-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-[#B98A2E]" />
            <span>Cuenta Regresiva para la Celebración</span>
          </div>

          {timeLeft.isPast ? (
            <div className="py-2 text-2xl font-serif text-[#0F4C3A] italic">
              ¡El gran día ha llegado! 🎉
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-[#F7F3EC]/80 rounded-2xl p-3 border border-[#E5CFA3]">
                <span className="block text-2xl sm:text-4xl font-serif font-medium text-[#0F4C3A] italic">
                  {timeLeft.days}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#B98A2E] font-medium">
                  Días
                </span>
              </div>
              <div className="bg-[#F7F3EC]/80 rounded-2xl p-3 border border-[#E5CFA3]">
                <span className="block text-2xl sm:text-4xl font-serif font-medium text-[#0F4C3A] italic">
                  {timeLeft.hours}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#B98A2E] font-medium">
                  Horas
                </span>
              </div>
              <div className="bg-[#F7F3EC]/80 rounded-2xl p-3 border border-[#E5CFA3]">
                <span className="block text-2xl sm:text-4xl font-serif font-medium text-[#0F4C3A] italic">
                  {timeLeft.minutes}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#B98A2E] font-medium">
                  Min
                </span>
              </div>
              <div className="bg-[#F7F3EC]/80 rounded-2xl p-3 border border-[#E5CFA3]">
                <span className="block text-2xl sm:text-4xl font-serif font-medium text-[#0F4C3A] italic">
                  {timeLeft.seconds}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#B98A2E] font-medium">
                  Seg
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          {onOpenEnvelope && (
            <button
              onClick={onOpenEnvelope}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/80 hover:bg-white text-[#0F4C3A] font-semibold text-xs uppercase tracking-[0.2em] shadow-md border border-[#D4AF37] active:scale-[0.98] transition-all flex items-center justify-center space-x-2.5 cursor-pointer backdrop-blur-md"
            >
              <Mail className="w-4 h-4 text-[#D4AF37]" />
              <span>Ver Invitación en Sobre</span>
            </button>
          )}

          <button
            onClick={onOpenRsvp}
            className="w-full sm:w-auto px-10 py-4 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-[#FAFAF7] font-semibold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#0F4C3A]/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2.5 cursor-pointer border border-[#D4AF37]/50"
          >
            <Heart className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]/40" />
            <span>Confirmar Asistencia (RSVP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

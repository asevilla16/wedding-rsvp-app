import React, { useState } from 'react';
import { Calendar, Check, Download, ExternalLink, Heart, Sparkles } from 'lucide-react';
import { parseWeddingDate, toCalendarStamp } from '../lib/weddingDate';

interface WeddingInfoCardsProps {
  weddingDate?: string;
  weddingLocation?: string;
  coupleNames?: string;
}

export const WeddingInfoCards: React.FC<WeddingInfoCardsProps> = ({
  weddingDate = "2026-12-04T17:00:00",
  weddingLocation = "Angeli Gardens, San Pedro Sula, Honduras",
  coupleNames = "Angel & Krister",
}) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleSaveToCalendar = () => {
    // 1. Open Google Calendar link in new tab
    const eventTitle = encodeURIComponent(`Boda de ${coupleNames}`);
    const eventDetails = encodeURIComponent(
      `¡Acompáñanos a celebrar la boda de ${coupleNames}! Lugar: ${weddingLocation}`
    );
    const eventLocation = encodeURIComponent(weddingLocation);
    // From the saved wedding date (venue time, San Pedro Sula); 7 hours long.
    const start = parseWeddingDate(weddingDate);
    const end = new Date(start.getTime() + 7 * 3600 * 1000);
    const dates = `${toCalendarStamp(start)}/${toCalendarStamp(end)}`;
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${dates}&details=${eventDetails}&location=${eventLocation}`;

    window.open(gCalUrl, '_blank', 'noopener,noreferrer');

    // 2. Also generate and download .ics file for Apple Calendar / Outlook
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Boda Angel y Krister//ES',
      'BEGIN:VEVENT',
      'SUMMARY:Boda de ' + coupleNames,
      'DESCRIPTION:¡Acompáñanos a celebrar la boda de ' + coupleNames + '!',
      'LOCATION:' + weddingLocation,
      'DTSTART:' + toCalendarStamp(start),
      'DTEND:' + toCalendarStamp(end),
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Boda_Angel_y_Krister.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <section id="details-cards" className="py-16 relative text-[#2A2A2A]">
      <div className="max-w-4xl mx-auto px-6 space-y-12">
        {/* CARD 1: GUARDA LA FECHA / En tu calendario */}
        <div className="p-8 sm:p-12 rounded-[36px] bg-[#F9F6F0]/80 backdrop-blur-xl border border-[#E5CFA3] shadow-xl text-center space-y-4 relative overflow-hidden">
          <div className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[#B98A2E]">
            GUARDA LA FECHA
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#0F4C3A] font-medium italic">
            En tu calendario
          </h2>
          <p className="text-[#2A2A2A]/80 text-sm font-light font-sans max-w-md mx-auto leading-relaxed">
            En cuanto confirmemos la fecha, podrás guardarla aquí con un clic.
          </p>
          <div className="pt-3">
            <button
              onClick={handleSaveToCalendar}
              className="inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl border border-[#B98A2E] text-[#B98A2E] hover:bg-[#B98A2E] hover:text-white transition-all cursor-pointer text-xs uppercase tracking-[0.2em] font-medium shadow-2xs hover:shadow-md"
            >
              {downloaded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡AGREGADO AL CALENDARIO!</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>GUARDAR EN CALENDARIO</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CARD 2: CÓDIGO DE VESTIMENTA / Etiqueta */}
        <div className="p-8 sm:p-12 rounded-[36px] bg-[#0B3F35]/90 backdrop-blur-xl text-[#F7F3EC] shadow-2xl border border-[#B98A2E]/40 text-center space-y-5 relative overflow-hidden">
          <div className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[#D9B872]">
            CÓDIGO DE VESTIMENTA
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-white font-medium italic">
            Etiqueta
          </h2>

          {/* Minimalist Line Art Icons for Suit and Dress */}
          <div className="flex items-center justify-center space-x-6 py-2">
            {/* Suit Line Art */}
            <svg className="w-10 h-12 text-[#D9B872]" viewBox="0 0 40 48" fill="none" stroke="currentColor" strokeWidth="1.5">
              {/* Collar & Lapels */}
              <path d="M12 4L20 18L28 4" />
              <path d="M12 4L4 12V44H36V12L28 4" />
              <path d="M20 18V44" />
              {/* Tie */}
              <path d="M18 8L20 12L22 8L20 4L18 8Z" fill="#D9B872" fillOpacity="0.3" />
            </svg>

            {/* Dress Line Art */}
            <svg className="w-10 h-12 text-[#D9B872]" viewBox="0 0 40 48" fill="none" stroke="currentColor" strokeWidth="1.5">
              {/* Neckline & Straps */}
              <path d="M14 6L20 14L26 6" />
              {/* Bodice */}
              <path d="M14 6L12 18H28L26 6" />
              {/* Skirt */}
              <path d="M12 18L4 44H36L28 18" />
            </svg>
          </div>

          <p className="text-[#F7F3EC]/90 text-sm sm:text-base font-light font-sans max-w-lg mx-auto leading-relaxed">
            Traje oscuro o esmoquin para caballeros, vestido largo o midi elegante para damas. Pedimos, con cariño, evitar el blanco e ivory, reservados para la novia.
          </p>
        </div>

        {/* CARD 3: ¡Gracias por ser parte de nuestra historia! */}
        <div className="p-8 sm:p-12 rounded-[36px] bg-[#F9F6F0]/80 backdrop-blur-xl border border-[#E5CFA3] shadow-xl text-center space-y-4 relative overflow-hidden">
          {/* Golden Interlocking Rings Icon */}
          <div className="flex justify-center text-[#B98A2E]">
            <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="15" cy="20" r="10" />
              <circle cx="25" cy="20" r="10" />
            </svg>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl text-[#0F4C3A] font-medium italic">
            ¡Gracias por ser parte de nuestra historia!
          </h2>

          <div className="space-y-2 text-[#2A2A2A]/80 text-sm font-light font-sans max-w-md mx-auto leading-relaxed">
            <p>Tu cariño y tu compañía son el mejor regalo que podemos recibir.</p>
            <p>Si además desean tener un detalle con nosotros, preferimos que sea en efectivo.</p>
          </div>

          {/* Golden Heart Motif */}
          <div className="py-2 flex justify-center text-[#B98A2E]">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          <div className="text-[11px] uppercase tracking-[0.35em] font-semibold text-[#B98A2E]">
            ÁNGEL & KRISTER
          </div>
        </div>
      </div>
    </section>
  );
};

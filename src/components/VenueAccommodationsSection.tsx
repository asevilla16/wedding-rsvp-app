import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { WeddingDetails } from '../types';

interface VenueAccommodationsSectionProps {
  wedding: WeddingDetails;
}

export const VenueAccommodationsSection: React.FC<VenueAccommodationsSectionProps> = ({ wedding }) => {
  return (
    <section id="venue" className="py-20 relative text-[#2A2A2A]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-[#E5CFA3] text-[#B98A2E] text-[10px] uppercase tracking-[0.3em] font-medium mb-3 shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-[#0F4C3A]" />
            <span>Ubicación del Evento</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#0F4C3A] font-medium mb-3 italic">
            Lugar de la Celebración
          </h2>
          <p className="text-[#2A2A2A]/80 text-sm font-light font-sans">
            Te esperamos en este hermoso lugar para celebrar juntos nuestro matrimonio.
          </p>
        </div>

        {/* Venue Spotlight */}
        <div className="p-8 sm:p-12 rounded-[40px] bg-white/70 backdrop-blur-2xl border border-[#E5CFA3] shadow-2xl shadow-[#0F4C3A]/5 overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#B98A2E] font-medium block">
                Lugar de la Celebración
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-[#0F4C3A] font-medium italic">
                {wedding.weddingLocation}
              </h3>
              <p className="text-[#2A2A2A]/85 text-sm leading-relaxed font-light font-sans">
                Un entorno mágico y elegante preparado especialmente para recibir a nuestros seres queridos. Los esperamos para compartir este momento tan esperado.
              </p>

              <div className="p-4 rounded-2xl bg-[#F7F3EC] border border-[#E5CFA3] flex items-center space-x-3 text-xs text-[#2A2A2A] shadow-xs">
                <MapPin className="w-5 h-5 text-[#0F4C3A] shrink-0" />
                <div>
                  <span className="font-medium block text-[#0F4C3A]">{wedding.venueAddress}</span>
                  <span className="text-[#2A2A2A]/70 font-light">Estacionamiento privado y servicio de recepción</span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="https://maps.app.goo.gl/cfh3eQzKUS3Mp25i7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-8 py-4 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-[#F7F3EC] font-medium text-xs uppercase tracking-[0.2em] transition-all cursor-pointer shadow-md active:scale-[0.98] border border-[#B98A2E]/50"
                >
                  <Navigation className="w-4 h-4 text-[#D9B872]" />
                  <span>Abrir en Google Maps →</span>
                </a>
              </div>
            </div>

            {/* Embedded Visual / Venue Picture */}
            <div className="lg:col-span-5 h-72 sm:h-96 rounded-[32px] overflow-hidden border border-[#E5CFA3] relative group shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80"
                alt="Lugar de la celebración"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B3F35]/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-[#E5CFA3] text-center shadow-md">
                <p className="text-xs text-[#0F4C3A] font-serif font-medium italic">Lugar de la Celebración</p>
                <p className="text-[10px] text-[#B98A2E] font-sans font-medium uppercase tracking-wider">Ángel & Krister</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

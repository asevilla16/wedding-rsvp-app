import React from 'react';
import { Heart, Clock } from 'lucide-react';
import { WeddingDetails } from '../types';

interface StorySectionProps {
  wedding: WeddingDetails;
  onOpenRsvp: () => void;
}

export const StorySection: React.FC<StorySectionProps> = ({ wedding, onOpenRsvp }) => {
  const formattedDeadline = new Date(wedding.rsvpDeadline).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section id="story" className="py-20 relative text-[#2A2A2A]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-[#E5CFA3] text-[#B98A2E] text-[10px] uppercase tracking-[0.3em] font-medium mb-3 shadow-xs">
            <Heart className="w-3.5 h-3.5 text-[#0F4C3A] fill-[#0F4C3A]/30" />
            <span>Nuestra Historia</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#0F4C3A] font-medium mb-3 italic">
            Ángel & Krister
          </h2>
          <div className="w-16 h-0.5 bg-[#B98A2E]/60 mx-auto" />
        </div>

        {/* Story Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          {/* Couple Image Frame */}
          <div className="md:col-span-5 relative">
            <div className="relative rounded-t-[160px] rounded-b-2xl overflow-hidden border border-[#E5CFA3] shadow-2xl shadow-[#0F4C3A]/10 bg-white/60 backdrop-blur-md group">
              <img
                src={"/images/wedding_couple.jpeg"}
                alt={wedding.coupleNames}
                className="w-full h-96 sm:h-[450px] object-cover object-top transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B3F35]/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-[#E5CFA3] text-center shadow-lg">
                <p className="font-serif text-lg text-[#0F4C3A] font-medium italic">{wedding.partner1Name} & {wedding.partner2Name}</p>
                <p className="text-xs text-[#B98A2E] uppercase tracking-widest font-medium">Angeli Gardens</p>
              </div>
            </div>
            {/* Soft decorative ring */}
            <div className="absolute -bottom-3 -right-3 w-full h-full border border-[#B98A2E]/40 rounded-t-[170px] rounded-b-3xl -z-10 pointer-events-none" />
          </div>

          {/* Story Narrative & RSVP Deadline Card */}
          <div className="md:col-span-7 space-y-6">
            <div className="p-8 rounded-[36px] bg-white/70 backdrop-blur-2xl border border-[#E5CFA3] shadow-xl shadow-[#0F4C3A]/5 space-y-5">
              <h3 className="font-serif text-2xl text-[#0F4C3A] italic font-medium">
                "El amor no se mira, se construye juntos."
              </h3>

              <p className="text-[#2A2A2A]/90 text-base leading-relaxed font-light font-sans">
                {wedding.ourStory}
              </p>

              <p className="text-[#2A2A2A]/80 text-sm leading-relaxed font-light font-sans">
                Con mucho cariño y alegría, queremos invitarlos a acompañarnos en el día más especial de nuestras vidas. Tu presencia y buenos deseos harán de este día un recuerdo inolvidable.
              </p>

              {/* RSVP Deadline Alert Box */}
              <div className="p-5 rounded-2xl bg-[#F7F3EC]/80 backdrop-blur-md border border-[#E5CFA3] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs mt-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E5CFA3] flex items-center justify-center text-[#0F4C3A] shrink-0 shadow-xs">
                    <Clock className="w-5 h-5 text-[#B98A2E]" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-medium text-[#B98A2E]">Agradecemos Confirmar Antes Del</h4>
                    <p className="text-sm font-serif font-medium text-[#0F4C3A] capitalize">{formattedDeadline}</p>
                  </div>
                </div>

                <button
                  onClick={onOpenRsvp}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-white text-xs uppercase tracking-[0.2em] font-medium transition-all shadow-md active:scale-[0.98] cursor-pointer shrink-0 border border-[#B98A2E]/40"
                >
                  Confirmar RSVP
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

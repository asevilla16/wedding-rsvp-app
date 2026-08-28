import React from 'react';
import { Calendar, Wine, Heart, GlassWater, Utensils, Music, Sparkles, MapPin, Clock, Flame, DoorOpen, PartyPopper } from 'lucide-react';
import { EventScheduleItem } from '../types';

interface ScheduleSectionProps {
  schedule: EventScheduleItem[];
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({ schedule }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Wine':
        return Wine;
      case 'Heart':
        return Heart;
      case 'GlassWater':
        return GlassWater;
      case 'Utensils':
        return Utensils;
      case 'Music':
        return Music;
      case 'Flame':
        return Flame;
      case 'DoorOpen':
        return DoorOpen;
      case 'PartyPopper':
        return PartyPopper;
      case 'Sparkles':
        return Sparkles;
      default:
        return Calendar;
    }
  };

  return (
    <section id="schedule" className="py-20 relative text-[#2A2A2A]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[#0F4C3A]/30 text-[#0F4C3A] text-[10px] uppercase tracking-[0.3em] font-bold mb-3 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Itinerario Nupcial</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#0F4C3A] font-medium mb-3 italic">
            Programa de la Celebración
          </h2>
          <p className="text-[#2A2A2A]/85 text-sm font-light font-sans max-w-xl mx-auto leading-relaxed">
            Hemos preparado cada momento con mucho amor para disfrutar junto a ustedes esta noche mágica.
          </p>
        </div>

        {/* Timeline Items */}
        <div className="relative border-l-2 border-[#0F4C3A]/30 ml-4 sm:ml-36 space-y-10">
          {schedule.map((item, index) => {
            const IconComponent = getIcon(item.iconName);
            return (
              <div key={item.id} className="relative pl-8 sm:pl-12 group">
                {/* Timeline Dot Icon */}
                <div className="absolute -left-[19px] top-2.5 w-9 h-9 rounded-full bg-[#0F4C3A] border-2 border-[#D4AF37] text-[#FAF9F5] flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                  <IconComponent className="w-4 h-4 text-[#D4AF37]" />
                </div>

                {/* Desktop Time Column Left */}
                <div className="hidden sm:block absolute -left-36 top-3 text-right w-28 pr-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#0F4C3A] font-serif block">
                    {item.time.split('•')[0] || item.time}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[#B98A2E] font-medium block">
                    Paso {index + 1}
                  </span>
                </div>

                {/* Content Card */}
                <div className="p-6 sm:p-7 rounded-[30px] bg-white/80 backdrop-blur-2xl border-2 border-[#0F4C3A]/15 hover:border-[#0F4C3A]/40 transition-all shadow-xl shadow-[#0F4C3A]/5 group-hover:translate-x-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="font-serif text-2xl text-[#0F4C3A] font-medium italic">
                      {item.title}
                    </h3>
                    <span className="sm:hidden text-xs font-bold text-[#0F4C3A] px-3.5 py-1 rounded-full bg-[#0F4C3A]/10 border border-[#0F4C3A]/30">
                      {item.time}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#2A2A2A]/75 font-medium mb-3">
                    <div className="flex items-center space-x-1.5 text-[#B98A2E]">
                      <Clock className="w-3.5 h-3.5 text-[#0F4C3A]" />
                      <span className="font-semibold">{item.time}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1.5 text-[#0F4C3A]">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="font-medium">{item.location}</span>
                    </div>
                  </div>

                  <p className="text-[#2A2A2A]/85 text-sm leading-relaxed mb-4 font-light font-sans">
                    {item.description}
                  </p>

                  {item.dressCode && (
                    <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#F7F3EC] border border-[#E5CFA3] text-[#0F4C3A] text-[11px] font-medium tracking-wide shadow-2xs">
                      <span className="text-[#B98A2E] font-semibold uppercase text-[10px] tracking-wider">Código de vestimenta:</span>
                      <span>{item.dressCode}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

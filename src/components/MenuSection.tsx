import React from 'react';
import { Utensils, Leaf, Sparkles, CheckCircle2, HeartHandshake } from 'lucide-react';
import { MealOption } from '../types';

interface MenuSectionProps {
  meals: MealOption[];
  onOpenRsvp: () => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ meals, onOpenRsvp }) => {
  return (
    <section id="menu" className="py-20 relative text-[#2A2A2A]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[#0F4C3A]/30 text-[#0F4C3A] text-[10px] uppercase tracking-[0.3em] font-bold mb-3 shadow-xs">
            <Utensils className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Banquete Nupcial Establecido</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#0F4C3A] font-medium mb-3 italic">
            Menú de la Celebración
          </h2>
          <p className="text-[#2A2A2A]/85 text-sm font-light font-sans max-w-xl mx-auto leading-relaxed">
            Hemos seleccionado cuidadosamente un menú fijo de alta cocina para disfrutar todos juntos. Si tienes alguna alergia o restricción médica específica, podrás indicárnosla al realizar tu RSVP.
          </p>
          <div className="inline-flex items-center space-x-2 mt-4 px-4 py-1.5 rounded-full bg-[#0F4C3A]/10 border border-[#0F4C3A]/20 text-[#0F4C3A] text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Menú único definido para todos los comensales</span>
          </div>
        </div>

        {/* Menu Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meals.map((meal, index) => (
            <div
              key={meal.id}
              className="p-7 rounded-[32px] bg-white/80 backdrop-blur-2xl border-2 border-[#0F4C3A]/15 hover:border-[#0F4C3A]/40 transition-all flex flex-col justify-between shadow-xl shadow-[#0F4C3A]/5 hover:shadow-[#0F4C3A]/15"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#B98A2E] block mb-1">
                      Paso {index + 1} del Banquete
                    </span>
                    <h3 className="font-serif text-2xl text-[#0F4C3A] font-medium italic">{meal.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
                    {meal.isGlutenFree && (
                      <span className="px-2.5 py-1 rounded-full bg-[#0F4C3A]/10 border border-[#0F4C3A]/20 text-[#0F4C3A] text-[10px] uppercase tracking-wider font-semibold">
                        Sin Gluten
                      </span>
                    )}
                    {meal.category === 'vegetarian' && (
                      <span className="px-2.5 py-1 rounded-full bg-[#0F4C3A]/10 border border-[#0F4C3A]/20 text-[#0F4C3A] text-[10px] uppercase tracking-wider font-semibold flex items-center space-x-1">
                        <Leaf className="w-2.5 h-2.5 text-[#0F4C3A]" />
                        <span>Vegetariano</span>
                      </span>
                    )}
                    {meal.category === 'vegan' && (
                      <span className="px-2.5 py-1 rounded-full bg-[#0F4C3A]/10 border border-[#0F4C3A]/20 text-[#0F4C3A] text-[10px] uppercase tracking-wider font-semibold flex items-center space-x-1">
                        <Leaf className="w-2.5 h-2.5 text-[#0F4C3A]" />
                        <span>Vegano</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[#2A2A2A]/85 text-sm font-light leading-relaxed font-sans pt-1">
                  {meal.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E5CFA3]/80 mt-5 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-[11px] font-medium text-[#0F4C3A]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Incluido en el servicio</span>
                </div>
                <button
                  onClick={onOpenRsvp}
                  className="text-xs text-[#0F4C3A] hover:text-[#0B3F35] font-semibold uppercase tracking-wider cursor-pointer transition-colors hover:underline"
                >
                  Reportar Alergia →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Informative Note Footer */}
        <div className="mt-12 p-6 rounded-[28px] bg-white/70 backdrop-blur-xl border border-[#0F4C3A]/20 max-w-2xl mx-auto text-center space-y-2 shadow-sm">
          <div className="flex items-center justify-center space-x-2 text-[#0F4C3A]">
            <HeartHandshake className="w-4 h-4 text-[#D4AF37]" />
            <h4 className="font-serif text-lg font-medium italic">Atención a Restricciones y Alergias</h4>
          </div>
          <p className="text-xs text-[#2A2A2A]/80 font-sans font-light leading-relaxed">
            El menú ya ha sido fijado y contratado con el recinto. Nuestro equipo de catering adaptará platillos alternativos exclusivamente para aquellos invitados que hayan registrado alergias alimentarias o celiaquía en su confirmación.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenRsvp}
              className="px-6 py-2.5 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-[#FAFAF7] text-xs font-semibold uppercase tracking-[0.2em] shadow-md border border-[#D4AF37]/50 transition-all cursor-pointer inline-flex items-center space-x-2"
            >
              <span>Confirmar Asistencia y Notificar Alergia</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { Gift, Palmtree, Utensils, Heart, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RegistryItem } from '../types';

interface RegistrySectionProps {
  registry: RegistryItem[];
}

export const RegistrySection: React.FC<RegistrySectionProps> = ({ registry }) => {
  const [contributedMap, setContributedMap] = useState<Record<string, number>>({});
  const [activeModalItem, setActiveModalItem] = useState<RegistryItem | null>(null);
  const [contribAmount, setContribAmount] = useState<number>(100);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Palmtree':
        return Palmtree;
      case 'Utensils':
        return Utensils;
      default:
        return Gift;
    }
  };

  const handleContribute = (item: RegistryItem) => {
    setActiveModalItem(item);
    setContribAmount(100);
    setSuccessMessage(null);
  };

  const submitContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalItem) return;

    setContributedMap((prev) => ({
      ...prev,
      [activeModalItem.id]: (prev[activeModalItem.id] || activeModalItem.currentAmount || 0) + contribAmount,
    }));

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#0f4c3a', '#b98a2e', '#e5cfa3'],
    });

    setSuccessMessage(`¡Muchas gracias! Tu regalo de $${contribAmount} para "${activeModalItem.title}" ha sido recibido con mucho amor.`);
    setTimeout(() => {
      setActiveModalItem(null);
      setSuccessMessage(null);
    }, 2500);
  };

  return (
    <section id="registry" className="py-20 relative text-[#2A2A2A]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-[#E5CFA3] text-[#B98A2E] text-[10px] uppercase tracking-[0.3em] font-medium mb-3 shadow-xs">
            <Gift className="w-3.5 h-3.5 text-[#0F4C3A]" />
            <span>Mesa de Regalos & Luna de Miel</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#0F4C3A] font-medium mb-3 italic">
            Mesa de Regalos
          </h2>
          <p className="text-[#2A2A2A]/80 text-sm leading-relaxed font-light font-sans">
            El mejor regalo es contar con tu presencia en nuestro gran día. Si deseas tener un detalle adicional, hemos creado este fondo de regalos para nuestra Luna de Miel.
          </p>
        </div>

        {/* Registry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {registry.map((item) => {
            const IconComponent = getIcon(item.iconName);
            const currentAmount = contributedMap[item.id] !== undefined ? contributedMap[item.id] : item.currentAmount || 0;
            const targetAmount = item.targetAmount || 1000;
            const percent = Math.min(100, Math.round((currentAmount / targetAmount) * 100));

            return (
              <div
                key={item.id}
                className="p-7 rounded-[32px] bg-white/70 backdrop-blur-2xl border border-[#E5CFA3] hover:bg-white/90 transition-all flex flex-col justify-between shadow-xl shadow-[#0F4C3A]/5"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F7F3EC] border border-[#E5CFA3] flex items-center justify-center text-[#0F4C3A] shadow-xs">
                    <IconComponent className="w-6 h-6 text-[#0F4C3A]" />
                  </div>

                  <div>
                    <h3 className="font-serif text-xl text-[#0F4C3A] font-medium italic mb-1">{item.title}</h3>
                    <p className="text-[#2A2A2A]/80 text-xs leading-relaxed font-light font-sans">{item.description}</p>
                  </div>

                  {item.category === 'fund' || item.targetAmount ? (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#2A2A2A]/70 font-light">Acumulado: ${currentAmount}</span>
                        <span className="text-[#0F4C3A] font-medium">{percent}% de ${targetAmount}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#F7F3EC] border border-[#E5CFA3] overflow-hidden">
                        <div
                          className="h-full bg-[#0F4C3A] rounded-full transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => handleContribute(item)}
                    className="w-full py-3.5 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-[#F7F3EC] text-xs font-medium uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-md active:scale-[0.98] border border-[#B98A2E]/40"
                  >
                    <Heart className="w-3.5 h-3.5 fill-[#D9B872]/30 text-[#D9B872]" />
                    <span>Aportar Regalo</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contribution Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B3F35]/40 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#F7F3EC] border border-[#E5CFA3] rounded-[36px] p-8 text-[#2A2A2A] shadow-2xl relative">
            <h3 className="font-serif text-2xl text-[#0F4C3A] font-medium italic mb-1">Regalar: {activeModalItem.title}</h3>
            <p className="text-xs text-[#2A2A2A]/80 mb-6 font-light font-sans">{activeModalItem.description}</p>

            {successMessage ? (
              <div className="p-5 rounded-2xl bg-white border border-[#E5CFA3] text-[#0F4C3A] text-xs text-center space-y-2 shadow-xs">
                <Sparkles className="w-6 h-6 text-[#B98A2E] mx-auto" />
                <p className="font-medium">{successMessage}</p>
              </div>
            ) : (
              <form onSubmit={submitContribution} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-2">Selecciona un Monto ($ USD)</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[50, 100, 250, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setContribAmount(amt)}
                        className={`py-2.5 rounded-xl border text-xs font-medium uppercase cursor-pointer transition-all ${
                          contribAmount === amt
                            ? 'bg-[#0F4C3A] text-white border-[#0F4C3A] shadow-xs'
                            : 'bg-white text-[#2A2A2A] border-[#E5CFA3] hover:bg-white/80'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="10"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-[#E5CFA3] rounded-xl text-sm font-medium text-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveModalItem(null)}
                    className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#2A2A2A]/70 hover:text-[#0F4C3A] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-full bg-[#0F4C3A] text-white font-medium text-xs uppercase tracking-[0.2em] transition-all cursor-pointer shadow-md hover:bg-[#0B3F35] active:scale-[0.98] border border-[#B98A2E]/40"
                  >
                    Confirmar Regalo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

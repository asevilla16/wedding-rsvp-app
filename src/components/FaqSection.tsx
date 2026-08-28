import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { FAQItem } from '../types';

interface FaqSectionProps {
  faqs: FAQItem[];
}

export const FaqSection: React.FC<FaqSectionProps> = ({ faqs }) => {
  const [openIds, setOpenIds] = useState<string[]>([faqs[0]?.id || '']);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todas las Preguntas' },
    { id: 'general', label: 'General & RSVP' },
    { id: 'dress-code', label: 'Código de Vestimenta' },
    { id: 'travel', label: 'Ubicación & Traslados' },
  ];

  const filteredFaqs = activeCategory === 'all' ? faqs : faqs.filter((f) => f.category === activeCategory);

  const toggleFaq = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <section id="faqs" className="py-20 relative text-[#2A2A2A]">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-[#E5CFA3] text-[#B98A2E] text-[10px] uppercase tracking-[0.3em] font-medium mb-3 shadow-xs">
            <HelpCircle className="w-3.5 h-3.5 text-[#0F4C3A]" />
            <span>¿Tienes Dudas?</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#0F4C3A] font-medium mb-3 italic">
            Preguntas Frecuentes
          </h2>
          <p className="text-[#2A2A2A]/80 text-sm font-light font-sans">
            Todo lo que necesitas saber para acompañarnos en nuestro gran día.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-xs uppercase tracking-wider font-medium transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#0F4C3A] text-white border border-[#0F4C3A] shadow-md'
                  : 'bg-white/60 backdrop-blur-md border border-[#E5CFA3] text-[#2A2A2A] hover:bg-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordions */}
        <div className="space-y-4">
          {filteredFaqs.map((faq) => {
            const isOpen = openIds.includes(faq.id);
            return (
              <div
                key={faq.id}
                className="rounded-[24px] bg-white/70 backdrop-blur-2xl border border-[#E5CFA3] overflow-hidden transition-all shadow-lg shadow-[#0F4C3A]/5"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between font-serif text-xl text-[#0F4C3A] font-medium italic hover:text-[#0B3F35] transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[#B98A2E] shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#B98A2E]/60 shrink-0 ml-4" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-[#2A2A2A]/85 text-sm font-light font-sans leading-relaxed border-t border-[#E5CFA3]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

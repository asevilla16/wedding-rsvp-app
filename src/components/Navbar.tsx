import React, { useState } from 'react';
import { Heart, Calendar, MapPin, Utensils, HelpCircle, Gift, MessageSquareCode, ShieldCheck, Sparkles, Menu, X, Camera, Mail } from 'lucide-react';

interface NavbarProps {
  coupleNames: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAdmin: () => void;
  onOpenRsvp: () => void;
  onOpenAiConcierge: () => void;
  onOpenEnvelope?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  coupleNames,
  activeTab,
  setActiveTab,
  onOpenAdmin,
  onOpenRsvp,
  onOpenAiConcierge,
  onOpenEnvelope,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'story', label: 'Nuestra Historia', icon: Heart },
    { id: 'rsvp', label: 'RSVP', icon: Heart, action: onOpenRsvp, highlight: true },
    { id: 'schedule', label: 'Itinerario', icon: Calendar },
    { id: 'venue', label: 'Ubicación', icon: MapPin },
    // { id: 'menu', label: 'Menú', icon: Utensils },
    // { id: 'gallery', label: 'Galería', icon: Camera },
    { id: 'faqs', label: 'Preguntas', icon: HelpCircle },
    { id: 'guestbook', label: 'Libro de Visitas', icon: MessageSquareCode },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.action) {
      item.action();
    } else {
      setActiveTab(item.id);
      const elem = document.getElementById(item.id);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F7F3EC]/80 backdrop-blur-xl border-b border-[#E5CFA3] text-[#2A2A2A] shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => {
            setActiveTab('hero');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center space-x-2 text-left group cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-[#0F4C3A] flex items-center justify-center text-[#F7F3EC] group-hover:scale-105 transition-all shadow-xs border border-[#B98A2E]/50 shrink-0">
            <Heart className="w-4 h-4 text-[#D9B872] fill-[#D9B872]/40" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-serif text-lg font-medium tracking-tight text-[#0F4C3A] group-hover:text-[#0B3F35] transition-colors italic leading-tight">
              {coupleNames}
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-[0.2em] text-[#B98A2E] font-medium leading-tight">
              2026
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.highlight) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className="px-5 py-2 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-[#F7F3EC] font-medium text-xs uppercase tracking-[0.2em] shadow-md shadow-[#0F4C3A]/10 active:scale-[0.98] transition-all flex items-center space-x-1.5 cursor-pointer ml-2 border border-[#B98A2E]/40"
                >
                  <Icon className="w-3.5 h-3.5 fill-[#D9B872]/30 text-[#D9B872]" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-widest font-medium transition-all flex items-center space-x-1 cursor-pointer ${
                  activeTab === item.id
                    ? 'text-[#0F4C3A] bg-white/80 backdrop-blur-md border border-[#E5CFA3] shadow-xs'
                    : 'text-[#2A2A2A]/80 hover:text-[#0F4C3A] hover:bg-white/40'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* View Envelope Button */}
          {onOpenEnvelope && (
            <button
              onClick={onOpenEnvelope}
              className="px-3.5 py-1.5 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-[#FAFAF7] text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer border border-[#D4AF37]/50"
              title="Ver sobre de invitación"
            >
              <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Ver Sobre</span>
            </button>
          )}

          {/* AI Concierge Button */}
          {/* <button
            onClick={onOpenAiConcierge}
            className="px-3.5 py-1.5 rounded-full bg-white/60 hover:bg-white/90 backdrop-blur-md border border-[#E5CFA3] text-[#0F4C3A] text-xs font-medium uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            title="Asistente IA de la Boda"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B98A2E] animate-pulse" />
            <span className="hidden sm:inline">Concierge IA</span>
          </button> */}

          {/* Admin Toggle */}
          {/* <button
            onClick={onOpenAdmin}
            className="px-3 py-1.5 rounded-full bg-white/70 hover:bg-white backdrop-blur-md border border-[#E5CFA3] text-[#0F4C3A] text-xs font-medium uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            title="Panel de Gestión para los Novios (Angel & Krister)"
          >
            <ShieldCheck className="w-4 h-4 text-[#B98A2E]" />
            <span className="hidden md:inline font-semibold text-[11px]">Panel Novios</span>
          </button> */}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full bg-white/60 backdrop-blur-md border border-[#E5CFA3] text-[#0F4C3A] hover:bg-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F7F3EC]/95 backdrop-blur-2xl border-b border-[#E5CFA3] px-4 py-4 space-y-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider font-medium flex items-center space-x-2 w-full text-left cursor-pointer transition-all ${
                    item.highlight
                      ? 'bg-[#0F4C3A] text-white font-bold col-span-2 justify-center shadow-md border border-[#B98A2E]'
                      : activeTab === item.id
                      ? 'bg-white text-[#0F4C3A] border border-[#E5CFA3] shadow-xs'
                      : 'bg-white/50 text-[#2A2A2A] hover:bg-white/80 border border-[#E5CFA3]/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#B98A2E]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              onOpenAdmin();
              setMobileMenuOpen(false);
            }}
            className="w-full py-3 px-4 rounded-2xl bg-white border border-[#E5CFA3] text-[#0F4C3A] font-semibold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-xs cursor-pointer hover:bg-[#F7F3EC]"
          >
            <ShieldCheck className="w-4 h-4 text-[#B98A2E]" />
            <span>Panel de Gestión Novios</span>
          </button>
        </div>
      )}
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { StorySection } from './components/StorySection';
import { ScheduleSection } from './components/ScheduleSection';
import { VenueAccommodationsSection } from './components/VenueAccommodationsSection';
import { MenuSection } from './components/MenuSection';
import { GallerySection } from './components/GallerySection';
import { WeddingInfoCards } from './components/WeddingInfoCards';
import { FaqSection } from './components/FaqSection';
import { GuestbookSection } from './components/GuestbookSection';
import { RsvpModal } from './components/RsvpModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AiConciergeModal } from './components/AiConciergeModal';
import { EnvelopeIntro } from './components/EnvelopeIntro';
import { WeddingDetails, GuestbookWish } from './types';
import { fetchWeddingInfo } from './services/api';
import { defaultWeddingData } from './data/defaultData';
import { Heart } from 'lucide-react';

export default function App() {
  const [wedding, setWedding] = useState<WeddingDetails>(defaultWeddingData.wedding);
  const [wishes, setWishes] = useState<GuestbookWish[]>(defaultWeddingData.wishes);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('hero');
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [aiConciergeModalOpen, setAiConciergeModalOpen] = useState(false);
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [initialCode, setInitialCode] = useState<string | null>(null);

  useEffect(() => {
    loadWeddingData();

    // Check for personalized invitation link in URL params (?code=INV-XXXX)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || params.get('invitado') || params.get('guest');
    if (code) {
      setInitialCode(code);
      setRsvpModalOpen(true);
    }
  }, []);

  const loadWeddingData = async () => {
    try {
      const data = await fetchWeddingInfo();
      if (data && data.wedding) {
        setWedding(data.wedding);
      }
      if (data && data.wishes) {
        setWishes(data.wishes);
      }
    } catch (err) {
      console.error('Failed to load wedding data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fdfcfb] text-gray-800 font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-x-hidden">
      {/* Background Mesh Gradient */}
      <div className="mesh-gradient" />

      {/* Navigation Bar */}
      <Navbar
        coupleNames={wedding.coupleNames}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdmin={() => setAdminModalOpen(true)}
        onOpenRsvp={() => setRsvpModalOpen(true)}
        onOpenAiConcierge={() => setAiConciergeModalOpen(true)}
        onOpenEnvelope={() => setShowEnvelope(true)}
      />

      {/* Main Content Sections */}
      <main className="relative z-10">
        {/* 1. Hero Section & Live Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <HeroSection
            wedding={wedding}
            onOpenRsvp={() => setRsvpModalOpen(true)}
            onOpenEnvelope={() => setShowEnvelope(true)}
          />
        </motion.div>

        {/* 2. Our Story Journey & RSVP Deadline */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <StorySection wedding={wedding} onOpenRsvp={() => setRsvpModalOpen(true)} />
        </motion.div>

        {/* 3. Schedule of Events */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <ScheduleSection schedule={wedding.schedule} />
        </motion.div>

        {/* 4. Venue Location */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <VenueAccommodationsSection wedding={wedding} />
        </motion.div>

        {/* Save the Date, Dress Code & Appreciation Cards */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <WeddingInfoCards
            weddingDate={wedding.weddingDate}
            weddingLocation={wedding.weddingLocation}
            coupleNames={wedding.coupleNames}
          />
        </motion.div>

        {/* 5. Menu */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <MenuSection meals={wedding.meals} onOpenRsvp={() => setRsvpModalOpen(true)} />
        </motion.div>

        {/* 6. Photo Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <GallerySection photos={wedding.galleryPhotos} />
        </motion.div>

        {/* 7. FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <FaqSection faqs={wedding.faqs} />
        </motion.div>

        {/* 8. Digital Guestbook & Wishes Wall */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <GuestbookSection wishes={wishes} onWishAdded={(newWishes) => setWishes(newWishes)} />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 bg-white/50 backdrop-blur-md border-t border-[#E5CFA3] text-[#2A2A2A]/70 text-xs text-center space-y-4">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#0F4C3A] backdrop-blur-md border border-[#B98A2E]/50 shadow-sm flex items-center justify-center text-[#F7F3EC]">
            <Heart className="w-5 h-5 fill-[#B98A2E] text-[#D9B872]" />
          </div>

          <h3 className="font-serif text-2xl text-[#0F4C3A] font-medium tracking-tight italic">
            {wedding.coupleNames}
          </h3>

          <p className="text-[#2A2A2A]/80 max-w-md font-light">
            {new Date(wedding.weddingDate).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            • {wedding.weddingLocation} • Honduras
          </p>

          <div className="pt-2 flex items-center space-x-4 text-[#0F4C3A] font-sans text-xs">
            <button
              onClick={() => setShowEnvelope(true)}
              className="hover:text-[#B98A2E] underline cursor-pointer font-medium"
            >
              Ver Sobre de Invitación
            </button>
            <span>•</span>
            <button
              onClick={() => setRsvpModalOpen(true)}
              className="hover:text-[#B98A2E] underline cursor-pointer font-medium"
            >
              Confirmar Asistencia
            </button>
            <span>•</span>
            <button
              onClick={() => setAiConciergeModalOpen(true)}
              className="hover:text-[#B98A2E] underline cursor-pointer font-medium"
            >
              Asistente Virtual
            </button>
            <span>•</span>
            <button
              onClick={() => setAdminModalOpen(true)}
              className="hover:text-[#B98A2E] underline cursor-pointer font-medium"
            >
              Acceso para Novios
            </button>
          </div>

          <p className="text-[10px] text-[#B98A2E] uppercase tracking-widest pt-4 font-semibold">
            Con todo nuestro amor • {wedding.coupleNames}
          </p>
        </div>
      </footer>

      {/* Opening Envelope Intro Overlay */}
      {showEnvelope && (
        <EnvelopeIntro
          wedding={wedding}
          onClose={() => setShowEnvelope(false)}
          onOpenRsvp={() => setRsvpModalOpen(true)}
        />
      )}

      {/* RSVP Multi-Step Modal */}
      <RsvpModal
        wedding={wedding}
        isOpen={rsvpModalOpen}
        initialCode={initialCode}
        onClose={() => setRsvpModalOpen(false)}
        onRsvpSuccess={loadWeddingData}
      />

      {/* Host Admin Dashboard */}
      <AdminDashboard
        wedding={wedding}
        wishes={wishes}
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onWeddingUpdated={(updated) => setWedding(updated)}
        onWishesUpdated={(updatedWishes) => setWishes(updatedWishes)}
      />

      {/* AI Concierge Modal */}
      <AiConciergeModal
        isOpen={aiConciergeModalOpen}
        onClose={() => setAiConciergeModalOpen(false)}
        coupleNames={wedding.coupleNames}
      />
    </div>
  );
}

import React, { useState } from 'react';
import { X, CheckCircle2, Heart, Calendar, AlertCircle, Sparkles, Download, Music, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { WeddingDetails, GuestEntry } from '../types';
import { fetchInvitation, submitRsvp } from '../services/api';
import { getInviteUrl } from '../lib/inviteCode';
import { parseWeddingDate, formatWeddingDate, toCalendarStamp } from '../lib/weddingDate';

interface RsvpModalProps {
  wedding: WeddingDetails;
  isOpen: boolean;
  initialCode?: string | null;
  onClose: () => void;
  onRsvpSuccess: () => void;
}

export const RsvpModal: React.FC<RsvpModalProps> = ({ wedding, isOpen, initialCode, onClose, onRsvpSuccess }) => {
  const [step, setStep] = useState<'lookup' | 'form' | 'success'>('lookup');
  // Outcome of loading the invitation behind the personal link. Guests can only
  // RSVP through their link; there is no search, so other guests stay private.
  const [lookup, setLookup] = useState<'loading' | 'no-link' | 'not-found' | 'error' | 'covered'>('loading');
  const [coveredInvitation, setCoveredInvitation] = useState<GuestEntry | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setStep('lookup');
    if (!initialCode) {
      setLookup('no-link');
      return;
    }
    setLookup('loading');
    fetchInvitation(initialCode)
      .then((invitation) => {
        if (!invitation) {
          setLookup('not-found');
        } else if (invitation.coveredByName) {
          // Covered by a partner's invitation: show the notice, not the form.
          setCoveredInvitation(invitation);
          setLookup('covered');
        } else {
          selectGuestToRsvp(invitation);
        }
      })
      .catch((err) => {
        console.error('Error loading invitation:', err);
        setLookup('error');
      });
  }, [isOpen, initialCode]);

  // Active Guest Form State
  const [selectedGuest, setSelectedGuest] = useState<GuestEntry | null>(null);
  const [status, setStatus] = useState<'attending' | 'declined'>('attending');
  const [primaryMealId, setPrimaryMealId] = useState<string>('');
  const [primaryDietary, setPrimaryDietary] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Plus One State
  const [hasPlusOne, setHasPlusOne] = useState<boolean>(false);
  const [plusOneName, setPlusOneName] = useState<string>('');
  const [plusOneMealId, setPlusOneMealId] = useState<string>('');
  const [plusOneDietary, setPlusOneDietary] = useState<string>('');

  // Event schedule selections
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Song Request & Wish
  const [songTitle, setSongTitle] = useState<string>('');
  const [songArtist, setSongArtist] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    // Initial central burst
    confetti({
      particleCount: 110,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#0F4C3A', '#B98A2E', '#E5CFA3', '#FFFFFF', '#D9B872'],
    });

    // Side celebratory bursts
    setTimeout(() => {
      confetti({
        particleCount: 65,
        angle: 60,
        spread: 60,
        origin: { x: 0.1, y: 0.65 },
        colors: ['#0F4C3A', '#B98A2E', '#E5CFA3'],
      });
      confetti({
        particleCount: 65,
        angle: 120,
        spread: 60,
        origin: { x: 0.9, y: 0.65 },
        colors: ['#0F4C3A', '#B98A2E', '#E5CFA3'],
      });
    }, 250);
  };

  const selectGuestToRsvp = (guest: GuestEntry) => {
    setSelectedGuest(guest);
    setStatus(guest.status === 'declined' ? 'declined' : 'attending');
    setPrimaryMealId(guest.primaryMealOptionId || wedding.meals[0]?.id || '');
    setPrimaryDietary(guest.primaryDietaryRestrictions || '');
    setEmail(guest.email || '');
    setPhone(guest.phone || '');

    if (guest.plusOne) {
      setHasPlusOne(guest.plusOne.attending);
      setPlusOneName(guest.plusOne.fullName || '');
      setPlusOneMealId(guest.plusOne.mealOptionId || wedding.meals[0]?.id || '');
      setPlusOneDietary(guest.plusOne.dietaryRestrictions || '');
    } else if (guest.partySizeAllowed > 1) {
      setHasPlusOne(false);
      setPlusOneName('');
      setPlusOneMealId(wedding.meals[0]?.id || '');
      setPlusOneDietary('');
    }

    const allEventIds = wedding.schedule.map((s) => s.id);
    setSelectedEvents(guest.attendingEvents && guest.attendingEvents.length > 0 ? guest.attendingEvents : allEventIds);

    if (guest.songRequest) {
      setSongTitle(guest.songRequest.title);
      setSongArtist(guest.songRequest.artist);
    }
    if (guest.messageToCouple) {
      setMessage(guest.messageToCouple);
    }

    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const rsvpPayload = {
        guestId: selectedGuest.id,
        status,
        email,
        phone,
        primaryMealOptionId: status === 'attending' ? primaryMealId : undefined,
        primaryDietaryRestrictions: primaryDietary,
        plusOne:
          status === 'attending' && selectedGuest.partySizeAllowed > 1
            ? {
                attending: hasPlusOne,
                fullName: hasPlusOne ? plusOneName : undefined,
                mealOptionId: hasPlusOne ? plusOneMealId : undefined,
                dietaryRestrictions: hasPlusOne ? plusOneDietary : undefined,
              }
            : null,
        songRequest: songTitle ? { title: songTitle, artist: songArtist } : undefined,
        messageToCouple: message,
        attendingEvents: status === 'attending' ? selectedEvents : [],
      };

      await submitRsvp(rsvpPayload);
      setStep('success');
      if (status === 'attending') {
        triggerConfetti();
      }
      onRsvpSuccess();
    } catch (err) {
      console.error(err);
      setErrorMessage('Error al guardar el RSVP. Por favor verifica tu conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`Boda de ${wedding.coupleNames}`);
    const details = encodeURIComponent(`¡Te esperamos para celebrar en ${wedding.weddingLocation}!`);
    const location = encodeURIComponent(wedding.venueAddress);

    const startDate = parseWeddingDate(wedding.weddingDate);
    const endDate = new Date(startDate.getTime() + 8 * 3600 * 1000);


    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${toCalendarStamp(startDate)}/${toCalendarStamp(endDate)}&details=${details}&location=${location}`;
  };

  const downloadIcsFile = () => {
    const startDate = parseWeddingDate(wedding.weddingDate);
    const endDate = new Date(startDate.getTime() + 8 * 3600 * 1000);


    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Boda Angel y Krister//ES',
      'BEGIN:VEVENT',
      `SUMMARY:Boda de ${wedding.coupleNames}`,
      `DESCRIPTION:Celebración en ${wedding.weddingLocation}`,
      `LOCATION:${wedding.venueAddress}`,
      `DTSTART:${toCalendarStamp(startDate)}`,
      `DTEND:${toCalendarStamp(endDate)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Boda_${wedding.coupleNames.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B3F35]/50 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[#F7F3EC]/90 backdrop-blur-2xl border border-[#E5CFA3] rounded-[36px] shadow-2xl text-[#2A2A2A] overflow-hidden my-8 my-auto">
        {/* Header */}
        <div className="px-6 py-5 bg-white/70 backdrop-blur-md border-b border-[#E5CFA3] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#0F4C3A] border border-[#B98A2E]/50 flex items-center justify-center text-[#F7F3EC] shadow-xs">
              <Heart className="w-4 h-4 fill-[#D9B872]/40 text-[#D9B872]" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#0F4C3A] font-medium italic">Confirmación de Asistencia (RSVP)</h3>
              <p className="text-xs text-[#B98A2E] font-medium">{wedding.coupleNames}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white text-[#2A2A2A]/60 hover:text-[#0F4C3A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: LOAD INVITATION FROM PERSONAL LINK */}
          {step === 'lookup' && (
            <div className="py-6 text-center max-w-md mx-auto space-y-4">
              {lookup === 'loading' && (
                <>
                  <Sparkles className="w-8 h-8 text-[#B98A2E] mx-auto animate-pulse" />
                  <p className="text-sm text-[#2A2A2A]/80 font-light font-sans">Buscando tu invitación...</p>
                </>
              )}

              {lookup === 'covered' && coveredInvitation && (
                <>
                  <Heart className="w-8 h-8 text-[#B98A2E] fill-[#B98A2E]/20 mx-auto" />
                  <h4 className="font-serif text-2xl text-[#0F4C3A] font-medium italic">
                    ¡Hola, {coveredInvitation.primaryName}!
                  </h4>
                  <p className="text-sm text-[#2A2A2A]/80 font-light font-sans leading-relaxed">
                    Tu asistencia está incluida en la invitación de{' '}
                    <span className="text-[#0F4C3A] font-medium">{coveredInvitation.coveredByName}</span>, así que no
                    necesitas confirmar por separado. ¡Te esperamos!
                  </p>
                </>
              )}

              {(lookup === 'no-link' || lookup === 'not-found' || lookup === 'error') && (
                <>
                  <AlertCircle className="w-8 h-8 text-[#B98A2E] mx-auto" />
                  <h4 className="font-serif text-2xl text-[#0F4C3A] font-medium italic">
                    {lookup === 'no-link' ? 'Usa tu enlace personal' : 'No encontramos tu invitación'}
                  </h4>
                  <p className="text-sm text-[#2A2A2A]/80 font-light font-sans leading-relaxed">
                    {lookup === 'no-link' &&
                      'Para confirmar tu asistencia, abre el enlace personal que te enviamos junto con tu invitación.'}
                    {lookup === 'not-found' &&
                      'El enlace que usaste no parece ser válido. Por favor verifica que lo abriste completo o escríbenos para ayudarte.'}
                    {lookup === 'error' &&
                      'Hubo un problema al cargar tu invitación. Por favor revisa tu conexión e inténtalo de nuevo.'}
                  </p>
                </>
              )}
            </div>
          )}

          {/* STEP 2: RSVP FORM */}
          {step === 'form' && selectedGuest && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5CFA3]">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] block">Confirmación para</span>
                  <h4 className="font-serif text-2xl text-[#0F4C3A] font-medium italic">{selectedGuest.primaryName}</h4>
                </div>
              </div>

              {/* Attendance Choice */}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E]">
                  ¿Asistirás a la boda?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setStatus('attending')}
                    className={`p-4 rounded-2xl border flex items-center justify-center space-x-2 text-xs uppercase tracking-wider font-medium transition-all cursor-pointer ${
                      status === 'attending'
                        ? 'bg-[#0F4C3A] text-white border-[#0F4C3A] shadow-md'
                        : 'bg-white text-[#2A2A2A] border-[#E5CFA3] hover:bg-[#F7F3EC]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#D9B872]" />
                    <span>Acepto con Gusto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('declined')}
                    className={`p-4 rounded-2xl border flex items-center justify-center space-x-2 text-xs uppercase tracking-wider font-medium transition-all cursor-pointer ${
                      status === 'declined'
                        ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-md'
                        : 'bg-white text-[#2A2A2A] border-[#E5CFA3] hover:bg-[#F7F3EC]'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    <span>No Podré Asistir</span>
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.correo@ejemplo.com"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-sm font-medium text-[#0F4C3A] placeholder-[#2A2A2A]/40 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Teléfono (Opcional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+504 9966 6969"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-sm font-medium text-[#0F4C3A] placeholder-[#2A2A2A]/40 font-sans"
                  />
                </div>
              </div>

              {/* IF ATTENDING */}
              {status === 'attending' && (
                <div className="space-y-6 pt-2 border-t border-[#E5CFA3]">
                  {/* Plus One Section - ONLY if partySizeAllowed > 1 */}
                  {selectedGuest.partySizeAllowed > 1 ? (
                    <div className="p-4.5 rounded-2xl bg-white border border-[#E5CFA3] space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasPlusOne}
                            onChange={(e) => setHasPlusOne(e.target.checked)}
                            className="w-4 h-4 rounded border-[#E5CFA3] text-[#0F4C3A] focus:ring-[#0F4C3A]"
                          />
                          <span className="text-xs uppercase tracking-wider font-semibold text-[#0F4C3A]">Asistiré con Acompañante</span>
                        </label>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0F4C3A]/10 border border-[#0F4C3A]/20 text-[#0F4C3A] text-[10px] font-semibold uppercase tracking-wider">
                          Pase para 2 Personas
                        </span>
                      </div>

                      {hasPlusOne && (
                        <div className="pl-7 space-y-3 pt-2 border-t border-[#F7F3EC]">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E] mb-1">
                              Nombre Completo del Acompañante *
                            </label>
                            <input
                              type="text"
                              value={plusOneName}
                              onChange={(e) => setPlusOneName(e.target.value)}
                              placeholder="Ej. Carlos Mendoza"
                              className="w-full px-3.5 py-2.5 bg-[#F7F3EC] border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-sm font-medium text-[#0F4C3A] placeholder-[#2A2A2A]/40 font-sans"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E] mb-1">
                              Alergias o Restricciones del Acompañante
                            </label>
                            <input
                              type="text"
                              value={plusOneDietary}
                              onChange={(e) => setPlusOneDietary(e.target.value)}
                              placeholder="Ej. Alergia a frutos secos, vegetariano"
                              className="w-full px-3.5 py-2 bg-[#F7F3EC] border border-[#E5CFA3] focus:outline-none rounded-xl text-xs font-medium text-[#0F4C3A] placeholder-[#2A2A2A]/40 font-sans"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-[#F7F3EC] border border-[#E5CFA3] flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-[#0F4C3A]">
                        <span className="font-semibold uppercase tracking-wider text-[11px]">Pase Individual</span>
                        <span className="text-[#2A2A2A]/70">• Tu invitación es válida para 1 persona.</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-[#E5CFA3] text-[10px] text-[#B98A2E] font-medium">
                        1 Acceso
                      </span>
                    </div>
                  )}

                  {/* Dietary Restrictions / Allergies (Primary Guest) */}
                  <div className="p-4.5 rounded-2xl bg-white border border-[#E5CFA3] space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E]">
                      Restricciones Alimentarias o Alergias ({selectedGuest.primaryName})
                    </label>
                    <p className="text-[11px] text-[#2A2A2A]/70 font-light font-sans">
                      Indícanos si tienes alguna alergia, intolerancia o dieta especial (ej. Vegetariano, celiaco, alergia a mariscos).
                    </p>
                    <input
                      type="text"
                      value={primaryDietary}
                      onChange={(e) => setPrimaryDietary(e.target.value)}
                      placeholder="Ej. Ninguna / Celiaco / Alergia a nueces"
                      className="w-full px-4 py-2.5 bg-[#F7F3EC] border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-sm font-medium text-[#0F4C3A] placeholder-[#2A2A2A]/40 font-sans"
                    />
                  </div>

                  {/* Schedule Stages - Unified Single Event */}
                  <div className="p-4.5 rounded-2xl bg-white border border-[#E5CFA3] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E] block">
                          Programa de la Celebración (Evento Único)
                        </span>
                        <p className="text-[11px] text-[#2A2A2A]/70 font-light font-sans">
                          Tu confirmación abarca todas las etapas de nuestra gran fiesta:
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {wedding.schedule.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-[#F7F3EC] border border-[#E5CFA3] flex items-center space-x-3 text-xs"
                        >
                          <div className="w-2 h-2 rounded-full bg-[#0F4C3A] shrink-0" />
                          <div>
                            <span className="font-serif font-medium text-[#0F4C3A] italic block">{item.title}</span>
                            <span className="text-[10px] text-[#B98A2E] font-semibold font-sans block">{item.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Song Suggestions for DJ */}
                  {wedding.songRequestsEnabled && (
                    <div className="p-4.5 rounded-2xl bg-white border border-[#E5CFA3] space-y-3">
                      <div className="flex items-center space-x-2 text-[#0F4C3A]">
                        <Music className="w-4.5 h-4.5 text-[#B98A2E]" />
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#0F4C3A]">
                          Sugerencia de Música para el DJ
                        </span>
                      </div>
                      <p className="text-[11px] text-[#2A2A2A]/70 font-light font-sans">
                        ¿Qué canción no puede faltar para hacerte salir a la pista de baile?
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={songTitle}
                          onChange={(e) => setSongTitle(e.target.value)}
                          placeholder="Nombre de la canción"
                          className="px-3.5 py-2.5 bg-[#F7F3EC] border border-[#E5CFA3] focus:outline-none rounded-xl text-xs font-medium text-[#0F4C3A] placeholder-[#2A2A2A]/40 font-sans"
                        />
                        <input
                          type="text"
                          value={songArtist}
                          onChange={(e) => setSongArtist(e.target.value)}
                          placeholder="Artista / Grupo"
                          className="px-3.5 py-2.5 bg-[#F7F3EC] border border-[#E5CFA3] focus:outline-none rounded-xl text-xs font-medium text-[#0F4C3A] placeholder-[#2A2A2A]/40 font-sans"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Adults-only notice */}
              <div className="p-4 rounded-2xl bg-[#F7F3EC] border border-[#E5CFA3] flex items-start space-x-3">
                <Heart className="w-4 h-4 text-[#B98A2E] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-[#0F4C3A] block">
                    Celebración Solo para Adultos
                  </span>
                  <p className="text-xs text-[#2A2A2A]/80 font-light font-sans leading-relaxed">
                    Con todo cariño, les compartimos que hemos planeado nuestra boda como una celebración solo para adultos.
                    Agradecemos de corazón su comprensión y esperamos que esta noche sea una oportunidad para relajarse y
                    disfrutar con nosotros.
                  </p>
                </div>
              </div>

              {/* Message / Wishes */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">
                  Mensaje / Felicitaciones para {wedding.coupleNames}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="¡Déjanos un lindo mensaje o buenos deseos!"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-sm font-medium text-[#0F4C3A] placeholder-[#2A2A2A]/40 resize-none font-sans"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider text-[#2A2A2A]/70 hover:text-[#0F4C3A] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-full bg-[#0F4C3A] text-white font-medium text-xs uppercase tracking-[0.2em] transition-all cursor-pointer shadow-md hover:bg-[#0B3F35] disabled:opacity-50 active:scale-[0.98] border border-[#B98A2E]/40"
                >
                  {submitting ? 'Guardando...' : 'Confirmar & Enviar RSVP'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && selectedGuest && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#0F4C3A] border border-[#B98A2E] flex items-center justify-center text-[#F7F3EC] mx-auto shadow-md">
                <Sparkles className="w-8 h-8 text-[#D9B872]" />
              </div>

              <div className="space-y-2">
                <h4 className="font-serif text-3xl text-[#0F4C3A] font-medium italic">
                  {status === 'attending' ? '¡Nos Vemos en la Boda!' : 'Respuesta Registrada'}
                </h4>
                <p className="text-sm text-[#2A2A2A]/80 max-w-md mx-auto font-light font-sans">
                  {status === 'attending'
                    ? `¡Muchas gracias, ${selectedGuest.primaryName}! Tu asistencia ha sido confirmada. ¡Estamos ansiosos por celebrar juntos!`
                    : `Muchas gracias por avisarnos, ${selectedGuest.primaryName}. ¡Te extrañaremos mucho en nuestro gran día!`}
                </p>
              </div>

              {/* Firebase Confirmation Badge */}
              <div className="p-3 rounded-2xl bg-[#0F4C3A]/10 border border-[#0F4C3A]/30 text-[#0F4C3A] text-xs font-medium flex items-center justify-center space-x-2 max-w-md mx-auto">
                <CheckCircle2 className="w-4 h-4 text-[#0F4C3A]" />
                <span>Reserva guardada exitosamente en la base de datos</span>
              </div>

              {/* Summary Card */}
              {status === 'attending' && (
                <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] text-left space-y-3 text-xs shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5CFA3]">
                    <span className="font-serif font-medium text-[#0F4C3A] text-base italic">{selectedGuest.primaryName}</span>
                    <span className="px-2.5 py-1 rounded-full bg-[#0F4C3A]/10 border border-[#0F4C3A]/20 text-[#0F4C3A] text-[10px] font-medium uppercase tracking-wider">
                      ASISTENCIA CONFIRMADA
                    </span>
                  </div>

                  {hasPlusOne && (
                    <div className="text-[#2A2A2A]/80 font-sans">
                      <strong>Acompañante:</strong> {plusOneName || 'Invitado'}
                    </div>
                  )}

                  <div className="text-[#2A2A2A]/80 font-sans">
                    <strong>Fecha y Lugar:</strong> {formatWeddingDate(wedding.weddingDate)} en {wedding.weddingLocation}
                  </div>

                  {songTitle && (
                    <div className="text-[#2A2A2A]/80 font-sans">
                      <strong>Canción sugerida:</strong> "{songTitle}" de {songArtist || 'Artista'}
                    </div>
                  )}

                  {/* QR Digital Pass */}
                  <div className="mt-4 p-4 rounded-2xl bg-[#F7F3EC] border border-[#E5CFA3] flex flex-col items-center text-center space-y-2">
                    <div className="flex items-center space-x-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#B98A2E]">
                      <QrCode className="w-3.5 h-3.5 text-[#0F4C3A]" />
                      <span>Tu Pase Digital Personal</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-[#E5CFA3] shadow-xs">
                      <QRCodeSVG
                        value={getInviteUrl(selectedGuest.code)}
                        size={120}
                        fgColor="#0F4C3A"
                        bgColor="#FFFFFF"
                        level="M"
                      />
                    </div>
                    <div className="font-mono text-[11px] font-bold text-[#0F4C3A]">
                      Código: {selectedGuest.code}
                    </div>
                    <p className="text-[10px] text-[#2A2A2A]/70 font-light">
                      Guarda o toma una captura de pantalla de este código QR para tu acceso rápido el día del evento.
                    </p>
                  </div>
                </div>
              )}

              {/* Add to Calendar CTAs */}
              {status === 'attending' && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-3 rounded-full bg-white hover:bg-[#F7F3EC] text-[#0F4C3A] border border-[#E5CFA3] text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <Calendar className="w-4 h-4 text-[#B98A2E]" />
                    <span>Agregar a Google Calendar</span>
                  </a>

                  <button
                    onClick={downloadIcsFile}
                    className="w-full sm:w-auto px-5 py-3 rounded-full bg-white hover:bg-[#F7F3EC] text-[#0F4C3A] border border-[#E5CFA3] text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <Download className="w-4 h-4 text-[#B98A2E]" />
                    <span>Descargar iCal .ics</span>
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-[#E5CFA3] flex items-center justify-center space-x-4">
                <button
                  onClick={() => setStep('form')}
                  className="text-xs text-[#B98A2E] hover:text-[#0F4C3A] font-medium uppercase tracking-wider underline cursor-pointer"
                >
                  Editar Respuesta
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-full bg-[#0F4C3A] text-white font-medium text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md border border-[#B98A2E]/40"
                >
                  Cerrar Ventana
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

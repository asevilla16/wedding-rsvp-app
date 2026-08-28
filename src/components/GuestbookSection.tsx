import React, { useState } from 'react';
import { MessageSquareCode, Heart, Send } from 'lucide-react';
import { GuestbookWish } from '../types';
import { postGuestbookWish } from '../services/api';

interface GuestbookSectionProps {
  wishes: GuestbookWish[];
  onWishAdded: (updatedWishes: GuestbookWish[]) => void;
}

export const GuestbookSection: React.FC<GuestbookSectionProps> = ({ wishes, onWishAdded }) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const updated = await postGuestbookWish(name.trim(), message.trim());
      onWishAdded(updated);
      setName('');
      setMessage('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = (id: string) => {
    if (likedIds.includes(id)) return;
    setLikedIds([...likedIds, id]);
  };

  return (
    <section id="guestbook" className="py-20 relative text-[#2A2A2A]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-[#E5CFA3] text-[#B98A2E] text-[10px] uppercase tracking-[0.3em] font-medium mb-3 shadow-xs">
            <MessageSquareCode className="w-3.5 h-3.5 text-[#0F4C3A]" />
            <span>Libro de Visitas Digital</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#0F4C3A] font-medium mb-3 italic">
            Muro de Buenos Deseos
          </h2>
          <p className="text-[#2A2A2A]/80 text-sm font-light font-sans">
            ¡Déjanos un mensaje, recuerdo o bonitos deseos para nuestro matrimonio!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form Column */}
          <div className="lg:col-span-5 p-8 rounded-[36px] bg-white/70 backdrop-blur-2xl border border-[#E5CFA3] shadow-xl shadow-[#0F4C3A]/5 space-y-5 h-fit">
            <h3 className="font-serif text-2xl text-[#0F4C3A] font-medium italic">Escribe tu Mensaje</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-2">Nombre / Familia</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Tía María y Tío Pablo"
                  className="w-full px-4 py-3 bg-white border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-sm font-medium text-[#0F4C3A] placeholder-[#2A2A2A]/40 transition-all font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-2">Tus Deseos</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Escribe tus palabras con cariño..."
                  className="w-full px-4 py-3 bg-white border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-sm font-medium text-[#0F4C3A] placeholder-[#2A2A2A]/40 transition-all resize-none font-sans"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-full bg-[#0F4C3A] text-white font-medium text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-[#0B3F35] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 border border-[#B98A2E]/40"
              >
                <Send className="w-4 h-4 text-[#D9B872]" />
                <span>{submitting ? 'Publicando...' : 'Publicar en el Muro'}</span>
              </button>
            </form>
          </div>

          {/* Wall Column */}
          <div className="lg:col-span-7 space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {wishes.filter((w) => w.isPublic !== false).map((wish) => {
              const isLiked = likedIds.includes(wish.id);
              const likes = (wish.likesCount || 0) + (isLiked ? 1 : 0);

              return (
                <div
                  key={wish.id}
                  className="p-6 rounded-[28px] bg-white/70 backdrop-blur-2xl border border-[#E5CFA3] hover:bg-white/90 transition-all shadow-md shadow-[#0F4C3A]/5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#0F4C3A] text-[#F7F3EC] border border-[#B98A2E]/40 font-serif font-medium text-sm flex items-center justify-center shadow-xs">
                        {wish.guestName.charAt(0)}
                      </div>
                      <span className="font-serif text-lg text-[#0F4C3A] font-medium italic">{wish.guestName}</span>
                    </div>
                    <span className="text-[10px] text-[#B98A2E] uppercase tracking-widest font-medium">{wish.date}</span>
                  </div>

                  <p className="text-[#2A2A2A]/85 text-sm font-light font-sans leading-relaxed italic">
                    "{wish.message}"
                  </p>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleLike(wish.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer border ${
                        isLiked
                          ? 'bg-[#0F4C3A]/10 text-[#0F4C3A] border-[#0F4C3A]/30'
                          : 'bg-white text-[#2A2A2A]/70 border-[#E5CFA3] hover:bg-[#F7F3EC]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#0F4C3A] text-[#0F4C3A]' : 'text-[#B98A2E]'}`} />
                      <span>{likes}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState, useEffect } from 'react';
import { Camera, Heart, X, ChevronLeft, ChevronRight, Maximize2, Sparkles } from 'lucide-react';
import { GalleryPhoto } from '../types';

interface GallerySectionProps {
  photos?: GalleryPhoto[];
}

const DEFAULT_GALLERY_IMAGES: GalleryPhoto[] = [
  {
    id: 'img-1',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    caption: 'Angel & Krister en su sesión de compromiso al atardecer',
    category: 'novios',
    aspectRatio: 'aspect-[3/4]',
  },
  {
    id: 'img-2',
    url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    caption: 'Los hermosos jardines de Angeli Gardens iluminados',
    category: 'lugar',
    aspectRatio: 'aspect-[16/9]',
  },
  {
    id: 'img-3',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    caption: 'Detalle de los anillos y papelería nupcial',
    category: 'detalles',
    aspectRatio: 'aspect-square',
  },
  {
    id: 'img-4',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
    caption: 'Caminando juntos bajo los olivos centenarios',
    category: 'novios',
    aspectRatio: 'aspect-[4/5]',
  },
  {
    id: 'img-5',
    url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    caption: 'Arreglos florales y velas en tonos tierra y bosque',
    category: 'detalles',
    aspectRatio: 'aspect-[3/4]',
  },
  {
    id: 'img-6',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    caption: 'Brindis de celebración rodeados de olivos',
    category: 'momentos',
    aspectRatio: 'aspect-[16/10]',
  },
  {
    id: 'img-7',
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    caption: 'Un abrazo espontáneo lleno de alegría y amor',
    category: 'novios',
    aspectRatio: 'aspect-[3/4]',
  },
  {
    id: 'img-8',
    url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
    caption: 'Banquete al aire libre bajo luces cálidas',
    category: 'lugar',
    aspectRatio: 'aspect-square',
  },
  {
    id: 'img-9',
    url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200&q=80',
    caption: 'Detalle del vestido y ramo de flores silvestres',
    category: 'detalles',
    aspectRatio: 'aspect-[4/5]',
  },
];

export const GallerySection: React.FC<GallerySectionProps> = ({ photos }) => {
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [likedImages, setLikedImages] = useState<Record<string, boolean>>({});

  const displayPhotos = (photos && photos.length > 0) ? photos : DEFAULT_GALLERY_IMAGES;

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'novios', label: 'Los Novios' },
    { id: 'detalles', label: 'Detalles' },
    { id: 'lugar', label: 'El Lugar' },
    { id: 'momentos', label: 'Momentos' },
  ];

  const filteredImages =
    activeCategory === 'todos'
      ? displayPhotos
      : displayPhotos.filter((img) => img.category === activeCategory);

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(null);
  };

  const handleNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev! + 1) % filteredImages.length);
    }
  };

  const handlePrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev! - 1 + filteredImages.length) % filteredImages.length);
    }
  };

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLikedImages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') handleCloseLightbox();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredImages.length]);

  return (
    <section id="gallery" className="py-20 relative text-[#2A2A2A]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-[#E5CFA3] text-[#B98A2E] text-[10px] uppercase tracking-[0.3em] font-medium mb-3 shadow-xs">
            <Camera className="w-3.5 h-3.5 text-[#0F4C3A]" />
            <span>Fotografías & Recuerdos</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#0F4C3A] font-medium mb-3 italic">
            Galería de Momentos
          </h2>
          <p className="text-[#2A2A2A]/80 text-sm font-light font-sans">
            Una colección de nuestros instantes favoritos preparando este día tan especial.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center items-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-xs font-medium uppercase tracking-widest transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#0F4C3A] text-[#F7F3EC] shadow-md border border-[#B98A2E]/50'
                  : 'bg-white/60 hover:bg-white text-[#2A2A2A]/80 border border-[#E5CFA3]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Masonry Layout Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredImages.map((img, idx) => {
            const isLiked = likedImages[img.id];
            return (
              <div
                key={img.id}
                onClick={() => handleOpenLightbox(idx)}
                className="break-inside-avoid rounded-[28px] overflow-hidden border border-[#E5CFA3] bg-white/70 backdrop-blur-xl shadow-xl shadow-[#0F4C3A]/5 hover:shadow-2xl transition-all duration-300 group relative cursor-pointer"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.caption}
                    loading="lazy"
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B3F35]/80 via-[#0B3F35]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5 text-white">
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => toggleLike(e, img.id)}
                        className={`p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                          isLiked ? 'bg-rose-500 text-white' : 'bg-black/30 hover:bg-black/50 text-white/90'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#D9B872] block">
                        {img.category}
                      </span>
                      <p className="font-serif italic text-sm text-white/95 leading-snug">
                        {img.caption}
                      </p>
                      <div className="pt-2 flex items-center space-x-1 text-[10px] text-white/70 uppercase tracking-widest font-sans">
                        <Maximize2 className="w-3 h-3 text-[#D9B872]" />
                        <span>Ver en alta resolución</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lightbox Modal */}
        {lightboxIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B3F35]/85 backdrop-blur-md animate-in fade-in duration-200">
            {/* Close Button */}
            <button
              onClick={handleCloseLightbox}
              className="absolute top-5 right-5 z-50 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all cursor-pointer border border-white/20"
              title="Cerrar (Esc)"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Nav Left */}
            <button
              onClick={handlePrev}
              className="absolute left-4 sm:left-8 z-50 p-3.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all cursor-pointer border border-white/20"
              title="Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Nav Right */}
            <button
              onClick={handleNext}
              className="absolute right-4 sm:right-8 z-50 p-3.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all cursor-pointer border border-white/20"
              title="Siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image Container */}
            <div className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center space-y-4 px-4">
              <div className="relative rounded-[32px] overflow-hidden border border-[#E5CFA3]/60 shadow-2xl bg-black/50 max-h-[70vh]">
                <img
                  src={filteredImages[lightboxIndex].url}
                  alt={filteredImages[lightboxIndex].caption}
                  className="max-h-[70vh] w-auto max-w-full object-contain mx-auto"
                />
              </div>

              {/* Caption Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#E5CFA3] text-center max-w-lg w-full shadow-xl space-y-1">
                <div className="flex items-center justify-center space-x-2 text-[10px] font-semibold text-[#B98A2E] uppercase tracking-widest">
                  <Sparkles className="w-3 h-3 text-[#0F4C3A]" />
                  <span>
                    {lightboxIndex + 1} de {filteredImages.length}
                  </span>
                </div>
                <p className="font-serif text-base sm:text-lg text-[#0F4C3A] font-medium italic">
                  {filteredImages[lightboxIndex].caption}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

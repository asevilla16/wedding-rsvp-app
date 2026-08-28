import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, RefreshCw } from 'lucide-react';
import { askAiConcierge } from '../services/api';

interface AiConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleNames: string;
}

export const AiConciergeModal: React.FC<AiConciergeModalProps> = ({ isOpen, onClose, coupleNames }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: `¡Hola! Soy el Concierge Virtual de la boda de ${coupleNames}. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre el itinerario, código de vestimenta, hotel, o pedirme ayuda para redactar un lindo brindis o mensaje.`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'qa' | 'toast_generator'>('qa');

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userText = prompt.trim();
    setPrompt('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const responseText = await askAiConcierge(userText, mode);
      setMessages((prev) => [...prev, { sender: 'ai', text: responseText }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `¡Nos llena de alegría celebrar este día tan especial con ${coupleNames}! Puedes revisar el itinerario o la sección de ubicación para más detalles.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "¿Cuál es el código de vestimenta?",
    "¿Dónde y a qué hora es la ceremonia?",
    "¿Tienen recomendaciones de hoteles con descuento?",
    "¡Ayúdame a escribir un brindis emotivo para Angel y Krister!",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B3F35]/40 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-[#F7F3EC] border border-[#E5CFA3] rounded-[36px] shadow-2xl text-[#2A2A2A] overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white/80 border-b border-[#E5CFA3] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-[#0F4C3A] border border-[#B98A2E]/50 flex items-center justify-center text-[#F7F3EC] shadow-xs">
              <Sparkles className="w-5 h-5 text-[#D9B872]" />
            </div>
            <div>
              <h3 className="font-serif text-base text-[#0F4C3A] font-medium italic">Concierge IA de la Boda</h3>
              <p className="text-[11px] text-[#B98A2E] font-medium">Preguntas Frecuentes & Creador de Brindis</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white text-[#2A2A2A]/60 hover:text-[#0F4C3A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-2 bg-white/60 border-b border-[#E5CFA3] flex justify-center space-x-2">
          <button
            onClick={() => setMode('qa')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'qa'
                ? 'bg-[#0F4C3A] text-white shadow-xs border border-[#0F4C3A]'
                : 'text-[#2A2A2A]/80 hover:text-[#0F4C3A] hover:bg-white'
            }`}
          >
            Preguntas de la Boda
          </button>
          <button
            onClick={() => setMode('toast_generator')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'toast_generator'
                ? 'bg-[#0F4C3A] text-white shadow-xs border border-[#0F4C3A]'
                : 'text-[#2A2A2A]/80 hover:text-[#0F4C3A] hover:bg-white'
            }`}
          >
            ✨ Asistente de Brindis
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2 ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-[#0F4C3A] border border-[#B98A2E]/50 text-[#D9B872] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#0F4C3A] text-white font-medium rounded-tr-none shadow-xs'
                    : 'bg-white border border-[#E5CFA3] text-[#2A2A2A] rounded-tl-none font-light shadow-2xs'
                }`}
              >
                {m.text}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-[#E5CFA3] text-[#0F4C3A] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-[#B98A2E] text-xs pl-9">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0F4C3A]" />
              <span className="font-light">Consultando...</span>
            </div>
          )}
        </div>

        {/* Sample Suggestions */}
        <div className="px-4 py-2 bg-white/50 border-t border-[#E5CFA3] flex overflow-x-auto space-x-2 text-[11px] font-medium no-scrollbar">
          {samplePrompts.map((sp, i) => (
            <button
              key={i}
              onClick={() => {
                setPrompt(sp);
              }}
              className="px-3 py-1 rounded-full bg-white border border-[#E5CFA3] hover:border-[#0F4C3A] text-[#2A2A2A]/80 shrink-0 transition-all cursor-pointer shadow-2xs font-sans"
            >
              {sp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white/80 border-t border-[#E5CFA3] flex items-center space-x-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'toast_generator'
                ? 'Pide ayuda para un brindis, ej. "Escribe un mensaje de 3 líneas..."'
                : 'Escribe tu duda sobre la boda...'
            }
            className="flex-1 px-4 py-2.5 bg-white border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-full text-xs sm:text-sm text-[#0F4C3A] placeholder-[#2A2A2A]/40 font-sans"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="p-2.5 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] disabled:opacity-50 text-white transition-all cursor-pointer shadow-sm border border-[#B98A2E]/40"
          >
            <Send className="w-4 h-4 text-[#D9B872]" />
          </button>
        </form>
      </div>
    </div>
  );
};

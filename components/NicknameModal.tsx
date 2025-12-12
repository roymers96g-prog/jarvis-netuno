import React, { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';

interface NicknameModalProps {
  isOpen: boolean;
  onSave: (name: string) => void;
}

export const NicknameModal: React.FC<NicknameModalProps> = ({ isOpen, onSave }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length > 0) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm glass-panel border dark:border-cyan-500/30 border-cyan-500/30 rounded-3xl p-8 shadow-2xl animate-slideUp relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <User size={40} className="text-white" />
          </div>
          
          <h2 className="text-2xl font-bold dark:text-white text-slate-800 mb-2 tracking-wide">IDENTIFICACIÓN</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
            Para configurar tu asistente Jarvis, por favor ingresa cómo te gustaría ser llamado.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Tony Stark"
                className="w-full bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-white/20 rounded-xl px-4 py-4 text-center font-bold text-lg dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                autoFocus
              />
            </div>
            
            <button 
              type="submit"
              disabled={!name.trim()}
              className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              INICIAR SISTEMA
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
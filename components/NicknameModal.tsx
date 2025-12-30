
import React, { useState } from 'react';
import { User, ArrowRight, HardHat, Cpu } from 'lucide-react';
import { UserProfile } from '../types';

interface NicknameModalProps {
  isOpen: boolean;
  onSave: (name: string, profile: UserProfile) => void;
}

export const NicknameModal: React.FC<NicknameModalProps> = ({ isOpen, onSave }) => {
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length > 0 && profile) {
      onSave(name.trim(), profile);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md glass-panel border dark:border-cyan-500/30 border-cyan-500/30 rounded-3xl p-8 shadow-2xl animate-slideUp relative overflow-hidden">
        
        <div className="absolute top-[-20%] left-[-20%] w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <User size={32} className="text-white" />
          </div>
          
          <h2 className="text-2xl font-bold dark:text-white text-slate-800 mb-2 tracking-wide">IDENTIFICACIÓN</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
            Configura tu terminal Jarvis.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="space-y-2">
               <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-500">1. Nombre del Técnico</label>
               <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Tony Stark"
                className="w-full bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-white/20 rounded-xl px-4 py-3 text-center font-bold text-lg dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-500">2. Módulo de Operación</label>
              <div className="grid grid-cols-2 gap-3">
                 <button
                   type="button"
                   onClick={() => setProfile('INSTALLER')}
                   className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${profile === 'INSTALLER' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-600 dark:text-white' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                 >
                    <HardHat size={24} className={profile === 'INSTALLER' ? 'text-cyan-500' : 'text-slate-400'} />
                    <span className="text-xs font-bold uppercase">Instalador</span>
                 </button>

                 <button
                   type="button"
                   onClick={() => setProfile('TECHNICIAN')}
                   className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${profile === 'TECHNICIAN' ? 'bg-violet-500/20 border-violet-500 text-violet-600 dark:text-white' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                 >
                    <Cpu size={24} className={profile === 'TECHNICIAN' ? 'text-violet-500' : 'text-slate-400'} />
                    <span className="text-xs font-bold uppercase">Srv Técnico</span>
                 </button>
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={!name.trim() || !profile}
              className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-4"
            >
              INICIAR PROTOCOLO
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

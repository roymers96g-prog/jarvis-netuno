import React from 'react';
import { InstallType } from '../types';
import { Home, Briefcase, MapPin, Zap } from 'lucide-react';

interface QuickWidgetProps {
  onQuickAdd: (type: InstallType) => void;
  isOpen: boolean;
  onClose: () => void;
  prices: { [key in InstallType]: number };
}

export const QuickWidget: React.FC<QuickWidgetProps> = ({ onQuickAdd, isOpen, onClose, prices }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      {/* 
         DARK MODE FIX: Changed dark:bg-slate-800 to dark:bg-zinc-950 (Elegant Black) 
         LIGHT MODE FIX: Changed bg-white/95 to bg-blue-50/95 (Classic Blue Tint)
      */}
      <div className="w-full max-w-sm dark:bg-zinc-950 bg-blue-50/95 border dark:border-zinc-800 border-white/50 rounded-3xl p-6 shadow-2xl animate-scaleIn transform transition-all relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Decorative background blob for light mode to enhance "Classic Blue" feel */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none dark:opacity-0" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="text-xl font-bold dark:text-white text-slate-900 tracking-widest flex items-center gap-2">
            <Zap className="text-yellow-400" fill="currentColor" /> ACCESO RÁPIDO
          </h3>
          <button onClick={onClose} className="dark:text-zinc-500 text-slate-500 hover:text-cyan-500 font-medium text-sm">Cerrar</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {/* Residencial Button */}
          <button 
            onClick={() => onQuickAdd(InstallType.RESIDENTIAL)}
            className="group relative flex flex-col items-center justify-center p-6 dark:bg-zinc-900 bg-white border-2 dark:border-zinc-800 border-cyan-100 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-zinc-800/80 rounded-2xl transition-all active:scale-95 shadow-sm"
          >
            <Home size={32} className="text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-lg font-bold dark:text-zinc-100 text-slate-800">Residencial</span>
            <span className="text-sm text-cyan-500 dark:text-cyan-300 font-mono">${prices[InstallType.RESIDENTIAL]}</span>
          </button>

          {/* Corporativo Button */}
          <button 
            onClick={() => onQuickAdd(InstallType.CORPORATE)}
            className="group relative flex flex-col items-center justify-center p-6 dark:bg-zinc-900 bg-white border-2 dark:border-zinc-800 border-violet-100 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-zinc-800/80 rounded-2xl transition-all active:scale-95 shadow-sm"
          >
            <Briefcase size={32} className="text-violet-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-lg font-bold dark:text-zinc-100 text-slate-800">Corporativo</span>
            <span className="text-sm text-violet-500 dark:text-violet-300 font-mono">${prices[InstallType.CORPORATE]}</span>
          </button>

          {/* Poste Button */}
          <button 
            onClick={() => onQuickAdd(InstallType.POSTE)}
            className="group relative flex flex-col items-center justify-center p-6 dark:bg-zinc-900 bg-white border-2 dark:border-zinc-800 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-zinc-800/80 rounded-2xl transition-all col-span-2 active:scale-95 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <MapPin size={32} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <span className="block text-lg font-bold dark:text-zinc-100 text-slate-800">Instalación Poste</span>
                <span className="block text-sm text-emerald-500 dark:text-emerald-300 font-mono">${prices[InstallType.POSTE]}</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
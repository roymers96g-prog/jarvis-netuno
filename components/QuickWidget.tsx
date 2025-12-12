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
      <div className="w-full max-w-sm dark:bg-slate-800/90 bg-white/95 border dark:border-slate-600 border-slate-200 rounded-3xl p-6 shadow-2xl transform transition-all scale-100" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold dark:text-white text-slate-900 tracking-widest flex items-center gap-2">
            <Zap className="text-yellow-400" fill="currentColor" /> ACCESO RÁPIDO
          </h3>
          <button onClick={onClose} className="dark:text-slate-400 text-slate-500 hover:text-cyan-500">Cerrar</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Residencial Button */}
          <button 
            onClick={() => onQuickAdd(InstallType.RESIDENTIAL)}
            className="group relative flex flex-col items-center justify-center p-6 dark:bg-cyan-900/20 bg-cyan-50 border-2 dark:border-cyan-500/30 border-cyan-200 hover:border-cyan-400 hover:bg-cyan-100/50 dark:hover:bg-cyan-500/10 rounded-2xl transition-all active:scale-95"
          >
            <Home size={32} className="text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-lg font-bold dark:text-white text-slate-800">Residencial</span>
            <span className="text-sm text-cyan-500 dark:text-cyan-300 font-mono">${prices[InstallType.RESIDENTIAL]}</span>
          </button>

          {/* Corporativo Button */}
          <button 
            onClick={() => onQuickAdd(InstallType.CORPORATE)}
            className="group relative flex flex-col items-center justify-center p-6 dark:bg-violet-900/20 bg-violet-50 border-2 dark:border-violet-500/30 border-violet-200 hover:border-violet-400 hover:bg-violet-100/50 dark:hover:bg-violet-500/10 rounded-2xl transition-all active:scale-95"
          >
            <Briefcase size={32} className="text-violet-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-lg font-bold dark:text-white text-slate-800">Corporativo</span>
            <span className="text-sm text-violet-500 dark:text-violet-300 font-mono">${prices[InstallType.CORPORATE]}</span>
          </button>

          {/* Poste Button */}
          <button 
            onClick={() => onQuickAdd(InstallType.POSTE)}
            className="group relative flex flex-col items-center justify-center p-6 dark:bg-emerald-900/20 bg-emerald-50 border-2 dark:border-emerald-500/30 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-500/10 rounded-2xl transition-all col-span-2 active:scale-95"
          >
            <div className="flex items-center gap-4">
              <MapPin size={32} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <span className="block text-lg font-bold dark:text-white text-slate-800">Instalación Poste</span>
                <span className="block text-sm text-emerald-500 dark:text-emerald-300 font-mono">${prices[InstallType.POSTE]}</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
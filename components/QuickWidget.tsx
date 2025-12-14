import React, { useState } from 'react';
import { InstallType } from '../types';
import { Home, Briefcase, MapPin, Zap, Check, Wrench } from 'lucide-react';

interface QuickWidgetProps {
  onQuickAdd: (type: InstallType) => void;
  isOpen: boolean;
  onClose: () => void;
  prices: { [key in InstallType]: number };
}

export const QuickWidget: React.FC<QuickWidgetProps> = ({ onQuickAdd, isOpen, onClose, prices }) => {
  const [clickedType, setClickedType] = useState<InstallType | null>(null);

  if (!isOpen) return null;

  const handlePress = (type: InstallType) => {
    // Haptic Feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setClickedType(type);
    
    setTimeout(() => {
      onQuickAdd(type);
      setClickedType(null);
    }, 400);
  };

  const getButtonClass = (type: InstallType, baseBorder: string, hoverBorder: string, hoverBg: string, activeBg: string) => {
    const isClicked = clickedType === type;
    if (isClicked) {
      return `${activeBg} scale-95 border-transparent shadow-inner transition-all duration-200`;
    }
    return `dark:bg-zinc-900 bg-white border-2 dark:border-zinc-800 ${baseBorder} ${hoverBorder} ${hoverBg} dark:hover:bg-zinc-800/80 hover:scale-[1.02] active:scale-95 transition-all shadow-sm`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-sm dark:bg-zinc-950 bg-blue-50/95 border dark:border-zinc-800 border-white/50 rounded-3xl p-6 shadow-2xl animate-scaleIn transform transition-all relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none dark:opacity-0" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="text-xl font-bold dark:text-white text-slate-900 tracking-widest flex items-center gap-2">
            <Zap className="text-yellow-400" fill="currentColor" /> ACCESO RÁPIDO
          </h3>
          <button onClick={onClose} className="dark:text-zinc-500 text-slate-500 hover:text-cyan-500 font-medium text-sm">Cerrar</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <button 
            onClick={() => handlePress(InstallType.RESIDENTIAL)}
            disabled={!!clickedType}
            className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(
              InstallType.RESIDENTIAL, 
              'border-cyan-100', 
              'hover:border-cyan-400', 
              'hover:bg-cyan-50',
              'bg-cyan-500 text-white dark:bg-cyan-600'
            )}`}
          >
            {clickedType === InstallType.RESIDENTIAL ? <Check size={32} className="text-white animate-scaleIn" strokeWidth={3} /> : <Home size={32} className="text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />}
            <span className={`text-lg font-bold ${clickedType === InstallType.RESIDENTIAL ? 'text-white' : 'dark:text-zinc-100 text-slate-800'}`}>Residencial</span>
            {!clickedType && <span className="text-sm text-cyan-500 dark:text-cyan-300 font-mono">${prices[InstallType.RESIDENTIAL]}</span>}
          </button>

          <button 
            onClick={() => handlePress(InstallType.CORPORATE)}
            disabled={!!clickedType}
            className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(
              InstallType.CORPORATE,
              'border-violet-100',
              'hover:border-violet-400',
              'hover:bg-violet-50',
              'bg-violet-500 text-white dark:bg-violet-600'
            )}`}
          >
            {clickedType === InstallType.CORPORATE ? <Check size={32} className="text-white animate-scaleIn" strokeWidth={3} /> : <Briefcase size={32} className="text-violet-400 mb-2 group-hover:scale-110 transition-transform" />}
            <span className={`text-lg font-bold ${clickedType === InstallType.CORPORATE ? 'text-white' : 'dark:text-zinc-100 text-slate-800'}`}>Corporativo</span>
            {!clickedType && <span className="text-sm text-violet-500 dark:text-violet-300 font-mono">${prices[InstallType.CORPORATE]}</span>}
          </button>
          
          <button 
            onClick={() => handlePress(InstallType.POSTE)}
            disabled={!!clickedType}
            className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(
              InstallType.POSTE,
              'border-emerald-100',
              'hover:border-emerald-400',
              'hover:bg-emerald-50',
              'bg-emerald-500 text-white dark:bg-emerald-600'
            )}`}
          >
            {clickedType === InstallType.POSTE ? <Check size={32} className="text-white animate-scaleIn" strokeWidth={3} /> : <MapPin size={32} className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />}
            <span className={`text-lg font-bold ${clickedType === InstallType.POSTE ? 'text-white' : 'dark:text-zinc-100 text-slate-800'}`}>Poste</span>
            {!clickedType && <span className="text-sm text-emerald-500 dark:text-emerald-300 font-mono">${prices[InstallType.POSTE]}</span>}
          </button>

          <button 
            onClick={() => handlePress(InstallType.SERVICE)}
            disabled={!!clickedType}
            className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(
              InstallType.SERVICE,
              'border-amber-100',
              'hover:border-amber-400',
              'hover:bg-amber-50',
              'bg-amber-500 text-white dark:bg-amber-600'
            )}`}
          >
            {clickedType === InstallType.SERVICE ? <Check size={32} className="text-white animate-scaleIn" strokeWidth={3} /> : <Wrench size={32} className="text-amber-400 mb-2 group-hover:scale-110 transition-transform" />}
            <span className={`text-lg font-bold ${clickedType === InstallType.SERVICE ? 'text-white' : 'dark:text-zinc-100 text-slate-800'}`}>Servicio</span>
            {!clickedType && <span className="text-sm text-amber-500 dark:text-amber-300 font-mono">${prices[InstallType.SERVICE]}</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { InstallType } from '../types';
import { Router, Server, Cable, Zap, Check, TabletSmartphone, ArrowLeftRight, Database, Wifi } from 'lucide-react';
import { getSettings } from '../services/settingsService';

interface QuickWidgetProps {
  onQuickAdd: (type: InstallType) => void;
  isOpen: boolean;
  onClose: () => void;
  prices: { [key in InstallType]: number };
}

export const QuickWidget: React.FC<QuickWidgetProps> = ({ onQuickAdd, isOpen, onClose, prices }) => {
  const [clickedType, setClickedType] = useState<InstallType | null>(null);
  const settings = getSettings();
  const isTechnician = settings.profile === 'TECHNICIAN';

  if (!isOpen) return null;

  const handlePress = (type: InstallType) => {
    // Haptic Feedback
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

  const renderInstallerButtons = () => (
    <>
      <button 
        onClick={() => handlePress(InstallType.RESIDENTIAL)}
        disabled={!!clickedType}
        className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(
          InstallType.RESIDENTIAL, 'border-cyan-100', 'hover:border-cyan-400', 'hover:bg-cyan-50', 'bg-cyan-500 text-white dark:bg-cyan-600'
        )}`}
      >
        {clickedType === InstallType.RESIDENTIAL ? <Check size={32} className="text-white animate-scaleIn" strokeWidth={3} /> : <Router size={32} className="text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />}
        <span className={`text-lg font-bold ${clickedType === InstallType.RESIDENTIAL ? 'text-white' : 'dark:text-zinc-100 text-slate-800'}`}>Residencial</span>
        {!clickedType && <span className="text-sm text-cyan-500 dark:text-cyan-300 font-mono">${prices[InstallType.RESIDENTIAL]}</span>}
      </button>

      <button 
        onClick={() => handlePress(InstallType.CORPORATE)}
        disabled={!!clickedType}
        className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(
          InstallType.CORPORATE, 'border-violet-100', 'hover:border-violet-400', 'hover:bg-violet-50', 'bg-violet-500 text-white dark:bg-violet-600'
        )}`}
      >
        {clickedType === InstallType.CORPORATE ? <Check size={32} className="text-white animate-scaleIn" strokeWidth={3} /> : <Server size={32} className="text-violet-400 mb-2 group-hover:scale-110 transition-transform" />}
        <span className={`text-lg font-bold ${clickedType === InstallType.CORPORATE ? 'text-white' : 'dark:text-zinc-100 text-slate-800'}`}>Corporativo</span>
        {!clickedType && <span className="text-sm text-violet-500 dark:text-violet-300 font-mono">${prices[InstallType.CORPORATE]}</span>}
      </button>
      
      <button 
        onClick={() => handlePress(InstallType.POSTE)}
        disabled={!!clickedType}
        className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(
          InstallType.POSTE, 'border-emerald-100', 'hover:border-emerald-400', 'hover:bg-emerald-50', 'bg-emerald-500 text-white dark:bg-emerald-600'
        )}`}
      >
        {clickedType === InstallType.POSTE ? <Check size={32} className="text-white animate-scaleIn" strokeWidth={3} /> : <Cable size={32} className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />}
        <span className={`text-lg font-bold ${clickedType === InstallType.POSTE ? 'text-white' : 'dark:text-zinc-100 text-slate-800'}`}>Poste</span>
        {!clickedType && <span className="text-sm text-emerald-500 dark:text-emerald-300 font-mono">${prices[InstallType.POSTE]}</span>}
      </button>

      <button 
        onClick={() => handlePress(InstallType.SERVICE)}
        disabled={!!clickedType}
        className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(
          InstallType.SERVICE, 'border-slate-100', 'hover:border-slate-400', 'hover:bg-slate-50', 'bg-slate-500 text-white dark:bg-slate-600'
        )}`}
      >
        {clickedType === InstallType.SERVICE ? <Check size={32} className="text-white animate-scaleIn" strokeWidth={3} /> : <TabletSmartphone size={32} className="text-slate-400 mb-2 group-hover:scale-110 transition-transform" />}
        <span className={`text-lg font-bold ${clickedType === InstallType.SERVICE ? 'text-white' : 'dark:text-zinc-100 text-slate-800'}`}>Srv. Gral</span>
        {!clickedType && <span className="text-sm text-slate-500 dark:text-slate-300 font-mono">${prices[InstallType.SERVICE]}</span>}
      </button>
    </>
  );

  const renderTechnicianButtons = () => (
    <>
      <button 
        onClick={() => handlePress(InstallType.SERVICE_BASIC)}
        disabled={!!clickedType}
        className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(
          InstallType.SERVICE_BASIC, 'border-orange-100', 'hover:border-orange-400', 'hover:bg-orange-50', 'bg-orange-500 text-white dark:bg-orange-600'
        )}`}
      >
        {clickedType === InstallType.SERVICE_BASIC ? <Check size={32} className="text-white animate-scaleIn" strokeWidth={3} /> : <Wifi size={32} className="text-orange-400 mb-2 group-hover:scale-110 transition-transform" />}
        <span className={`text-lg font-bold ${clickedType === InstallType.SERVICE_BASIC ? 'text-white' : 'dark:text-zinc-100 text-slate-800'}`}>Srv. Básico</span>
        {!clickedType && <span className="text-sm text-orange-500 dark:text-orange-300 font-mono">${prices[InstallType.SERVICE_BASIC]}</span>}
      </button>

      <button 
        onClick={() => handlePress(InstallType.SERVICE_REWIRING)}
        disabled={!!clickedType}
        className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(
          InstallType.SERVICE_REWIRING, 'border-pink-100', 'hover:border-pink-400', 'hover:bg-pink-50', 'bg-pink-500 text-white dark:bg-pink-600'
        )}`}
      >
        {clickedType === InstallType.SERVICE_REWIRING ? <Check size={32} className="text-white animate-scaleIn" strokeWidth={3} /> : <ArrowLeftRight size={32} className="text-pink-400 mb-2 group-hover:scale-110 transition-transform" />}
        <span className={`text-lg font-bold leading-tight text-center ${clickedType === InstallType.SERVICE_REWIRING ? 'text-white' : 'dark:text-zinc-100 text-slate-800'}`}>Recableado / Mudanza</span>
        {!clickedType && <span className="text-sm text-pink-500 dark:text-pink-300 font-mono mt-1">${prices[InstallType.SERVICE_REWIRING]}</span>}
      </button>
      
      <button 
        onClick={() => handlePress(InstallType.SERVICE_CORP)}
        disabled={!!clickedType}
        className={`col-span-2 group relative flex flex-row items-center justify-between px-8 py-6 rounded-2xl ${getButtonClass(
          InstallType.SERVICE_CORP, 'border-indigo-100', 'hover:border-indigo-400', 'hover:bg-indigo-50', 'bg-indigo-500 text-white dark:bg-indigo-600'
        )}`}
      >
        <div className="flex items-center gap-4">
           {clickedType === InstallType.SERVICE_CORP ? <Check size={32} className="text-white animate-scaleIn" strokeWidth={3} /> : <Database size={32} className="text-indigo-400 group-hover:scale-110 transition-transform" />}
           <span className={`text-lg font-bold ${clickedType === InstallType.SERVICE_CORP ? 'text-white' : 'dark:text-zinc-100 text-slate-800'}`}>Servicio Corporativo</span>
        </div>
        {!clickedType && <span className="text-lg text-indigo-500 dark:text-indigo-300 font-mono font-bold">${prices[InstallType.SERVICE_CORP]}</span>}
      </button>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-sm dark:bg-zinc-950 bg-blue-50/95 border dark:border-zinc-800 border-white/50 rounded-3xl p-6 shadow-2xl animate-scaleIn transform transition-all relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none dark:opacity-0" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="text-xl font-bold dark:text-white text-slate-900 tracking-widest flex items-center gap-2">
            <Zap className="text-yellow-400" fill="currentColor" /> {isTechnician ? 'TÉCNICO' : 'INSTALADOR'}
          </h3>
          <button onClick={onClose} className="dark:text-zinc-500 text-slate-500 hover:text-cyan-500 font-medium text-sm">Cerrar</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {isTechnician ? renderTechnicianButtons() : renderInstallerButtons()}
        </div>
      </div>
    </div>
  );
};

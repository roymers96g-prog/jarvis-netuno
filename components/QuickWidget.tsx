
import React, { useState, useEffect } from 'react';
import { InstallType } from '../types';
import { Router, Server, Cable, Zap, Check, TabletSmartphone, ArrowLeftRight, Database, Wifi, Calendar, Layers, Plus, Minus, ChevronLeft, Save } from 'lucide-react';
import { getSettings } from '../services/settingsService';
import { LABELS, COLORS } from '../constants';

interface QuickWidgetProps {
  onQuickAdd: (type: InstallType, quantity?: number, date?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  prices: { [key in InstallType]: number };
}

export const QuickWidget: React.FC<QuickWidgetProps> = ({ onQuickAdd, isOpen, onClose, prices }) => {
  const [mode, setMode] = useState<'quick' | 'batch'>('quick');
  const [clickedType, setClickedType] = useState<InstallType | null>(null);
  const settings = getSettings();
  const isTechnician = settings.profile === 'TECHNICIAN';

  // Batch Mode State
  const [batchType, setBatchType] = useState<InstallType | null>(null);
  const [batchQty, setBatchQty] = useState(1);
  const [batchDate, setBatchDate] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
        const today = new Date().toISOString().split('T')[0];
        setBatchDate(today);
        setMode('quick');
        setBatchQty(1);
        setBatchType(null);
    }
  }, [isOpen]);

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

  const handleBatchSubmit = () => {
      if (!batchType) return;
      onQuickAdd(batchType, batchQty, batchDate);
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

  const availableTypes = isTechnician 
    ? [InstallType.SERVICE_BASIC, InstallType.SERVICE_REWIRING, InstallType.SERVICE_CORP]
    : [InstallType.RESIDENTIAL, InstallType.CORPORATE, InstallType.POSTE, InstallType.SERVICE];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-sm dark:bg-zinc-950 bg-blue-50/95 border dark:border-zinc-800 border-white/50 rounded-3xl p-6 shadow-2xl animate-scaleIn transform transition-all relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none dark:opacity-0" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="text-xl font-bold dark:text-white text-slate-900 tracking-widest flex items-center gap-2">
            {mode === 'batch' && <button onClick={() => setMode('quick')} className="mr-1 hover:text-cyan-500"><ChevronLeft size={24} /></button>}
            <Zap className="text-yellow-400" fill="currentColor" /> 
            {mode === 'batch' ? 'MANUAL / LOTES' : (isTechnician ? 'TÉCNICO FTTH' : 'INSTALADOR FTTH')}
          </h3>
          <button onClick={onClose} className="dark:text-zinc-500 text-slate-500 hover:text-cyan-500 font-medium text-sm">Cerrar</button>
        </div>
        
        {mode === 'quick' ? (
            <>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                {isTechnician ? renderTechnicianButtons() : renderInstallerButtons()}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 relative z-10">
                    <button 
                        onClick={() => setMode('batch')}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-200 dark:bg-zinc-800/50 hover:bg-slate-300 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold transition-colors"
                    >
                        <Layers size={18} />
                        Carga por Lotes / Personalizada
                    </button>
                </div>
            </>
        ) : (
            <div className="space-y-5 relative z-10 animate-slideUp">
                {/* 1. Select Type */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">1. Tipo de Trabajo</label>
                    <div className="grid grid-cols-2 gap-2">
                        {availableTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => setBatchType(type)}
                                className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                                    batchType === type 
                                    ? 'bg-cyan-500 border-cyan-500 text-white' 
                                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-cyan-500/50'
                                }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${batchType === type ? 'bg-white' : ''}`} style={{ backgroundColor: batchType === type ? 'white' : COLORS[type] }} />
                                {LABELS[type]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* 2. Quantity */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">2. Cantidad</label>
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-1">
                            <button onClick={() => setBatchQty(Math.max(1, batchQty - 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500"><Minus size={16} /></button>
                            <input 
                                type="number" 
                                value={batchQty} 
                                onChange={(e) => setBatchQty(parseInt(e.target.value) || 1)}
                                className="w-full bg-transparent text-center font-bold text-lg dark:text-white outline-none" 
                            />
                            <button onClick={() => setBatchQty(batchQty + 1)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-cyan-500"><Plus size={16} /></button>
                        </div>
                    </div>

                    {/* 3. Date */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">3. Fecha</label>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="date" 
                                value={batchDate}
                                onChange={(e) => setBatchDate(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-3 pl-9 pr-3 text-sm font-bold dark:text-white outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleBatchSubmit}
                    disabled={!batchType || !batchDate || batchQty < 1}
                    className="w-full py-4 mt-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-zinc-800 disabled:text-slate-500 text-white rounded-xl font-bold tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                    <Save size={20} />
                    REGISTRAR LOTE
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

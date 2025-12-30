
import React, { useState, useEffect } from 'react';
import { InstallType } from '../types';
import { Wifi, Building2, Radio, Zap, HardDrive, Network, Signal, Layers, Plus, Minus, ChevronLeft, Save, Link, UserPlus, Truck, Link2, Cloud, Briefcase } from 'lucide-react';
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

  const getButtonClass = (type: InstallType, activeBg: string) => {
    const isClicked = clickedType === type;
    if (isClicked) {
      return `${activeBg} scale-95 border-transparent shadow-inner transition-all duration-200`;
    }
    return `dark:bg-zinc-900 bg-white border-2 dark:border-zinc-800 border-slate-100 hover:scale-[1.02] active:scale-95 transition-all shadow-sm`;
  };

  const renderInstallerButtons = () => (
    <div className="grid grid-cols-2 gap-4 w-full">
      <button onClick={() => handlePress(InstallType.RESIDENTIAL)} className={`group flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(InstallType.RESIDENTIAL, 'bg-cyan-500 text-white')}`}>
        <Wifi size={32} className="text-cyan-400 mb-2" />
        <span className="text-lg font-bold">Residencial</span>
        <span className="text-sm font-mono opacity-80">${prices[InstallType.RESIDENTIAL]}</span>
      </button>

      <button onClick={() => handlePress(InstallType.CORPORATE)} className={`group flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(InstallType.CORPORATE, 'bg-violet-500 text-white')}`}>
        <Building2 size={32} className="text-violet-400 mb-2" />
        <span className="text-lg font-bold">Corporativo</span>
        <span className="text-sm font-mono opacity-80">${prices[InstallType.CORPORATE]}</span>
      </button>
      
      <button onClick={() => handlePress(InstallType.POSTE)} className={`group flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(InstallType.POSTE, 'bg-emerald-500 text-white')}`}>
        <Radio size={32} className="text-emerald-400 mb-2" />
        <span className="text-lg font-bold">Poste</span>
        <span className="text-sm font-mono opacity-80">${prices[InstallType.POSTE]}</span>
      </button>

      <button onClick={() => handlePress(InstallType.SERVICE)} className={`group flex flex-col items-center justify-center p-6 rounded-2xl ${getButtonClass(InstallType.SERVICE, 'bg-slate-500 text-white')}`}>
        <HardDrive size={32} className="text-slate-400 mb-2" />
        <span className="text-lg font-bold">General</span>
        <span className="text-sm font-mono opacity-80">${prices[InstallType.SERVICE]}</span>
      </button>
    </div>
  );

  const renderTechnicianButtons = () => (
    <div className="grid grid-cols-2 gap-3 w-full">
      <button onClick={() => handlePress(InstallType.SERVICE_REWIRING_CORP)} className={`flex flex-col items-center justify-center p-4 rounded-xl text-center ${getButtonClass(InstallType.SERVICE_REWIRING_CORP, 'bg-indigo-700 text-white')}`}>
        <Network size={24} className="mb-1 text-indigo-400" />
        <span className="text-[10px] font-bold leading-tight uppercase">Rec. Corp</span>
        <span className="text-[10px] font-mono mt-1 opacity-70">${prices[InstallType.SERVICE_REWIRING_CORP]}</span>
      </button>
      
      <button onClick={() => handlePress(InstallType.SERVICE_REWIRING_PPAL)} className={`flex flex-col items-center justify-center p-4 rounded-xl text-center ${getButtonClass(InstallType.SERVICE_REWIRING_PPAL, 'bg-pink-700 text-white')}`}>
        <Briefcase size={24} className="mb-1 text-pink-400" />
        <span className="text-[10px] font-bold leading-tight uppercase">Rec. Ppal</span>
        <span className="text-[10px] font-mono mt-1 opacity-70">${prices[InstallType.SERVICE_REWIRING_PPAL]}</span>
      </button>

      <button onClick={() => handlePress(InstallType.SERVICE_REWIRING_AYUDANTE)} className={`flex flex-col items-center justify-center p-4 rounded-xl text-center ${getButtonClass(InstallType.SERVICE_REWIRING_AYUDANTE, 'bg-sky-600 text-white')}`}>
        <UserPlus size={24} className="mb-1 text-sky-300" />
        <span className="text-[10px] font-bold leading-tight uppercase">Ayudante</span>
        <span className="text-[10px] font-mono mt-1 opacity-70">${prices[InstallType.SERVICE_REWIRING_AYUDANTE]}</span>
      </button>

      <button onClick={() => handlePress(InstallType.SERVICE_RELOCATION)} className={`flex flex-col items-center justify-center p-4 rounded-xl text-center ${getButtonClass(InstallType.SERVICE_RELOCATION, 'bg-violet-600 text-white')}`}>
        <Truck size={24} className="mb-1 text-violet-300" />
        <span className="text-[10px] font-bold leading-tight uppercase">Mudanza</span>
        <span className="text-[10px] font-mono mt-1 opacity-70">${prices[InstallType.SERVICE_RELOCATION]}</span>
      </button>

      <button onClick={() => handlePress(InstallType.SERVICE_REWIRING)} className={`col-span-2 flex items-center justify-center gap-4 p-4 rounded-xl ${getButtonClass(InstallType.SERVICE_REWIRING, 'bg-pink-500 text-white')}`}>
        <Link2 size={24} className="text-pink-200" />
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase">Recableado Gral</span>
          <span className="text-[10px] font-mono opacity-70">${prices[InstallType.SERVICE_REWIRING]}</span>
        </div>
      </button>
      
      <div className="col-span-2 grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
        <button onClick={() => handlePress(InstallType.SERVICE_BASIC)} className={`flex items-center justify-center gap-2 p-3 rounded-lg ${getButtonClass(InstallType.SERVICE_BASIC, 'bg-orange-500 text-white')}`}>
          <Signal size={16} /> <span className="text-[10px] font-bold">Srv. Básico</span>
        </button>
        <button onClick={() => handlePress(InstallType.SERVICE_CORP)} className={`flex items-center justify-center gap-2 p-3 rounded-lg ${getButtonClass(InstallType.SERVICE_CORP, 'bg-indigo-500 text-white')}`}>
          <Cloud size={16} /> <span className="text-[10px] font-bold">Srv. Corp</span>
        </button>
      </div>
    </div>
  );

  const availableTypes = isTechnician 
    ? [InstallType.SERVICE_REWIRING_CORP, InstallType.SERVICE_REWIRING_PPAL, InstallType.SERVICE_REWIRING_AYUDANTE, InstallType.SERVICE_RELOCATION, InstallType.SERVICE_REWIRING, InstallType.SERVICE_BASIC, InstallType.SERVICE_CORP]
    : [InstallType.RESIDENTIAL, InstallType.CORPORATE, InstallType.POSTE, InstallType.SERVICE];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="w-full max-sm:max-w-xs max-w-sm dark:bg-zinc-950 bg-blue-50/95 border dark:border-zinc-800 border-white/50 rounded-3xl p-6 shadow-2xl animate-scaleIn relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="text-xl font-bold dark:text-white text-slate-900 tracking-widest flex items-center gap-2">
            {mode === 'batch' && <button onClick={() => setMode('quick')} className="mr-1"><ChevronLeft size={24} /></button>}
            <Zap className="text-yellow-400" fill="currentColor" /> 
            {mode === 'batch' ? 'MANUAL' : (isTechnician ? 'TÉCNICO NETUNO' : 'INSTALADOR')}
          </h3>
          <button onClick={onClose} className="dark:text-zinc-500 text-slate-500 font-bold text-sm">Cerrar</button>
        </div>
        
        {mode === 'quick' ? (
            <div className="relative z-10">
              {isTechnician ? renderTechnicianButtons() : renderInstallerButtons()}
              <button onClick={() => setMode('batch')} className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-xl bg-slate-200 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 font-bold transition-colors">
                <Layers size={18} /> Carga por Lotes
              </button>
            </div>
        ) : (
            <div className="space-y-5 relative z-10">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">1. Selección de Tipo</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                        {availableTypes.map(type => (
                            <button key={type} onClick={() => setBatchType(type)} className={`p-2 rounded-xl border text-[9px] font-bold transition-all uppercase ${batchType === type ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600'}`}>
                                {LABELS[type]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">2. Unidades</label>
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border rounded-xl p-1">
                            <button onClick={() => setBatchQty(Math.max(1, batchQty - 1))} className="p-2"><Minus size={16} /></button>
                            <span className="w-full text-center font-bold">{batchQty}</span>
                            <button onClick={() => setBatchQty(batchQty + 1)} className="p-2"><Plus size={16} /></button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">3. Fecha</label>
                        <input type="date" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border rounded-xl py-3 px-2 text-xs font-bold" />
                    </div>
                </div>
                <button onClick={handleBatchSubmit} disabled={!batchType} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 tracking-widest">
                    <Save size={20} /> GUARDAR REGISTRO
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

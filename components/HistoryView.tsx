
import React, { useMemo, useState } from 'react';
import { InstallationRecord, InstallType } from '../types';
import { Trash2, Filter, History } from 'lucide-react';
import { LABELS } from '../constants';

interface HistoryViewProps {
  records: InstallationRecord[];
  onDelete: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ records, onDelete }) => {
  const [filterType, setFilterType] = useState<InstallType | 'ALL'>('ALL');

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => filterType === 'ALL' || r.type === filterType)
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }, [records, filterType]);

  const totalFiltered = filteredRecords.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col gap-2 pb-2">
        <h2 className="text-xl font-bold dark:text-white text-slate-800 tracking-wide flex items-center gap-2">
          <History className="text-cyan-600 dark:text-zinc-400" size={24} />
          HISTORIAL
        </h2>
        <p className="text-slate-500 dark:text-zinc-500 text-sm">Registro completo de actividades.</p>
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button 
          onClick={() => setFilterType('ALL')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
            filterType === 'ALL' 
              ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' 
              : 'glass-panel text-slate-500 dark:text-zinc-500 hover:text-black dark:hover:text-white'
          }`}
        >
          TODOS
        </button>
        {/* Generamos botones de filtro dinámicamente o estáticos para los más comunes */}
        <button 
          onClick={() => setFilterType(InstallType.RESIDENTIAL)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
            filterType === InstallType.RESIDENTIAL
              ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700' 
              : 'glass-panel text-slate-500 dark:text-zinc-500'
          }`}
        >
          RESIDENCIAL
        </button>
        <button 
          onClick={() => setFilterType(InstallType.CORPORATE)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
            filterType === InstallType.CORPORATE
              ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700' 
              : 'glass-panel text-slate-500 dark:text-zinc-500'
          }`}
        >
          CORPORATIVO
        </button>
        <button 
          onClick={() => setFilterType(InstallType.POSTE)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
            filterType === InstallType.POSTE
              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
              : 'glass-panel text-slate-500 dark:text-zinc-500'
          }`}
        >
          POSTE
        </button>
        <button 
          onClick={() => setFilterType(InstallType.SERVICE_BASIC)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
            filterType === InstallType.SERVICE_BASIC
              ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700' 
              : 'glass-panel text-slate-500 dark:text-zinc-500'
          }`}
        >
          SRV. BÁSICO
        </button>
      </div>

      {/* Summary of current view */}
      <div className="glass-panel rounded-xl p-4 flex justify-between items-center">
        <span className="text-slate-500 dark:text-zinc-500 text-sm">Registros: <span className="dark:text-white text-slate-900 font-bold">{filteredRecords.length}</span></span>
        <span className="text-slate-500 dark:text-zinc-500 text-sm">Total: <span className="text-cyan-600 dark:text-white font-bold">${totalFiltered}</span></span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 opacity-50">
            <Filter size={48} className="mx-auto mb-2 text-slate-400 dark:text-zinc-600" />
            <p className="text-slate-500 dark:text-zinc-500">Sin resultados.</p>
          </div>
        ) : (
          filteredRecords.map((rec) => (
            <div key={rec.id} className="group flex items-center justify-between glass-panel p-4 rounded-2xl transition-all hover:scale-[1.01]">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${
                     rec.type === InstallType.RESIDENTIAL ? 'bg-cyan-400' :
                     rec.type === InstallType.CORPORATE ? 'bg-violet-400' :
                     rec.type === InstallType.POSTE ? 'bg-emerald-400' :
                     rec.type === InstallType.SERVICE_BASIC ? 'bg-orange-400' :
                     rec.type === InstallType.SERVICE_REWIRING ? 'bg-pink-400' :
                     'bg-slate-400'
                  }`} />
                  <span className={`text-xs font-bold tracking-wider uppercase ${
                     rec.type === InstallType.RESIDENTIAL ? 'text-cyan-700 dark:text-cyan-300' :
                     rec.type === InstallType.CORPORATE ? 'text-violet-700 dark:text-violet-300' :
                     rec.type === InstallType.POSTE ? 'text-emerald-700 dark:text-emerald-300' :
                     'text-slate-600 dark:text-slate-300'
                  }`}>
                    {LABELS[rec.type]}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">
                  {new Date(rec.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold dark:text-white text-slate-800">${rec.amount}</span>
                <button 
                  onClick={() => onDelete(rec.id)}
                  title="Eliminar Registro"
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

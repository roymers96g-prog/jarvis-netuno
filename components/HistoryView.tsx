import React, { useMemo, useState } from 'react';
import { ProductionRecord, InstallType } from '../types';
import { LABELS } from '../constants';
import { Trash2, Calendar, Filter } from 'lucide-react';

interface HistoryViewProps {
  records: ProductionRecord[];
  onDelete: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ records, onDelete }) => {
  const [filterType, setFilterType] = useState<InstallType | 'ALL'>('ALL');

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => filterType === 'ALL' || r.installation_type === filterType);
  }, [records, filterType]);

  const totalFiltered = filteredRecords.reduce((sum, r) => sum + r.total_amount, 0);

  const getRecordLabel = (rec: ProductionRecord) => {
    if (rec.installation_type === InstallType.SERVICE) {
        return rec.description || LABELS[rec.installation_type];
    }
    return `${rec.quantity} x ${LABELS[rec.installation_type]}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col gap-2 pb-2">
        <h2 className="text-xl font-bold dark:text-white text-slate-800 tracking-wide flex items-center gap-2">
          <Calendar className="text-cyan-600 dark:text-zinc-400" size={24} />
          HISTORIAL
        </h2>
        <p className="text-slate-500 dark:text-zinc-500 text-sm">Registro completo de actividades.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['ALL', ...Object.values(InstallType)].map(type => (
            <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                    filterType === type 
                    ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' 
                    : 'glass-panel text-slate-500 dark:text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
            >
                {type === 'ALL' ? 'TODOS' : LABELS[type as InstallType].toUpperCase()}
            </button>
        ))}
      </div>

      <div className="glass-panel rounded-xl p-4 flex justify-between items-center">
        <span className="text-slate-500 dark:text-zinc-500 text-sm">Registros: <span className="dark:text-white text-slate-900 font-bold">{filteredRecords.length}</span></span>
        <span className="text-slate-500 dark:text-zinc-500 text-sm">Total: <span className="text-cyan-600 dark:text-white font-bold">${totalFiltered.toFixed(2)}</span></span>
      </div>

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
                     rec.installation_type === InstallType.RESIDENTIAL ? 'bg-cyan-400' :
                     rec.installation_type === InstallType.CORPORATE ? 'bg-violet-400' :
                     rec.installation_type === InstallType.SERVICE ? 'bg-amber-400' :
                     'bg-emerald-400'
                  }`} />
                  <span className={`text-sm font-bold tracking-wider ${
                     rec.installation_type === InstallType.RESIDENTIAL ? 'text-cyan-700 dark:text-cyan-300' :
                     rec.installation_type === InstallType.CORPORATE ? 'text-violet-700 dark:text-violet-300' :
                     rec.installation_type === InstallType.SERVICE ? 'text-amber-700 dark:text-amber-300' :
                     'text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {getRecordLabel(rec)}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">
                  {new Date(rec.record_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold dark:text-white text-slate-800">${rec.total_amount}</span>
                <button 
                  onClick={() => onDelete(rec.id)}
                  className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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

import React, { useMemo, useState } from 'react';
import { InstallationRecord, InstallType } from '../types';
import { Trash2, Search, Calendar, Filter } from 'lucide-react';

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
      <header className="flex flex-col gap-2 border-b border-slate-700 pb-4">
        <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Calendar className="text-cyan-400" size={24} />
          HISTORIAL DETALLADO
        </h2>
        <p className="text-slate-400 text-sm">Registro completo de actividades.</p>
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button 
          onClick={() => setFilterType('ALL')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
            filterType === 'ALL' 
              ? 'bg-slate-700 text-white border-slate-500' 
              : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:border-slate-600'
          }`}
        >
          TODOS
        </button>
        <button 
          onClick={() => setFilterType(InstallType.RESIDENTIAL)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
            filterType === InstallType.RESIDENTIAL
              ? 'bg-cyan-900/40 text-cyan-300 border-cyan-500/50' 
              : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:border-cyan-500/30'
          }`}
        >
          RESIDENCIAL
        </button>
        <button 
          onClick={() => setFilterType(InstallType.CORPORATE)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
            filterType === InstallType.CORPORATE
              ? 'bg-violet-900/40 text-violet-300 border-violet-500/50' 
              : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:border-violet-500/30'
          }`}
        >
          CORPORATIVO
        </button>
        <button 
          onClick={() => setFilterType(InstallType.POSTE)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
            filterType === InstallType.POSTE
              ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/50' 
              : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:border-emerald-500/30'
          }`}
        >
          POSTE
        </button>
      </div>

      {/* Summary of current view */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 flex justify-between items-center">
        <span className="text-slate-400 text-sm">Registros visibles: <span className="text-white font-bold">{filteredRecords.length}</span></span>
        <span className="text-slate-400 text-sm">Total: <span className="text-cyan-400 font-bold">${totalFiltered}</span></span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 opacity-50">
            <Filter size={48} className="mx-auto mb-2 text-slate-600" />
            <p className="text-slate-500">No se encontraron registros con este filtro.</p>
          </div>
        ) : (
          filteredRecords.map((rec) => (
            <div key={rec.id} className="group flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-slate-700 hover:border-cyan-500/30 transition-all shadow-sm">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${
                     rec.type === InstallType.RESIDENTIAL ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' :
                     rec.type === InstallType.CORPORATE ? 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]' :
                     'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  }`} />
                  <span className={`text-sm font-bold tracking-wider ${
                     rec.type === InstallType.RESIDENTIAL ? 'text-cyan-200' :
                     rec.type === InstallType.CORPORATE ? 'text-violet-200' :
                     'text-emerald-200'
                  }`}>
                    {rec.type}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(rec.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              
              <div className="flex items-center gap-5">
                <span className="text-xl font-bold text-white font-mono">${rec.amount}</span>
                <button 
                  onClick={() => onDelete(rec.id)}
                  className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Eliminar registro"
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
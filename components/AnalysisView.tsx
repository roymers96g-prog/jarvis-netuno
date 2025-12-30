
import React, { useState, useMemo } from 'react';
import { InstallationRecord, InstallType, UserProfile } from '../types';
import { LABELS, COLORS } from '../constants';
import { StatsCard } from './StatsCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, Activity, TrendingUp, Award, BarChart3 as AnalysisIcon, Printer, FileText, Spline } from 'lucide-react';

interface AnalysisViewProps {
  records: InstallationRecord[];
  nickname: string;
  profile: UserProfile;
}

type TimePeriod = 'this_month' | 'last_month' | 'this_year' | 'last_30_days';

export const AnalysisView: React.FC<AnalysisViewProps> = ({ records, nickname, profile }) => {
  const [period, setPeriod] = useState<TimePeriod>('this_month');

  const { stats, monthlyData, filteredRecords } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate: Date;
    let endDate: Date = new Date(today.getTime() + 86400000 - 1); // End of today

    switch (period) {
      case 'this_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last_month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'this_year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'last_30_days':
        startDate = new Date(today.getTime() - 29 * 86400000);
        break;
    }

    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    const filtered = records.filter(r => r.timestamp >= startTimestamp && r.timestamp <= endTimestamp);

    const totalEarnings = filtered.reduce((sum, r) => sum + r.amount, 0);
    const totalActivities = filtered.length;
    
    const earningsByDay: { [key: string]: number } = {};
    filtered.forEach(r => {
      const day = new Date(r.date).toLocaleDateString('en-CA');
      if (!earningsByDay[day]) earningsByDay[day] = 0;
      earningsByDay[day] += r.amount;
    });

    const numDaysWithActivity = Object.keys(earningsByDay).length;
    const dailyAverage = numDaysWithActivity > 0 ? totalEarnings / numDaysWithActivity : 0;
    
    let bestDay = { date: '', amount: 0 };
    for (const day in earningsByDay) {
      if (earningsByDay[day] > bestDay.amount) {
        bestDay = { date: day, amount: earningsByDay[day] };
      }
    }
    
    const typeDistribution = Object.values(InstallType).reduce((acc, type) => {
      const typeRecords = filtered.filter(r => r.type === type);
      if (typeRecords.length === 0) return acc;
      acc[type] = {
        count: typeRecords.length,
        earnings: typeRecords.reduce((sum, r) => sum + r.amount, 0),
      };
      return acc;
    }, {} as Record<InstallType, { count: number; earnings: number }>);
    
    const monthTotals = Array(12).fill(0).map((_, i) => ({
      name: new Date(2000, i).toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', ''),
      total: 0,
    }));

    records.forEach(r => {
      const recordDate = new Date(r.date);
      if (recordDate.getFullYear() === now.getFullYear()) {
        const monthIndex = recordDate.getMonth();
        monthTotals[monthIndex].total += r.amount;
      }
    });

    return {
      stats: { totalEarnings, totalActivities, dailyAverage, bestDay, typeDistribution },
      monthlyData: monthTotals,
      filteredRecords: filtered,
      startDate,
      endDate
    };
  }, [records, period]);

  const handlePrint = () => {
    window.print();
  };

  const TimePeriodButton: React.FC<{ value: TimePeriod; label: string }> = ({ value, label }) => (
    <button
      onClick={() => setPeriod(value)}
      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all no-print ${
        period === value
          ? 'bg-black dark:bg-white text-white dark:text-black border-transparent'
          : 'glass-panel text-slate-500 dark:text-zinc-500 hover:text-black dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Elemento Oculto: Reporte para Impresión (Recomendación 4) */}
      <div className="hidden printable-report">
        <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
          <div className="flex items-center gap-4">
            <Spline size={48} />
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-tighter">Reporte de Producción</h1>
              <p className="text-xl font-bold">NETUNO - ASISTENTE JARVIS</p>
            </div>
          </div>
          <div className="text-right">
             <p className="font-bold">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
             <p className="uppercase text-sm">Periodo: {period.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-100 p-6 rounded-xl border-2 border-black">
          <div>
            <p className="text-sm uppercase font-bold text-slate-500">Técnico / Responsable</p>
            <p className="text-2xl font-bold uppercase">{nickname || 'Sin Nombre'}</p>
            <p className="text-lg font-bold text-cyan-700">{profile === 'TECHNICIAN' ? 'SERVICIO TÉCNICO' : 'INSTALADOR DE FIBRA'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm uppercase font-bold text-slate-500">Monto Total a Liquidar</p>
            <p className="text-4xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
            <p className="text-sm font-bold uppercase">Total Actividades: {stats.totalActivities}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold uppercase border-b-2 border-black mb-4">Desglose por Concepto</h2>
        <table className="w-full mb-8 text-left border-collapse">
          <thead>
            <tr className="bg-slate-200 uppercase text-sm border-b-2 border-black">
              <th className="py-2 px-4">Descripción de Actividad</th>
              <th className="py-2 px-4 text-center">Unidades</th>
              <th className="py-2 px-4 text-right">Monto Unitario</th>
              <th className="py-2 px-4 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.typeDistribution).map(([type, data]) => (
              <tr key={type} className="border-b border-slate-300">
                <td className="py-3 px-4 font-bold">{LABELS[type as InstallType]}</td>
                <td className="py-3 px-4 text-center">{(data as any).count}</td>
                <td className="py-3 px-4 text-right">${((data as any).earnings / (data as any).count).toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-bold">${(data as any).earnings.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold text-lg">
              <td colSpan={3} className="py-4 px-4 text-right">TOTAL GENERAL:</td>
              <td className="py-4 px-4 text-right">${stats.totalEarnings.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-24 grid grid-cols-2 gap-20">
          <div className="border-t-2 border-black pt-4 text-center">
            <p className="font-bold uppercase">{nickname}</p>
            <p className="text-sm uppercase">Firma del Técnico</p>
          </div>
          <div className="border-t-2 border-black pt-4 text-center">
            <p className="font-bold uppercase">Supervisor Netuno</p>
            <p className="text-sm uppercase">Firma de Conformidad</p>
          </div>
        </div>
        <p className="mt-10 text-[10px] text-center text-slate-400 italic">Este reporte fue generado automáticamente por Netuno Jarvis System.</p>
      </div>

      <header className="flex justify-between items-start pb-2 no-print">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold dark:text-white text-slate-800 tracking-wide flex items-center gap-2">
            <AnalysisIcon className="text-cyan-600 dark:text-zinc-400" size={24} />
            REPORTES Y NÓMINA
          </h2>
          <p className="text-slate-500 dark:text-zinc-500 text-sm">Informes oficiales para liquidación.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-emerald-500 transition-all uppercase tracking-widest active:scale-95"
        >
          <Printer size={16} /> Reporte PDF
        </button>
      </header>
      
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar no-print">
        <TimePeriodButton value="this_month" label="Este Mes" />
        <TimePeriodButton value="last_month" label="Mes Pasado" />
        <TimePeriodButton value="last_30_days" label="30 Días" />
        <TimePeriodButton value="this_year" label="Este Año" />
      </div>

      <div className="grid grid-cols-2 gap-4 no-print">
        <StatsCard 
          title="LIQUIDACIÓN TOTAL" 
          value={`$${stats.totalEarnings.toFixed(0)}`}
          icon={<FileText size={24} />}
        />
        <StatsCard 
          title="ACTIVIDADES" 
          value={stats.totalActivities}
          color="text-emerald-600 dark:text-emerald-400"
          icon={<Activity size={24} />}
        />
        <StatsCard 
          title="PROMEDIO DÍA" 
          value={`$${stats.dailyAverage.toFixed(0)}`}
          color="text-violet-600 dark:text-violet-400"
          icon={<TrendingUp size={24} />}
        />
        <StatsCard 
          title="MEJOR JORNADA" 
          value={`$${stats.bestDay.amount.toFixed(0)}`}
          subValue={stats.bestDay.date ? new Date(stats.bestDay.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '-'}
          color="text-amber-600 dark:text-amber-400"
          icon={<Award size={24} />}
        />
      </div>

      <div className="glass-panel rounded-3xl p-6 no-print">
        <h3 className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-4">DESGLOSE DE ACTIVIDAD</h3>
        <div className="space-y-3">
          {Object.entries(stats.typeDistribution).map(([type, data]) => {
            const typedData = data as { count: number; earnings: number };
            return (
            <div key={type} className="flex justify-between items-center text-sm p-3 bg-white/5 dark:bg-black/20 rounded-lg border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[type as InstallType] }} />
                <span className="font-bold dark:text-zinc-200 text-slate-700 uppercase tracking-tight">{LABELS[type as InstallType]}</span>
              </div>
              <div className="text-right">
                <span className="font-bold dark:text-white text-slate-900">${typedData.earnings.toFixed(0)}</span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 ml-2 font-bold">x{typedData.count}</span>
              </div>
            </div>
          )})}
        </div>
      </div>
      
      <div className="glass-panel rounded-3xl p-6 no-print">
        <h3 className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-6">HISTORIAL DE FLUJO ANUAL</h3>
        <div className="w-full h-64 min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="analysisBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(9, 9, 11, 0.9)', 
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(255,255,255,0.1)', 
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              />
              <Bar dataKey="total" fill="url(#analysisBarGradient)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

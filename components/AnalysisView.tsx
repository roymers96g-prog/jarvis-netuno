import React, { useState, useMemo } from 'react';
import { InstallationRecord, InstallType } from '../types';
import { LABELS, COLORS } from '../constants';
import { StatsCard } from './StatsCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, Activity, TrendingUp, Award, BarChart3 as AnalysisIcon } from 'lucide-react';

interface AnalysisViewProps {
  records: InstallationRecord[];
}

type TimePeriod = 'this_month' | 'last_month' | 'this_year' | 'last_30_days';

export const AnalysisView: React.FC<AnalysisViewProps> = ({ records }) => {
  const [period, setPeriod] = useState<TimePeriod>('this_month');

  const { stats, monthlyData } = useMemo(() => {
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
    };
  }, [records, period]);

  const TimePeriodButton: React.FC<{ value: TimePeriod; label: string }> = ({ value, label }) => (
    <button
      onClick={() => setPeriod(value)}
      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
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
      <header className="flex flex-col gap-2 pb-2">
        <h2 className="text-xl font-bold dark:text-white text-slate-800 tracking-wide flex items-center gap-2">
          <AnalysisIcon className="text-cyan-600 dark:text-zinc-400" size={24} />
          ANÁLISIS DE PRODUCCIÓN
        </h2>
        <p className="text-slate-500 dark:text-zinc-500 text-sm">Informes detallados y tendencias.</p>
      </header>
      
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
        <TimePeriodButton value="this_month" label="Este Mes" />
        <TimePeriodButton value="last_month" label="Mes Pasado" />
        <TimePeriodButton value="last_30_days" label="Últimos 30 Días" />
        <TimePeriodButton value="this_year" label="Este Año" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatsCard 
          title="INGRESOS TOTALES" 
          value={`$${stats.totalEarnings.toFixed(0)}`}
          icon={<DollarSign size={24} />}
        />
        <StatsCard 
          title="TOTAL ACTIVIDADES" 
          value={stats.totalActivities}
          color="text-emerald-600 dark:text-emerald-400"
          icon={<Activity size={24} />}
        />
        <StatsCard 
          title="PROMEDIO DIARIO" 
          value={`$${stats.dailyAverage.toFixed(0)}`}
          color="text-violet-600 dark:text-violet-400"
          icon={<TrendingUp size={24} />}
        />
        <StatsCard 
          title="MEJOR DÍA" 
          value={`$${stats.bestDay.amount.toFixed(0)}`}
          subValue={stats.bestDay.date ? new Date(stats.bestDay.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '-'}
          color="text-amber-600 dark:text-amber-400"
          icon={<Award size={24} />}
        />
      </div>

      <div className="glass-panel rounded-3xl p-6">
        <h3 className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-4">DESGLOSE POR TIPO</h3>
        <div className="space-y-3">
          {Object.entries(stats.typeDistribution).map(([type, data]) => {
            const typedData = data as { count: number; earnings: number };
            return (
            <div key={type} className="flex justify-between items-center text-sm p-3 bg-white/5 dark:bg-black/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[type as InstallType] }} />
                <span className="font-bold dark:text-zinc-200 text-slate-700">{LABELS[type as InstallType]}</span>
              </div>
              <div className="text-right">
                <span className="font-bold dark:text-white text-slate-900">${typedData.earnings.toFixed(0)}</span>
                <span className="text-xs text-slate-500 dark:text-zinc-500 ml-2">({typedData.count} uds)</span>
              </div>
            </div>
          )})}
        </div>
      </div>
      
      <div className="glass-panel rounded-3xl p-6">
        <h3 className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-6">RESUMEN DEL AÑO ACTUAL</h3>
        <div className="w-full h-64 min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="analysisBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(9, 9, 11, 0.8)', 
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(255,255,255,0.1)', 
                  color: '#fff',
                  borderRadius: '12px',
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
              />
              <Bar dataKey="total" fill="url(#analysisBarGradient)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
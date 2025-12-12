import React, { useMemo } from 'react';
import { InstallationRecord, InstallType } from '../types';
import { LABELS, COLORS } from '../constants';
import { StatsCard } from './StatsCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { DollarSign, Activity, Calendar, Zap } from 'lucide-react';

interface DashboardProps {
  records: InstallationRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = now.toISOString().split('T')[0];

    let monthTotal = 0;
    let todayTotal = 0;
    let allTotal = 0;
    
    const countByType = {
      [InstallType.RESIDENTIAL]: 0,
      [InstallType.CORPORATE]: 0,
      [InstallType.POSTE]: 0,
    };

    records.forEach(r => {
      const rDate = new Date(r.date);
      const isThisMonth = rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
      const isToday = r.date.startsWith(todayStr);

      allTotal += r.amount;
      if (isThisMonth) monthTotal += r.amount;
      if (isToday) todayTotal += r.amount;

      if (countByType[r.type] !== undefined) {
        countByType[r.type]++;
      }
    });

    return { monthTotal, todayTotal, allTotal, countByType };
  }, [records]);

  const pieData = [
    { name: LABELS[InstallType.RESIDENTIAL], value: stats.countByType[InstallType.RESIDENTIAL], color: COLORS[InstallType.RESIDENTIAL] },
    { name: LABELS[InstallType.CORPORATE], value: stats.countByType[InstallType.CORPORATE], color: COLORS[InstallType.CORPORATE] },
    { name: LABELS[InstallType.POSTE], value: stats.countByType[InstallType.POSTE], color: COLORS[InstallType.POSTE] },
  ].filter(d => d.value > 0);

  // Group by day (last 7 days logic could be added, here showing simply recent activity)
  // Let's create a "Last 7 days" view
  const chartData = useMemo(() => {
    const days = 7;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      
      const dayAmount = records
        .filter(r => r.date.startsWith(dateStr))
        .reduce((sum, r) => sum + r.amount, 0);

      result.push({ date: dayLabel, amount: dayAmount });
    }
    return result;
  }, [records]);

  return (
    <div className="space-y-6 pb-24">
      <header className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">PANEL DE CONTROL</h2>
        <p className="text-cyan-500 text-sm">ESTADO: OPERATIVO</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <StatsCard 
          title="HOY" 
          value={`$${stats.todayTotal}`} 
          icon={<Zap size={24} />}
        />
        <StatsCard 
          title="ESTE MES" 
          value={`$${stats.monthTotal}`} 
          color="text-emerald-400"
          icon={<Calendar size={24} />}
        />
        <StatsCard 
          title="TOTAL AÑO" 
          value={`$${stats.allTotal}`} 
          color="text-violet-400"
          icon={<DollarSign size={24} />}
        />
         <StatsCard 
          title="INSTALACIONES" 
          value={records.length} 
          color="text-amber-400"
          icon={<Activity size={24} />}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 backdrop-blur-sm">
        <h3 className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-4">INGRESOS ÚLTIMOS 7 DÍAS</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#06b6d4" fillOpacity={0.6 + (index * 0.05)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 backdrop-blur-sm flex flex-col items-center">
         <h3 className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-2 self-start">DISTRIBUCIÓN DE TRABAJO</h3>
         <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
         </div>
         <div className="flex gap-4 mt-2 text-xs">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-300">{d.name}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
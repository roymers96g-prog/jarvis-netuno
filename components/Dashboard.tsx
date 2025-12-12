import React, { useMemo } from 'react';
import { InstallationRecord, InstallType } from '../types';
import { LABELS, COLORS } from '../constants';
import { StatsCard } from './StatsCard';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { DollarSign, Activity, Calendar, Zap } from 'lucide-react';

interface DashboardProps {
  records: InstallationRecord[];
  username: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ records, username }) => {
  
  const stats = useMemo(() => {
    const now = new Date();
    // Use Local Date String for comparison (YYYY-MM-DD in local time)
    // This fixes the bug where "Today" (UTC) might differ from "Today" (Local)
    const todayStr = now.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

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
      // Convert record date to local YYYY-MM-DD for comparison
      const rDateStr = rDate.toLocaleDateString('en-CA');
      
      const isThisMonth = rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
      const isToday = rDateStr === todayStr;

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

  const chartData = useMemo(() => {
    const days = 7;
    const result = [];
    
    // Generate last 7 days based on LOCAL time
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD Local
      const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
      
      const dayAmount = records
        .filter(r => {
           // Convert record ISO to Local Date String for comparison
           const rLoc = new Date(r.date).toLocaleDateString('en-CA');
           return rLoc === dateStr;
        })
        .reduce((sum, r) => sum + r.amount, 0);

      result.push({ date: dayLabel.charAt(0), amount: dayAmount, fullDate: dateStr });
    }
    return result;
  }, [records]);

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-800 tracking-tight">Hola, {username || 'Técnico'}</h2>
          <p className="text-cyan-600 dark:text-zinc-500 text-sm font-medium">Panel de Control</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-full border border-green-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          ONLINE
        </div>
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
          color="text-emerald-600 dark:text-emerald-400"
          icon={<Calendar size={24} />}
        />
        <StatsCard 
          title="TOTAL AÑO" 
          value={`$${stats.allTotal}`} 
          color="text-violet-600 dark:text-violet-400"
          icon={<DollarSign size={24} />}
        />
         <StatsCard 
          title="INSTALACIONES" 
          value={records.length} 
          color="text-amber-600 dark:text-amber-400"
          icon={<Activity size={24} />}
        />
      </div>

      <div className="glass-panel rounded-3xl p-6">
        <h3 className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-6">INGRESOS (7 DÍAS)</h3>
        <div className="w-full h-56 min-h-[224px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="barGradientDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f4f4f5" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#52525b" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(9, 9, 11, 0.8)', 
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(255,255,255,0.1)', 
                  color: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="amount" radius={[6, 6, 6, 6]} barSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="url(#barGradient)" className="dark:hidden" />
                ))}
                {chartData.map((entry, index) => (
                   <Cell key={`cell-dark-${index}`} fill="url(#barGradientDark)" className="hidden dark:block" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 flex flex-col items-center">
         <h3 className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-2 self-start">DISTRIBUCIÓN</h3>
         <div className="w-full h-56 min-h-[224px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  cornerRadius={6}
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(9, 9, 11, 0.8)', 
                    backdropFilter: 'blur(10px)',
                    borderColor: 'rgba(255,255,255,0.1)', 
                    color: '#fff',
                    borderRadius: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
         </div>
         <div className="flex gap-4 mt-2 text-xs font-medium">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full border border-white/20 dark:border-white/5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600 dark:text-zinc-300">{d.name}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
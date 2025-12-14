import React, { useMemo, useState, useEffect } from 'react';
import { ProductionRecord, InstallType, AppSettings } from '../types';
import { LABELS, COLORS } from '../constants';
import { StatsCard } from './StatsCard';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { DollarSign, Activity, Calendar, Zap, Wifi, WifiOff, Settings, Target } from 'lucide-react';

interface DashboardProps {
  records: ProductionRecord[];
  username: string;
  settings: AppSettings;
  navigateTo: (view: 'dashboard' | 'history' | 'settings') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ records, username, settings, navigateTo }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthTotal = 0;
    let todayTotal = 0;
    let allTotal = 0;
    let totalInstallations = 0;
    
    const countByType: { [key: string]: number } = {};

    records.forEach(r => {
      const rDate = new Date(r.record_date);
      const rDateStr = rDate.toLocaleDateString('en-CA');
      
      const isThisMonth = rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
      const isToday = rDateStr === todayStr;

      allTotal += r.total_amount;
      if (isThisMonth) monthTotal += r.total_amount;
      if (isToday) todayTotal += r.total_amount;

      totalInstallations += (r.quantity || 0);

      if (countByType[r.installation_type] === undefined) countByType[r.installation_type] = 0;
      countByType[r.installation_type]++;
    });

    return { monthTotal, todayTotal, allTotal, countByType, totalInstallations };
  }, [records]);

  const pieData = Object.entries(stats.countByType)
    .map(([type, value]) => ({
      name: LABELS[type as InstallType],
      value: value,
      color: COLORS[type as InstallType]
    }))
    .filter(d => d.value > 0);

  const chartData = useMemo(() => {
    const days = 7;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
      
      const dayAmount = records
        .filter(r => new Date(r.record_date).toLocaleDateString('en-CA') === dateStr)
        .reduce((sum, r) => sum + r.total_amount, 0);

      result.push({ date: dayLabel.charAt(0), amount: dayAmount, fullDate: dateStr });
    }
    return result;
  }, [records]);

  const goalProgress = settings.monthlyGoal > 0 ? Math.min(100, (stats.monthTotal / settings.monthlyGoal) * 100) : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (goalProgress / 100) * circumference;

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-800 tracking-tight">Hola, {username || 'Técnico'}</h2>
          <p className="text-cyan-600 dark:text-zinc-500 text-sm font-medium">Panel de Control</p>
        </div>
        
        <div className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full border font-bold transition-colors duration-500 ${isOnline ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'}`}>
          {isOnline ? (<><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span><span className="tracking-wider">ONLINE</span></>) : (<><WifiOff size={12} /><span className="tracking-wider">OFFLINE</span></>)}
        </div>
      </header>

      <div className="glass-panel rounded-3xl p-6 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent animate-pulse" />
        <h3 className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-4 self-start flex items-center gap-2"><Target size={12} />META MENSUAL</h3>
        {settings.monthlyGoal > 0 ? (
          <div className="w-full flex flex-col items-center animate-scaleIn">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-slate-200 dark:text-zinc-800" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle className="text-cyan-500" strokeWidth="10" strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" style={{ strokeDasharray: circumference, strokeDashoffset, transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease-out' }}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-bold dark:text-white text-slate-900">{Math.round(goalProgress)}%</span></div>
            </div>
            <div className="text-center mt-4">
              <p className="font-bold text-lg dark:text-white text-slate-800">${stats.monthTotal.toFixed(0)} de ${settings.monthlyGoal}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-500">{stats.monthTotal >= settings.monthlyGoal ? '¡Meta alcanzada! 🎉' : `Faltan $${(settings.monthlyGoal - stats.monthTotal).toFixed(0)} para la meta`}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 w-full animate-fadeIn">
            <Target size={32} className="mx-auto text-slate-400 dark:text-zinc-600 mb-2" /><p className="text-slate-600 dark:text-zinc-400 font-bold mb-1">Define un objetivo</p><p className="text-xs text-slate-500 dark:text-zinc-500 mb-4">Establece una meta de ingresos para ver tu progreso aquí.</p><button onClick={() => navigateTo('settings')} className="flex items-center gap-2 mx-auto px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded-full hover:scale-105 transition-transform"><Settings size={14} />Ir a Configuración</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatsCard title="HOY" value={`$${stats.todayTotal}`} icon={<Zap size={24} />} />
        <StatsCard title="ESTE MES" value={`$${stats.monthTotal}`} color="text-emerald-600 dark:text-emerald-400" icon={<Calendar size={24} />} />
        <StatsCard title="TOTAL AÑO" value={`$${stats.allTotal}`} color="text-violet-600 dark:text-violet-400" icon={<DollarSign size={24} />} />
        <StatsCard title="ACTIVIDADES" value={records.length} color="text-amber-600 dark:text-amber-400" icon={<Activity size={24} />} />
      </div>

      <div className="glass-panel rounded-3xl p-6">
        <h3 className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-6">INGRESOS (7 DÍAS)</h3>
        <div className="w-full h-56 min-h-[224px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <defs><linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/><stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3}/></linearGradient><linearGradient id="barGradientDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f4f4f5" stopOpacity={0.9}/><stop offset="100%" stopColor="#52525b" stopOpacity={0.4}/></linearGradient></defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }} itemStyle={{ color: '#fff' }} />
              <Bar dataKey="amount" radius={[6, 6, 6, 6]} barSize={32}>{chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill="url(#barGradient)" className="dark:hidden" />))}{chartData.map((entry, index) => (<Cell key={`cell-dark-${index}`} fill="url(#barGradientDark)" className="hidden dark:block" />))}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 flex flex-col items-center">
         <h3 className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-2 self-start">DISTRIBUCIÓN</h3>
         <div className="w-full h-56 min-h-[224px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" cornerRadius={6} stroke="none">{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
         </div>
         <div className="flex flex-wrap justify-center gap-2 mt-2 text-xs font-medium">{pieData.map(d => (<div key={d.name} className="flex items-center gap-1.5 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full border border-white/20 dark:border-white/5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} /> <span className="text-slate-600 dark:text-zinc-300">{d.name}</span></div>))}</div>
      </div>
    </div>
  );
};

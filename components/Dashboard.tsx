
import React, { useMemo, useState, useEffect } from 'react';
import { InstallationRecord, InstallType, AppSettings, UserProfile } from '../types';
import { LABELS, COLORS } from '../constants';
import { StatsCard } from './StatsCard';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { DollarSign, Activity, Calendar, Zap, WifiOff, Settings, Target, ServerCrash, CloudOff, Flame, Signal } from 'lucide-react';

interface DashboardProps {
  records: InstallationRecord[];
  username: string;
  settings: AppSettings;
  navigateTo: (view: 'dashboard' | 'history' | 'settings') => void;
  backendStatus: 'checking' | 'connected' | 'disconnected' | 'disabled';
}

export const Dashboard: React.FC<DashboardProps> = ({ records, username, settings, navigateTo, backendStatus }) => {
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
  
  // Define types relevant to the current profile
  const relevantTypes = useMemo(() => {
     if (settings.profile === 'TECHNICIAN') {
       return [InstallType.SERVICE_BASIC, InstallType.SERVICE_REWIRING, InstallType.SERVICE_CORP];
     }
     // Default Installer types (includes generic SERVICE for legacy/mixed use)
     return [InstallType.RESIDENTIAL, InstallType.CORPORATE, InstallType.POSTE, InstallType.SERVICE];
  }, [settings.profile]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // en-CA gives YYY-MM-DD format
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthTotal = 0;
    let todayTotal = 0;
    let allTotal = 0;
    
    // Initialize count with 0 for ALL known types to avoid undefined
    const countByType: Record<string, number> = {};
    Object.values(InstallType).forEach(t => countByType[t] = 0);

    records.forEach(r => {
      const rDate = new Date(r.date);
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

  // Streak Calculation
  const streak = useMemo(() => {
    if (records.length === 0) return 0;
    const uniqueDates: string[] = Array.from<string>(new Set(records.map(r => new Date(r.date).toLocaleDateString('en-CA')))).sort().reverse();
    
    if (uniqueDates.length === 0) return 0;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      return 0;
    }

    let currentStreak = 1;
    let lastDate = new Date(uniqueDates[0]);

    for (let i = 1; i < uniqueDates.length; i++) {
      const currDate = new Date(uniqueDates[i]);
      const diffTime = Math.abs(lastDate.getTime() - currDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        currentStreak++;
        lastDate = currDate;
      } else {
        break;
      }
    }
    return currentStreak;
  }, [records]);

  // Pie Data filtered by profile relevant types
  const pieData = relevantTypes
    .map(type => ({
      name: LABELS[type],
      value: stats.countByType[type] || 0,
      color: COLORS[type]
    }))
    .filter(d => d.value > 0);

  // If no specific data found for profile, but there is other data, show "Otros"
  const otherTypesCount = records.filter(r => !relevantTypes.includes(r.type)).length;
  if (otherTypesCount > 0 && pieData.length === 0) {
     pieData.push({ name: 'Otros Registros', value: otherTypesCount, color: '#64748b' });
  }

  const chartData = useMemo(() => {
    const days = 7;
    const result = [];
    
    // Generate last 7 days based on LOCAL time
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA'); // YYY-MM-DD Local
      const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
      
      const dayAmount = records
        .filter(r => {
           const rLoc = new Date(r.date).toLocaleDateString('en-CA');
           return rLoc === dateStr;
        })
        .reduce((sum, r) => sum + r.amount, 0);

      result.push({ date: dayLabel.charAt(0), amount: dayAmount, fullDate: dateStr });
    }
    return result;
  }, [records]);

  const goalProgress = settings.monthlyGoal > 0 ? Math.min(100, (stats.monthTotal / settings.monthlyGoal) * 100) : 0;
  const circumference = 2 * Math.PI * 45; // r = 45
  const strokeDashoffset = circumference - (goalProgress / 100) * circumference;

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        colorClass: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
        text: 'SIN INTERNET',
        icon: <WifiOff size={12} />,
        indicatorColor: 'bg-zinc-500'
      };
    }
    if (backendStatus === 'disconnected') {
      return {
        colorClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        text: 'DESCONECTADO',
        icon: <ServerCrash size={12} />,
        indicatorColor: 'bg-red-500'
      };
    }
    if (backendStatus === 'checking') {
       return {
        colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        text: 'CONECTANDO...',
        icon: <CloudOff size={12} />,
        indicatorColor: 'bg-amber-500'
      };
    }
    return {
      colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      text: backendStatus === 'connected' ? 'ONLINE' : 'ONLINE (LOCAL)',
      icon: null,
      indicatorColor: 'bg-emerald-500',
      pulse: true
    };
  };

  const status = getStatusConfig();
  const roleLabel = settings.profile === 'TECHNICIAN' ? 'Servicio Técnico' : 'Instalaciones';

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-800 tracking-tight">Hola, {username || 'Técnico'}</h2>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-cyan-600 dark:text-zinc-500 text-sm font-medium">{roleLabel}</p>
             {streak > 0 && (
                <div className="flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-orange-500/20 animate-pulse">
                   <Flame size={10} fill="currentColor" /> {streak} DÍAS
                </div>
             )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
          <div className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full border font-bold transition-all duration-500 ${status.colorClass}`}>
            {status.pulse ? (
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.indicatorColor}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${status.indicatorColor}`}></span>
              </span>
            ) : status.icon ? (
              status.icon
            ) : (
              <span className={`h-2 w-2 rounded-full ${status.indicatorColor}`}></span>
            )}
            <span className="tracking-wider">{status.text}</span>
          </div>
        </div>
      </header>

      {/* Monthly Goal Section */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent animate-pulse" />
        <h3 className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-4 self-start flex items-center gap-2">
          <Target size={12} />
          META MENSUAL
        </h3>
        {settings.monthlyGoal > 0 ? (
          <div className="w-full flex flex-col items-center animate-scaleIn">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-slate-200 dark:text-zinc-800" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                  className="text-cyan-500"
                  strokeWidth="10"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%',
                    transition: 'stroke-dashoffset 0.8s ease-out'
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold dark:text-white text-slate-900">{Math.round(goalProgress)}%</span>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="font-bold text-lg dark:text-white text-slate-800">${stats.monthTotal.toFixed(0)} de ${settings.monthlyGoal}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-500">
                {stats.monthTotal >= settings.monthlyGoal
                  ? '¡Meta alcanzada! 🎉'
                  : `Faltan $${(settings.monthlyGoal - stats.monthTotal).toFixed(0)} para la meta`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 w-full animate-fadeIn">
            <Target size={32} className="mx-auto text-slate-400 dark:text-zinc-600 mb-2" />
            <p className="text-slate-600 dark:text-zinc-400 font-bold mb-1">Define un objetivo</p>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mb-4">Establece una meta de ingresos para ver tu progreso aquí.</p>
            <button
              onClick={() => navigateTo('settings')}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded-full hover:scale-105 transition-transform"
            >
              <Settings size={14} />
              Ir a Configuración
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatsCard title="HOY" value={`$${stats.todayTotal}`} icon={<Zap size={24} />} />
        <StatsCard title="ESTE MES" value={`$${stats.monthTotal}`} color="text-emerald-600 dark:text-emerald-400" icon={<Calendar size={24} />} />
        <StatsCard title="TOTAL AÑO" value={`$${stats.allTotal}`} color="text-violet-600 dark:text-violet-400" icon={<DollarSign size={24} />} />
         <StatsCard title="ACTIVIDADES" value={records.length} color="text-amber-600 dark:text-amber-400" icon={<Signal size={24} />} />
      </div>

      <div className="glass-panel rounded-3xl p-6">
        <h3 className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-6">INGRESOS (7 DÍAS)</h3>
        <div className="w-full h-56 min-h-[224px] relative">
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
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }}
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
         {pieData.length > 0 ? (
           <div className="w-full h-56 min-h-[224px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" cornerRadius={6} stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
           </div>
         ) : (
           <div className="w-full h-56 flex items-center justify-center text-slate-400 dark:text-zinc-600 text-xs italic">
             No hay datos de {roleLabel.toLowerCase()}
           </div>
         )}
         <div className="flex flex-wrap justify-center gap-2 mt-2 text-xs font-medium">
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

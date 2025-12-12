import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  color?: string; // Text color class
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subValue, color = "text-cyan-600 dark:text-white", icon }) => {
  return (
    <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group transition-transform hover:scale-[1.02]">
      <div className={`absolute top-0 right-0 p-3 opacity-10 dark:opacity-20 group-hover:opacity-30 transition-opacity ${color}`}>
        {icon}
      </div>
      
      <h3 className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">{title}</h3>
      
      <div className="flex items-end gap-2 relative z-10">
        <span className={`text-2xl font-bold tracking-tight ${color}`}>{value}</span>
        {subValue && <span className="text-slate-400 dark:text-zinc-600 text-xs mb-1 font-medium">{subValue}</span>}
      </div>
      
      {/* Crystal reflection effect */}
      <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rotate-45" />
    </div>
  );
};
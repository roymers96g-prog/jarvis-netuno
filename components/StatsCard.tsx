import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  color?: string;
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subValue, color = "text-cyan-400", icon }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl backdrop-blur-sm relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        {icon}
      </div>
      <h3 className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">{title}</h3>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        {subValue && <span className="text-slate-500 text-xs mb-1">{subValue}</span>}
      </div>
      {/* Decorative tech line */}
      <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-${color.replace('text-', 'bg-')}/50 to-transparent opacity-50`} />
    </div>
  );
};
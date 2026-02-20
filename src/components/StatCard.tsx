import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, isPositive, icon: Icon, color }) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-600',
    sky: 'bg-sky-500/10 text-sky-600',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl ${colorMap[color] || 'bg-slate-500/10 text-slate-600'}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {isPositive ? '+' : ''}{change}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
    </motion.div>
  );
};

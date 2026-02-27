import React from 'react';
import { LogEntry } from '../types';
import { Users, Clock, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

interface Props {
  logs: LogEntry[];
}

export default function SummaryBoard({ logs }: Props) {
  // Group by site
  const siteStats = logs.reduce((acc, log) => {
    if (!acc[log.siteId]) {
      acc[log.siteId] = { total: 0, late: 0, onTime: 0 };
    }
    acc[log.siteId].total += 1;
    if (log.status === 'Late') {
      acc[log.siteId].late += 1;
    } else {
      acc[log.siteId].onTime += 1;
    }
    return acc;
  }, {} as Record<string, { total: number, late: number, onTime: number }>);

  const totalStats = {
    total: logs.length,
    late: logs.filter(l => l.status === 'Late').length,
    onTime: logs.filter(l => l.status === 'On-time').length
  };

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Attendance</p>
            <p className="text-2xl font-bold text-slate-900">{totalStats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">On-Time</p>
            <p className="text-2xl font-bold text-emerald-600">{totalStats.onTime}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-rose-50 p-3 rounded-xl">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Late Arrivals</p>
            <p className="text-2xl font-bold text-rose-600">{totalStats.late}</p>
          </div>
        </div>
      </div>

      {/* Site Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <Building2 className="w-4 h-4 text-slate-400" />
          <h3 className="font-semibold text-slate-800">Site-wise Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-3 border-b border-slate-100">Site ID</th>
                <th className="px-6 py-3 border-b border-slate-100">Total People</th>
                <th className="px-6 py-3 border-b border-slate-100">On-Time</th>
                <th className="px-6 py-3 border-b border-slate-100">Late</th>
                <th className="px-6 py-3 border-b border-slate-100 text-right">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(siteStats).map(([siteId, stats]) => {
                const onTimeRate = ((stats.onTime / stats.total) * 100).toFixed(0);
                return (
                  <tr key={siteId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700">{siteId}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{stats.total}</td>
                    <td className="px-6 py-4 text-sm text-emerald-600 font-medium">{stats.onTime}</td>
                    <td className="px-6 py-4 text-sm text-rose-600 font-medium">{stats.late}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${Number(onTimeRate) > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${onTimeRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-500 w-8">{onTimeRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

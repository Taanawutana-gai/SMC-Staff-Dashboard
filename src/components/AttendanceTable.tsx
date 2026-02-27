import React from 'react';
import { LogEntry } from '../types';
import { Clock, MapPin, User, Building } from 'lucide-react';

interface Props {
  logs: LogEntry[];
  title: string;
}

export default function AttendanceTable({ logs, title }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          {title}
        </h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {logs.length} Records
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <th className="px-6 py-3 border-b border-slate-100">Staff</th>
              <th className="px-6 py-3 border-b border-slate-100">Site</th>
              <th className="px-6 py-3 border-b border-slate-100">Clock In</th>
              <th className="px-6 py-3 border-b border-slate-100">Clock Out</th>
              <th className="px-6 py-3 border-b border-slate-100">Working Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                  No data found
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {log.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{log.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">ID: {log.staffId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {log.siteId}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-700">{log.clockInTime}</div>
                      <div className="text-[10px] text-slate-400">{log.dateClockIn}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-700">{log.clockOutTime || '--:--'}</div>
                      <div className="text-[10px] text-slate-400">{log.dateClockOut || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {log.workingHours || '0:00'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

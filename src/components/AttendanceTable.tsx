import React from 'react';
import { LogEntry } from '../types';
import { Clock, Building, User, AlertCircle, CheckCircle2, X } from 'lucide-react';

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
            <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
              <th className="px-6 py-3 border-b border-slate-100">Site ID</th>
              <th className="px-6 py-3 border-b border-slate-100">Name (ชื่อ)</th>
              <th className="px-6 py-3 border-b border-slate-100">Shift Code</th>
              <th className="px-6 py-3 border-b border-slate-100">Start Time (เข้างาน)</th>
              <th className="px-6 py-3 border-b border-slate-100">End Time (เลิกงาน)</th>
              <th className="px-6 py-3 border-b border-slate-100">สถานะ สาย/ไม่สาย</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic text-sm">
                  ไม่พบข้อมูลบันทึกเวลา (Logs) ในช่วงเวลานี้
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {log.siteId}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                        {log.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{log.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tighter">ID: {log.staffId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {log.shiftCode || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">{log.clockInTime}</div>
                    <div className="text-[10px] text-slate-400">{log.dateClockIn}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">{log.clockOutTime || '--:--'}</div>
                    <div className="text-[10px] text-slate-400">{log.dateClockOut || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      log.status === 'Late' 
                        ? 'bg-rose-50 text-rose-700 border-rose-100' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {log.status === 'Late' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {log.status === 'Late' ? 'สาย' : 'ไม่สาย'}
                    </div>
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

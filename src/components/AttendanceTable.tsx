import React from 'react';
import { AttendanceRecord } from '../types';
import { MapPin, Clock, User, Hash } from 'lucide-react';

interface AttendanceTableProps {
  title: string;
  records: AttendanceRecord[];
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({ title, records }) => {
  return (
    <div className="ig-card overflow-hidden">
      <div className="p-4 border-b border-[#DBDBDB] bg-[#FAFAFA]">
        <h3 className="font-bold text-[#262626] text-sm">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white">
              <th className="data-grid-header"><div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Site ID</div></th>
              <th className="data-grid-header"><div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Name</div></th>
              <th className="data-grid-header"><div className="flex items-center gap-1.5"><Hash className="w-3 h-3" /> Shift</div></th>
              <th className="data-grid-header"><div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Start</div></th>
              <th className="data-grid-header"><div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> End</div></th>
              <th className="data-grid-header">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#8E8E8E] text-sm">
                  ไม่พบข้อมูลการบันทึกเวลา
                </td>
              </tr>
            ) : (
              records.map((record, idx) => (
                <tr key={`${record.siteId}-${record.name}-${idx}`} className="data-grid-row">
                  <td className="py-3 px-4 text-sm font-medium text-[#262626]">{record.siteId}</td>
                  <td className="py-3 px-4 text-sm text-[#262626]">{record.name}</td>
                  <td className="py-3 px-4 text-xs text-[#8E8E8E] font-mono">{record.shiftCode}</td>
                  <td className="py-3 px-4 text-sm text-[#262626]">{record.startTime}</td>
                  <td className="py-3 px-4 text-sm text-[#262626]">{record.endTime}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${
                      record.status === 'สาย' ? 'bg-rose-50 text-rose-600' :
                      record.status === 'ไม่สาย' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      {record.status}
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
};

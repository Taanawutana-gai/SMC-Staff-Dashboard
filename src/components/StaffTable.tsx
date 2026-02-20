import React from 'react';
import { StaffMember } from '../types';
import { MoreHorizontal, Mail, MapPin, Clock } from 'lucide-react';

interface StaffTableProps {
  staff: StaffMember[];
}

export const StaffTable: React.FC<StaffTableProps> = ({ staff }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'remote': return 'bg-sky-500';
      case 'on-leave': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Staff Directory</h3>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="data-grid-header">Staff Member</th>
              <th className="data-grid-header">Department</th>
              <th className="data-grid-header">Status</th>
              <th className="data-grid-header">Last Active</th>
              <th className="data-grid-header"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="data-grid-row">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-10 h-10 rounded-full border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-slate-600">{member.department}</span>
                </td>
                <td className="py-4 px-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                    member.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                    member.status === 'remote' ? 'bg-sky-50 text-sky-700' :
                    member.status === 'on-leave' ? 'bg-amber-50 text-amber-700' :
                    'bg-slate-50 text-slate-700'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {member.lastActive}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

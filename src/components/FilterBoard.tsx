import React from 'react';
import { Filter, Calendar, MapPin, User } from 'lucide-react';

interface FilterBoardProps {
  startDate: string;
  endDate: string;
  siteId: string;
  staffId: string;
  sites: string[];
  staff: { id: string, name: string }[];
  onFilterChange: (key: string, value: string) => void;
}

export const FilterBoard: React.FC<FilterBoardProps> = ({ 
  startDate, endDate, siteId, staffId, sites, staff, onFilterChange 
}) => {
  return (
    <div className="ig-card p-6 space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-[#DBDBDB]">
        <Filter className="w-5 h-5 text-[#262626]" />
        <h3 className="font-bold text-[#262626]">ตัวกรองข้อมูล</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#8E8E8E] uppercase flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> เริ่มต้น
          </label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="ig-input w-full"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#8E8E8E] uppercase flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> สิ้นสุด
          </label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            className="ig-input w-full"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#8E8E8E] uppercase flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Site ID
          </label>
          <select 
            value={siteId}
            onChange={(e) => onFilterChange('siteId', e.target.value)}
            className="ig-input w-full appearance-none"
          >
            <option value="">ทั้งหมด</option>
            {sites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#8E8E8E] uppercase flex items-center gap-1.5">
            <User className="w-3 h-3" /> Staff ID
          </label>
          <select 
            value={staffId}
            onChange={(e) => onFilterChange('staffId', e.target.value)}
            className="ig-input w-full appearance-none"
          >
            <option value="">ทั้งหมด</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

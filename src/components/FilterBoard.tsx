import React from 'react';
import { FilterState } from '../types';
import { Calendar, Building, User, Search, X } from 'lucide-react';

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  sites: string[];
  staffIds: string[];
}

export default function FilterBoard({ filters, setFilters, sites, staffIds }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      siteId: '',
      staffId: ''
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-600" />
          Dashboard Filters
        </h2>
        <button 
          onClick={resetFilters}
          className="text-xs font-medium text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <X className="w-3 h-3" />
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            Date Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <span className="text-slate-300">to</span>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Site Filter */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-3 h-3" />
            Site ID
          </label>
          <select
            name="siteId"
            value={filters.siteId}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
          >
            <option value="">All Sites</option>
            {sites.map(site => (
              <option key={site} value={site}>{site}</option>
            ))}
          </select>
        </div>

        {/* Staff Filter */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3 h-3" />
            Staff ID
          </label>
          <select
            name="staffId"
            value={filters.staffId}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
          >
            <option value="">All Staff</option>
            {staffIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>

        {/* Quick Info */}
        <div className="flex items-end">
          <div className="w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Active Filters</p>
            <p className="text-xs text-indigo-700 font-medium">
              {[filters.startDate, filters.siteId, filters.staffId].filter(Boolean).length || 'None'} active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

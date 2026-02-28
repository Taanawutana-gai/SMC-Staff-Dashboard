import React, { useState, useEffect, useMemo } from 'react';
import { LogEntry, RawData, FilterState, Employee, Shift } from './types';
import AttendanceTable from './components/AttendanceTable';
import FilterBoard from './components/FilterBoard';
import { RefreshCw, AlertCircle, Database, LayoutDashboard, CalendarDays, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { format, subDays, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';

export default function App() {
  const [rawData, setRawData] = useState<{ logs: LogEntry[], employees: Employee[], shifts: Shift[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    siteId: '',
    staffId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const GAS_URL = 'https://script.google.com/macros/s/AKfycbyvRUhqBoxy7NuozelXiI2azcpSo0pwI7A8TJJfMNZEt-mwVtq8Z7QvXD-5m-aVGu9LyA/exec';
      const params = new URLSearchParams({
        action: 'getData',
        t: Date.now().toString()
      });
      
      const res = await fetch(`${GAS_URL}?${params.toString()}`, {
        method: 'GET',
        redirect: 'follow'
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      
      const raw: RawData = JSON.parse(text);
      
      // Process Shifts
      const shifts: Shift[] = raw.shifts.slice(1).map(row => ({
        shiftCode: String(row[0] || ''),
        shiftName: String(row[1] || ''),
        startTime: String(row[2] || ''),
        endTime: String(row[3] || ''),
        gracePeriod: Number(row[4] || 0),
        lateThreshold: Number(row[5] || 0)
      }));

      // Process Employees
      const employees: Employee[] = raw.employees.slice(1).map(row => ({
        lineId: String(row[0] || ''),
        staffId: String(row[1] || ''),
        name: String(row[2] || ''),
        siteId: String(row[3] || ''),
        roleType: String(row[4] || ''),
        position: String(row[5] || '')
      }));

      // Process Logs with Status Calculation
      const logs: LogEntry[] = raw.logs.slice(1).map(row => {
        const staffId = String(row[0] || '');
        const rawClockIn = String(row[3] || '');
        const rawClockOut = String(row[7] || '');
        const rawDate = String(row[2] || '');

        // Helper to extract HH:mm from various formats
        const formatTime = (timeStr: string) => {
          if (!timeStr || timeStr === '-') return timeStr;
          // If it's a full ISO string or has a space (date time)
          if (timeStr.includes('T') || timeStr.includes(' ')) {
            const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr.split(' ')[1];
            if (timePart) {
              const parts = timePart.split(':');
              return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
            }
          }
          // If it's already HH:mm:ss or HH:mm
          const parts = timeStr.split(':');
          if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
          }
          return timeStr;
        };

        const clockInTime = formatTime(rawClockIn);
        const clockOutTime = formatTime(rawClockOut);
        
        // Normalize date to yyyy-MM-dd (Extremely Robust Version)
        let formattedDate = '';
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            // If JS can parse it, use it (handles ISO, GMT, etc.)
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            formattedDate = `${y}-${m}-${day}`;
          } else if (rawDate.includes('/')) {
            const parts = rawDate.split(' ')[0].split('/');
            if (parts.length === 3) {
              // Handle DD/MM/YYYY or YYYY/MM/DD
              if (parts[0].length === 4) { // YYYY/MM/DD
                formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              } else { // DD/MM/YYYY
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                formattedDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
          } else if (rawDate.includes('-')) {
            const parts = rawDate.split(' ')[0].split('-');
            if (parts.length === 3) {
              if (parts[0].length === 4) { // YYYY-MM-DD
                formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              } else { // DD-MM-YYYY
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                formattedDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
          }
        } catch (e) {
          console.error("Date parsing error for:", rawDate, e);
        }

        // Fallback if formatting failed
        if (!formattedDate) formattedDate = rawDate;

        const shift = shifts[0]; 
        let status: 'On-time' | 'Late' = 'On-time';
        if (clockInTime && shift) {
          const [cHours, cMins] = clockInTime.split(':').map(Number);
          const [sHours, sMins] = shift.startTime.split(':').map(Number);
          const clockInTotalMins = (cHours || 0) * 60 + (cMins || 0);
          const shiftStartTotalMins = (sHours || 0) * 60 + (sMins || 0);
          if (clockInTotalMins > shiftStartTotalMins + (shift.lateThreshold || 0)) {
            status = 'Late';
          }
        }

        return {
          staffId,
          name: String(row[1] || ''),
          dateClockIn: formattedDate,
          clockInTime,
          clockInLat: String(row[4] || ''),
          clockInLong: String(row[5] || ''),
          dateClockOut: String(row[6] || ''),
          clockOutTime,
          clockOutLat: String(row[8] || ''),
          clockOutLong: String(row[9] || ''),
          siteId: String(row[10] || ''),
          workingHours: String(row[11] || ''),
          shiftCode: shift?.shiftCode,
          status
        };
      });

      setRawData({ logs, employees, shifts });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    if (!rawData) return [];
    return rawData.logs.filter(log => {
      const matchSite = !filters.siteId || log.siteId === filters.siteId;
      const matchStaff = !filters.staffId || log.staffId === filters.staffId;
      
      let matchDate = true;
      if (filters.startDate || filters.endDate) {
        const logDate = parseISO(log.dateClockIn);
        const start = filters.startDate ? startOfDay(parseISO(filters.startDate)) : new Date(0);
        const end = filters.endDate ? endOfDay(parseISO(filters.endDate)) : new Date(8640000000000000);
        matchDate = isWithinInterval(logDate, { start, end });
      }
      
      return matchSite && matchStaff && matchDate;
    });
  }, [rawData, filters]);

  // Yesterday's Logs (Logs ONLY)
  const yesterdayLogs = useMemo(() => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    return filteredLogs
      .filter(log => log.dateClockIn === yesterday)
      .sort((a, b) => a.siteId.localeCompare(b.siteId) || a.clockInTime.localeCompare(b.clockInTime));
  }, [filteredLogs]);

  // Today's Logs (Logs ONLY)
  const todayLogs = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return filteredLogs
      .filter(log => log.dateClockIn === today)
      .sort((a, b) => a.siteId.localeCompare(b.siteId) || a.clockInTime.localeCompare(b.clockInTime));
  }, [filteredLogs]);

  const uniqueSites = useMemo(() => Array.from(new Set(rawData?.employees.map(e => e.siteId) || [])), [rawData]);
  const uniqueStaffIds = useMemo(() => Array.from(new Set(rawData?.employees.map(e => e.staffId) || [])), [rawData]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-800">SMC Staff Analytics</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Data Dashboard v2.0</p>
            </div>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50 border border-slate-200 bg-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Data
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold">System Error</p>
              <p className="opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Board 1: Filter */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <FilterBoard 
            filters={filters} 
            setFilters={setFilters} 
            sites={uniqueSites} 
            staffIds={uniqueStaffIds} 
          />
        </motion.section>

        {loading && !rawData ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Initializing Dashboard...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8">
              {/* Dashboard 2: Yesterday */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-xl font-bold text-slate-800">Dashboard 2: Yesterday's Attendance</h2>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {format(subDays(new Date(), 1), 'MMM dd, yyyy')}
                  </span>
                </div>
                <AttendanceTable logs={yesterdayLogs} title="Yesterday Detailed View" />
              </motion.section>

              {/* Dashboard 3: Today */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-xl font-bold text-slate-800">Dashboard 3: Today's Real-time View</h2>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {format(new Date(), 'MMM dd, yyyy')}
                  </span>
                </div>
                <AttendanceTable logs={todayLogs} title="Current Day Detailed View" />
              </motion.section>
            </div>
          </>
        )}
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3" />
          Sheet ID: 1q9elvW0...
        </div>
        <p>© 2026 SMC Analytics Dashboard • All Systems Operational</p>
      </footer>
    </div>
  );
}

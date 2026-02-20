import React, { useState, useEffect, useCallback } from 'react';
import { AuthOverlay } from './components/AuthOverlay';
import { FilterBoard } from './components/FilterBoard';
import { SummaryBoard } from './components/SummaryBoard';
import { AttendanceTable } from './components/AttendanceTable';
import { LogEntry, Employee, Shift, AttendanceRecord } from './types';
import { format, isWithinInterval, parseISO, subDays, isSameDay } from 'date-fns';
import { LogOut, RefreshCw, BarChart2 } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    logs: LogEntry[];
    employees: Employee[];
    shifts: Shift[];
  } | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    siteId: '',
    staffId: ''
  });

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const { isAuthenticated } = await res.json();
      setIsAuthenticated(isAuthenticated);
      if (isAuthenticated) fetchData();
    } catch (e) {
      setIsAuthenticated(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sheets/data');
      if (!res.ok) throw new Error('Failed to fetch');
      const raw = await res.json();
      
      // Process raw arrays to objects
      const logs: LogEntry[] = raw.logs.slice(1).map((row: any[]) => ({
        staffId: row[0], name: row[1], dateClockIn: row[2], clockInTime: row[3],
        clockInLat: row[4], clockInLong: row[5], dateClockOut: row[6], clockOutTime: row[7],
        clockOutLat: row[8], clockOutLong: row[9], siteId: row[10], workingHours: row[11]
      }));

      const employees: Employee[] = raw.employees.slice(1).map((row: any[]) => ({
        lineId: row[0], staffId: row[1], name: row[2], siteId: row[3], roleType: row[4], position: row[5]
      }));

      const shifts: Shift[] = raw.shifts.slice(1).map((row: any[]) => ({
        shiftCode: row[0], shiftName: row[1], startTime: row[2], endTime: row[3],
        gracePeriod: parseInt(row[4] || '0'), lateThreshold: row[5]
      }));

      setData({ logs, employees, shifts });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    const handleAuthSuccess = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') checkAuth();
    };
    window.addEventListener('message', handleAuthSuccess);
    return () => window.removeEventListener('message', handleAuthSuccess);
  }, []);

  const handleConnect = async () => {
    const res = await fetch('/api/auth/url');
    const { url } = await res.json();
    window.open(url, 'oauth_popup', 'width=600,height=700');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setData(null);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getProcessedRecords = useCallback((targetDate?: Date) => {
    if (!data) return [];

    return data.logs
      .filter(log => {
        const logDate = parseISO(log.dateClockIn);
        const dateMatch = targetDate 
          ? isSameDay(logDate, targetDate)
          : isWithinInterval(logDate, { 
              start: parseISO(filters.startDate), 
              end: parseISO(filters.endDate) 
            });
        
        const siteMatch = !filters.siteId || log.siteId === filters.siteId;
        const staffMatch = !filters.staffId || log.staffId === filters.staffId;
        
        return dateMatch && siteMatch && staffMatch;
      })
      .map(log => {
        const employee = data.employees.find(e => e.staffId === log.staffId);
        // Assuming shift is determined by some logic, here we'll just find the first shift for simplicity
        // or a default one. In real app, you'd match by employee's assigned shift.
        const shift = data.shifts[0]; 
        
        // Late calculation
        let status: 'สาย' | 'ไม่สาย' | 'ไม่ได้ทำงาน' = 'ไม่สาย';
        if (log.clockInTime && shift) {
          const [inH, inM] = log.clockInTime.split(':').map(Number);
          const [sH, sM] = shift.startTime.split(':').map(Number);
          const inTotal = inH * 60 + inM;
          const sTotal = sH * 60 + sM + shift.gracePeriod;
          if (inTotal > sTotal) status = 'สาย';
        }

        return {
          siteId: log.siteId,
          name: log.name,
          shiftCode: shift?.shiftCode || 'N/A',
          startTime: log.clockInTime,
          endTime: log.clockOutTime,
          status
        } as AttendanceRecord;
      })
      .sort((a, b) => a.siteId.localeCompare(b.siteId) || a.startTime.localeCompare(b.startTime));
  }, [data, filters]);

  if (isAuthenticated === null) return null;
  if (!isAuthenticated) return <AuthOverlay onConnect={handleConnect} />;

  const allRecords = getProcessedRecords();
  const yesterdayRecords = getProcessedRecords(subDays(new Date(), 1));
  const todayRecords = getProcessedRecords(new Date());

  const stats = {
    total: allRecords.length,
    late: allRecords.filter(r => r.status === 'สาย').length,
    onTime: allRecords.filter(r => r.status === 'ไม่สาย').length
  };

  const sites = Array.from(new Set(data?.employees.map(e => e.siteId) || []));
  const staff = data?.employees.map(e => ({ id: e.staffId, name: e.name })) || [];

  return (
    <div className="min-h-screen pb-20">
      {/* Navbar */}
      <nav className="sticky top-0 bg-white border-b border-[#DBDBDB] z-40 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SMC Analytics</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-2 hover:bg-slate-50 rounded-full transition-colors text-[#262626]"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-slate-50 rounded-full transition-colors text-rose-500"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Board 1: Filters */}
        <FilterBoard 
          startDate={filters.startDate}
          endDate={filters.endDate}
          siteId={filters.siteId}
          staffId={filters.staffId}
          sites={sites}
          staff={staff}
          onFilterChange={handleFilterChange}
        />

        {/* Board 2: Summary */}
        <SummaryBoard 
          total={stats.total}
          late={stats.late}
          onTime={stats.onTime}
        />

        {/* Board 3: Yesterday */}
        <AttendanceTable 
          title="ข้อมูลการลงเวลา - เมื่อวานนี้"
          records={yesterdayRecords}
        />

        {/* Board 4: Today */}
        <AttendanceTable 
          title="ข้อมูลการลงเวลา - วันนี้"
          records={todayRecords}
        />
      </main>
    </div>
  );
}

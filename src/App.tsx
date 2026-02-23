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

  const formatTo24h = (val: any) => {
    if (!val) return '';
    const str = String(val);
    // If it's already HH:mm or HH:mm:ss
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
      const [h, m] = str.split(':');
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }
    // Try parsing as date
    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      return format(date, 'HH:mm');
    }
    return str;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sheets/data');
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch: ${res.status} ${errText}`);
      }
      const raw = await res.json();
      console.log('Raw data from GAS:', raw);

      if (!raw.logs || !raw.employees || !raw.shifts) {
        throw new Error('Data structure is invalid. Check Sheet names (Logs, Employ_DB, Shift_DB)');
      }
      
      // Process raw arrays to objects with safety checks
      const logs: LogEntry[] = (raw.logs || []).slice(1)
        .filter((row: any[]) => row.length >= 2) // Must have at least staffId and name
        .map((row: any[]) => ({
          staffId: String(row[0] || ''), 
          name: String(row[1] || ''), 
          dateClockIn: String(row[2] || ''), 
          clockInTime: formatTo24h(row[3]),
          clockInLat: String(row[4] || ''), 
          clockInLong: String(row[5] || ''), 
          dateClockIn_out: String(row[6] || ''), // Fixed typo in mapping if needed, but keeping original structure
          dateClockOut: String(row[6] || ''), 
          clockOutTime: formatTo24h(row[7]),
          clockOutLat: String(row[8] || ''), 
          clockOutLong: String(row[9] || ''), 
          siteId: String(row[10] || ''), 
          workingHours: String(row[11] || '')
        }));

      const employees: Employee[] = (raw.employees || []).slice(1)
        .filter((row: any[]) => row.length >= 2)
        .map((row: any[]) => ({
          lineId: String(row[0] || ''), 
          staffId: String(row[1] || ''), 
          name: String(row[2] || ''), 
          siteId: String(row[3] || ''), 
          roleType: String(row[4] || ''), 
          position: String(row[5] || '')
        }));

      const shifts: Shift[] = (raw.shifts || []).slice(1)
        .filter((row: any[]) => row.length >= 2)
        .map((row: any[]) => ({
          shiftCode: String(row[0] || ''), 
          shiftName: String(row[1] || ''), 
          startTime: formatTo24h(row[2]), 
          endTime: formatTo24h(row[3]),
          gracePeriod: parseInt(String(row[4] || '0')), 
          lateThreshold: String(row[5] || '')
        }));

      setData({ logs, employees, shifts });
      
      // If no logs found, maybe adjust filter to show something
      if (logs.length > 0) {
        const dates = logs.map(l => new Date(l.dateClockIn).getTime()).filter(t => !isNaN(t));
        if (dates.length > 0) {
          const minDate = new Date(Math.min(...dates));
          const maxDate = new Date(Math.max(...dates));
          setFilters(prev => ({
            ...prev,
            startDate: format(minDate, 'yyyy-MM-dd'),
            endDate: format(maxDate, 'yyyy-MM-dd')
          }));
        }
      }
    } catch (e: any) {
      console.error('Fetch Error:', e);
      alert(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${e.message}\nกรุณาตรวจสอบว่าได้ Deploy GAS เป็น Web App และตั้งค่า Access เป็น Anyone แล้ว`);
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
        let status: 'สาย' | 'ไม่สาย' | 'ผิดปกติ' = 'ไม่สาย';
        if (log.clockInTime && shift) {
          const [inH, inM] = log.clockInTime.split(':').map(Number);
          const [sH, sM] = shift.startTime.split(':').map(Number);
          const inTotal = inH * 60 + inM;
          const sTotal = sH * 60 + sM + shift.gracePeriod;
          if (inTotal > sTotal) status = 'สาย';
        } else if (!log.clockInTime) {
          status = 'ผิดปกติ';
        }

        return {
          siteId: log.siteId,
          name: log.name,
          shiftCode: shift?.shiftCode || 'N/A',
          dateStart: log.dateClockIn ? format(parseISO(log.dateClockIn), 'dd/MM/yyyy') : '-',
          startTime: log.clockInTime || '-',
          dateEnd: log.dateClockOut ? format(parseISO(log.dateClockOut), 'dd/MM/yyyy') : '-',
          endTime: log.clockOutTime || '-',
          status
        } as AttendanceRecord;
      })
      .sort((a, b) => a.siteId.localeCompare(b.siteId) || a.startTime.localeCompare(b.startTime));
  }, [data, filters]);

  if (isAuthenticated === null) return null;
  // AuthOverlay removed for GAS proxy mode

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
            {data && (
              <div className="hidden md:block text-[10px] text-[#8E8E8E] font-mono bg-slate-50 px-2 py-1 rounded border border-[#DBDBDB]">
                Logs: {data.logs.length} | Staff: {data.employees.length} | Shifts: {data.shifts.length}
              </div>
            )}
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

        {data && data.logs.length === 0 && !loading && (
          <div className="ig-card p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-[#DBDBDB]">
              <BarChart2 className="w-8 h-8 text-slate-300" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-[#262626]">ไม่พบข้อมูลใน Google Sheets</h3>
              <p className="text-sm text-[#8E8E8E]">กรุณาตรวจสอบว่าใน Sheet "Logs" มีข้อมูลการบันทึกเวลาแล้ว</p>
            </div>
          </div>
        )}

        {data && data.logs.length > 0 && allRecords.length === 0 && !loading && (
          <div className="ig-card p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-[#DBDBDB]">
              <RefreshCw className="w-8 h-8 text-slate-300" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-[#262626]">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</h3>
              <p className="text-sm text-[#8E8E8E]">ลองเปลี่ยนช่วงวันที่หรือตัวกรองอื่นๆ</p>
              <button 
                onClick={() => fetchData()}
                className="text-indigo-600 text-sm font-semibold mt-4 hover:underline"
              >
                รีเซ็ตตัวกรองและดึงข้อมูลใหม่
              </button>
            </div>
          </div>
        )}

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

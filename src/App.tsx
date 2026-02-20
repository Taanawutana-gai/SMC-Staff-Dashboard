import React, { useState, useEffect, useCallback } from 'react';
import { Login } from './components/Login';
import { FilterBoard } from './components/FilterBoard';
import { SummaryBoard } from './components/SummaryBoard';
import { AttendanceTable } from './components/AttendanceTable';
import { LogEntry, Employee, Shift, AttendanceRecord } from './types';
import { format, isWithinInterval, parseISO, subDays, isSameDay } from 'date-fns';
import { LogOut, RefreshCw, BarChart2, AlertCircle } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<{ name: string; position: string } | null>(null);
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
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
      setUser(data.user);
      if (data.isAuthenticated) fetchData();
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

  const safeParseDate = (dateStr: string) => {
    if (!dateStr) return new Date(NaN);
    const str = String(dateStr).trim();
    
    // ถ้าเป็น ISO Format อยู่แล้ว (เช่น จาก JSON.stringify ของ GAS)
    if (str.includes('T') && !isNaN(Date.parse(str))) {
      return new Date(str);
    }

    const cleanStr = str.split(' ')[0]; // ตัดส่วนเวลาออก
    
    if (cleanStr.includes('/') || cleanStr.includes('-')) {
      const separator = cleanStr.includes('/') ? '/' : '-';
      const parts = cleanStr.split(separator);
      if (parts.length === 3) {
        let d, m, y;
        // ตรวจสอบว่าเป็น YYYY-MM-DD หรือ DD/MM/YYYY
        if (parts[0].length === 4) {
          [y, m, d] = parts.map(Number);
        } else {
          [d, m, y] = parts.map(Number);
        }
        
        if (y > 2500) y -= 543;
        if (y < 100) y += 2000;
        return new Date(y, m - 1, d);
      }
    }
    
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? new Date(NaN) : parsed;
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
      console.log('Processed data from GAS:', raw);

      if (!raw.logs || !raw.employees || !raw.shifts) {
        throw new Error('Data structure is invalid. Check Sheet names (Logs, Employ_DB, Shift_DB)');
      }
      
      // 1. Process Employees FIRST so we can use them to discover columns in Logs
      const employees: Employee[] = (raw.employees || []).slice(1)
        .filter((row: any[]) => row.length >= 2 && row[1])
        .map((row: any[]) => ({
          lineId: String(row[0] || ''), 
          staffId: String(row[1] || '').trim(), 
          name: String(row[2] || '').trim(), 
          siteId: String(row[3] || '').trim(), 
          roleType: String(row[4] || ''), 
          position: String(row[5] || '')
        }));

      // 2. Process Logs using discovered employees for column matching
      const logs: LogEntry[] = (raw.logs || []).slice(1)
        .filter((row: any[]) => row.length >= 2) 
        .map((row: any[]) => {
          let staffId = '';
          let staffIdx = -1;
          let dateIdx = -1;
          let timeIdx = -1;
          
          // ค้นหา Staff ID
          for (let i = 0; i < Math.min(row.length, 5); i++) {
            const val = String(row[i] || '').trim();
            if (employees.some(e => e.staffId === val)) {
              staffId = val;
              staffIdx = i;
              break;
            }
          }

          // ค้นหาคอลัมน์วันที่และเวลา (สแกนทั้งแถว)
          for (let i = 0; i < row.length; i++) {
            const val = String(row[i] || '').trim();
            if (dateIdx === -1 && (val.includes('/') || (val.includes('-') && val.length >= 8))) {
              dateIdx = i;
            } else if (timeIdx === -1 && val.includes(':') && val.length <= 8) {
              timeIdx = i;
            }
          }

          // Fallback ถ้าหาไม่เจอ
          if (staffIdx === -1) staffIdx = 0;
          if (dateIdx === -1) dateIdx = staffIdx + 2;
          if (timeIdx === -1) timeIdx = staffIdx + 3;

          return {
            staffId: staffId || String(row[staffIdx] || '').trim(), 
            name: String(row[staffIdx + 1] || '').trim(), 
            dateClockIn: String(row[dateIdx] || '').trim(), 
            clockInTime: formatTo24h(row[timeIdx]),
            clockInLat: String(row[timeIdx + 1] || ''), 
            clockInLong: String(row[timeIdx + 2] || ''), 
            dateClockOut: String(row[timeIdx + 3] || '').trim(), 
            clockOutTime: formatTo24h(row[timeIdx + 4]),
            clockOutLat: String(row[timeIdx + 5] || ''), 
            clockOutLong: String(row[timeIdx + 6] || ''), 
            siteId: String(row[timeIdx + 7] || '').trim(), 
            workingHours: String(row[timeIdx + 8] || '')
          };
        })
        .filter(log => log.staffId && log.staffId !== 'undefined' && log.staffId !== '');

      // 3. Process Shifts
      const shifts: Shift[] = (raw.shifts || []).slice(1)
        .filter((row: any[]) => row.length >= 2)
        .map((row: any[]) => ({
          shiftCode: String(row[0] || '').trim(), 
          shiftName: String(row[1] || ''), 
          startTime: formatTo24h(row[2]), 
          endTime: formatTo24h(row[3]),
          gracePeriod: parseInt(String(row[4] || '0')), 
          lateThreshold: String(row[5] || '')
        }));

      setData({ logs, employees, shifts });
      
      // ปรับปรุงการหาช่วงวันที่: ถ้าหาไม่เจอให้ใช้ 30 วันย้อนหลังเป็นค่าเริ่มต้น
      let minDate = subDays(new Date(), 30);
      let maxDate = new Date();

      if (logs.length > 0) {
        const dates = logs.map(l => safeParseDate(l.dateClockIn).getTime()).filter(t => !isNaN(t));
        if (dates.length > 0) {
          minDate = new Date(Math.min(...dates));
          maxDate = new Date(Math.max(...dates));
        }
      }

      setFilters(prev => ({
        ...prev,
        startDate: format(minDate, 'yyyy-MM-dd'),
        endDate: format(maxDate, 'yyyy-MM-dd')
      }));
    } catch (e: any) {
      console.error('Fetch Error:', e);
      alert(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${e.message}`);
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
    setUser(null);
    setData(null);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const [showAll, setShowAll] = useState(false);

  const getProcessedRecords = useCallback((targetDate?: Date) => {
    if (!data) return [];

    return data.logs
      .filter(log => {
        if (showAll) return true;
        
        const logDate = safeParseDate(log.dateClockIn);
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
          dateStart: log.dateClockIn ? format(safeParseDate(log.dateClockIn), 'dd/MM/yyyy') : '-',
          startTime: log.clockInTime || '-',
          dateEnd: log.dateClockOut ? format(safeParseDate(log.dateClockOut), 'dd/MM/yyyy') : '-',
          endTime: log.clockOutTime || '-',
          status
        } as AttendanceRecord;
      })
      .sort((a, b) => a.siteId.localeCompare(b.siteId) || a.startTime.localeCompare(b.startTime));
  }, [data, filters, showAll]);

  if (isAuthenticated === null) return null;
  if (!isAuthenticated) {
    return <Login onLogin={(user) => {
      setIsAuthenticated(true);
      setUser(user);
      fetchData();
    }} />;
  }

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
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight leading-none">SMC Analytics</h1>
                {user && <span className="text-[10px] text-[#8E8E8E] font-medium">{user.name} ({user.position})</span>}
              </div>
            </div>
          <div className="flex items-center gap-4">
            {data && (
              <div className="flex gap-2">
                <div className="hidden md:block text-[10px] text-[#8E8E8E] font-mono bg-slate-50 px-2 py-1 rounded border border-[#DBDBDB]">
                  Logs: <span className={data.logs.length > 0 ? 'text-emerald-600 font-bold' : 'text-rose-500'}>{data.logs.length}</span>
                </div>
                <div className="hidden md:block text-[10px] text-[#8E8E8E] font-mono bg-slate-50 px-2 py-1 rounded border border-[#DBDBDB]">
                  Staff: <span className={data.employees.length > 0 ? 'text-emerald-600 font-bold' : 'text-rose-500'}>{data.employees.length}</span>
                </div>
              </div>
            )}
            <button 
              onClick={() => setShowAll(!showAll)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                showAll 
                ? 'bg-amber-500 text-white border-amber-600 shadow-inner' 
                : 'bg-white text-[#8E8E8E] border-[#DBDBDB] hover:bg-slate-50'
              }`}
            >
              {showAll ? 'SHOWING ALL' : 'SHOW ALL'}
            </button>
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
          <div className="space-y-6">
            <div className="ig-card p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-[#DBDBDB]">
                <RefreshCw className="w-8 h-8 text-slate-300" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#262626]">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</h3>
                <p className="text-sm text-[#8E8E8E]">ลองเปลี่ยนช่วงวันที่หรือตัวกรองอื่นๆ</p>
              </div>
            </div>

            {/* Diagnostic View */}
            <div className="ig-card overflow-hidden border-rose-200">
              <div className="p-4 bg-rose-50 border-b border-rose-200">
                <h3 className="font-bold text-rose-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> โหมดตรวจสอบข้อมูล (Diagnostic Mode)
                </h3>
                <p className="text-xs text-rose-600 mt-1">ระบบดึงข้อมูลมาได้ {data.logs.length} แถว แต่ไม่สามารถแสดงผลได้เนื่องจากเงื่อนไขการกรอง หรือโครงสร้างข้อมูลไม่ตรงกัน</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      {Array.from({ length: Math.min(data.logs[0] ? Object.keys(data.logs[0]).length : 0, 10) }).map((_, i) => (
                        <th key={i} className="p-2 border border-slate-200 font-mono">Col {i}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.logs.slice(0, 5).map((log, i) => (
                      <tr key={i}>
                        <td className="p-2 border border-slate-200 font-mono">{log.staffId}</td>
                        <td className="p-2 border border-slate-200 font-mono">{log.name}</td>
                        <td className="p-2 border border-slate-200 font-mono">{log.dateClockIn}</td>
                        <td className="p-2 border border-slate-200 font-mono">{log.clockInTime}</td>
                        <td className="p-2 border border-slate-200 font-mono">{log.siteId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 text-[10px] text-[#8E8E8E]">
                <p>คำแนะนำ: ตรวจสอบว่า "รหัสพนักงาน" ในตารางด้านบน ตรงกับรหัสในหน้า Employ_DB หรือไม่ และ "วันที่" อยู่ในรูปแบบที่ถูกต้องหรือไม่</p>
              </div>
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

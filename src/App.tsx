import React, { useState, useEffect, useMemo } from 'react';
import { LogEntry, RawData, FilterState, Employee, Shift } from './types';
import AttendanceTable from './components/AttendanceTable';
import FilterBoard from './components/FilterBoard';
import LoginPage from './components/LoginPage';
import { RefreshCw, AlertCircle, Database, LayoutDashboard, CalendarDays, Clock, LogOut, User as UserIcon, History, Printer } from 'lucide-react';
import { motion } from 'motion/react';
import { format, subDays, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const THAILAND_TZ = 'Asia/Bangkok';

export default function App() {
  const [rawData, setRawData] = useState<{ logs: LogEntry[], employees: Employee[], shifts: Shift[], siteConfigs: { siteId: string, name: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    siteId: '',
    staffId: ''
  });

  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Check for existing session
  useEffect(() => {
    const savedUser = localStorage.getItem('smc_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
      // We need to fetch data after setting logged in
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    setLoginError(null);
    try {
      const GAS_URL = 'https://script.google.com/macros/s/AKfycbyvRUhqBoxy7NuozelXiI2azcpSo0pwI7A8TJJfMNZEt-mwVtq8Z7QvXD-5m-aVGu9LyA/exec';
      const params = new URLSearchParams({ action: 'getData', t: Date.now().toString() });
      const res = await fetch(`${GAS_URL}?${params.toString()}`, { method: 'GET', redirect: 'follow' });
      const text = await res.text();
      const raw: RawData = JSON.parse(text);

      // Find employee in Employ_DB (raw.employees)
      // Column C: Name (Username), Column B: staff id (Password)
      // Column F: Position
      const employeeRow = raw.employees.slice(1).find(row => {
        const name = String(row[2] || '').trim();
        const staffId = String(row[1] || '').trim();
        
        return name === username.trim() && staffId === password.trim();
      });

      if (employeeRow) {
        const user: Employee = {
          lineId: String(employeeRow[0] || ''),
          staffId: String(employeeRow[1] || ''),
          name: String(employeeRow[2] || ''),
          siteId: String(employeeRow[3] || ''),
          roleType: String(employeeRow[4] || ''),
          position: String(employeeRow[5] || '')
        };
        
        setCurrentUser(user);
        setIsLoggedIn(true);
        localStorage.setItem('smc_user', JSON.stringify(user));
        
        // Process full data after login
        processRawData(raw);
      } else {
        setLoginError('Invalid Name or Staff ID.');
      }
    } catch (err: any) {
      setLoginError('Connection error. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setRawData(null);
    localStorage.removeItem('smc_user');
  };

  const processRawData = (raw: RawData) => {
    const shifts: Shift[] = raw.shifts.slice(1).map(row => ({
      shiftCode: String(row[0] || ''),
      shiftName: String(row[1] || ''),
      startTime: String(row[2] || ''),
      endTime: String(row[3] || ''),
      gracePeriod: Number(row[4] || 0),
      lateThreshold: Number(row[5] || 0)
    }));

    const employees: Employee[] = raw.employees.slice(1).map(row => ({
      lineId: String(row[0] || ''),
      staffId: String(row[1] || ''),
      name: String(row[2] || ''),
      siteId: String(row[3] || ''),
      roleType: String(row[4] || ''),
      position: String(row[5] || '')
    }));

    const logs: LogEntry[] = raw.logs.slice(1).map(row => {
      const staffId = String(row[0] || '');
      const rawClockIn = String(row[3] || '');
      const rawClockOut = String(row[7] || '');
      const rawDate = String(row[2] || '');

      const formatTime = (timeStr: string) => {
        if (!timeStr || timeStr === '-' || timeStr === 'null' || timeStr === 'undefined') return '-';
        if (timeStr.length > 10 && (timeStr.includes('T') || timeStr.includes('GMT') || (timeStr.includes('-') && timeStr.includes(':')))) {
          try {
            const d = new Date(timeStr);
            if (!isNaN(d.getTime())) {
              const zoned = toZonedTime(d, THAILAND_TZ);
              return format(zoned, 'HH:mm');
            }
          } catch (e) {}
        }
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{1,2})/);
        if (timeMatch) {
          return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2].padStart(2, '0')}`;
        }
        return timeStr.trim();
      };

      const clockInTime = formatTime(rawClockIn);
      const clockOutTime = formatTime(rawClockOut);
      
      let formattedDate = '';
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const zoned = toZonedTime(d, THAILAND_TZ);
          formattedDate = format(zoned, 'yyyy-MM-dd');
        } else if (rawDate.includes('/')) {
          const parts = rawDate.split(' ')[0].split('/');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else {
              const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              formattedDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        }
      } catch (e) {}
      if (!formattedDate) formattedDate = rawDate;

      const shift = shifts[0]; 
      let status: 'On-time' | 'Late' = 'On-time';
      if (clockInTime && clockInTime !== '-' && shift) {
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

    const siteConfigs = Array.isArray(raw.siteConfigs) 
      ? raw.siteConfigs.slice(1).map(row => ({
          siteId: String(row[0] || ''),
          name: String(row[5] || '') // Column F: Name
        }))
      : [];

    setRawData({ logs, employees, shifts, siteConfigs });
    setLastSynced(format(toZonedTime(new Date(), THAILAND_TZ), 'HH:mm:ss'));
  };

  const fetchData = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError(null);
    try {
      const GAS_URL = 'https://script.google.com/macros/s/AKfycbyvRUhqBoxy7NuozelXiI2azcpSo0pwI7A8TJJfMNZEt-mwVtq8Z7QvXD-5m-aVGu9LyA/exec';
      const params = new URLSearchParams({ action: 'getData', t: Date.now().toString() });
      const res = await fetch(`${GAS_URL}?${params.toString()}`, { method: 'GET', redirect: 'follow' });
      const text = await res.text();
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const raw: RawData = JSON.parse(text);
      processRawData(raw);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const uniqueSites = useMemo(() => {
    if (!rawData || !currentUser) return [];
    
    const currentUserName = currentUser.name.trim().toLowerCase();
    
    // Find all sites for this user in Employ_DB
    const userSites = rawData.employees
      .filter(e => e.name.trim().toLowerCase() === currentUserName)
      .map(e => e.siteId)
      .filter(Boolean);

    return Array.from(new Set(userSites)).sort();
  }, [rawData, currentUser]);

  const uniqueStaffIds = useMemo(() => {
    if (!rawData || !currentUser || uniqueSites.length === 0) return [];
    
    const staffMap = new Map<string, string>();
    rawData.employees.forEach(e => {
      if (uniqueSites.includes(e.siteId)) {
        staffMap.set(e.staffId, e.name);
      }
    });

    return Array.from(staffMap.entries())
      .map(([staffId, name]) => ({ staffId, name }))
      .sort((a, b) => a.staffId.localeCompare(b.staffId));
  }, [rawData, currentUser, uniqueSites]);

  // Base logs restricted to user's authorized sites
  const authorizedLogs = useMemo(() => {
    if (!rawData || uniqueSites.length === 0) return [];
    return rawData.logs.filter(log => uniqueSites.includes(log.siteId));
  }, [rawData, uniqueSites]);

  // Filtered Logs (For Dashboard 4 and general filtering)
  const filteredLogs = useMemo(() => {
    return authorizedLogs.filter(log => {
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
  }, [authorizedLogs, filters]);

  // Yesterday's Logs (Dashboard 3) - Shows all staff in authorized sites for yesterday
  // Ignores date filters but respects Site/Staff filters if selected
  const yesterdayLogs = useMemo(() => {
    const nowInThailand = toZonedTime(new Date(), THAILAND_TZ);
    const yesterday = format(subDays(nowInThailand, 1), 'yyyy-MM-dd');
    
    return authorizedLogs
      .filter(log => {
        const matchDate = log.dateClockIn === yesterday;
        const matchSite = !filters.siteId || log.siteId === filters.siteId;
        const matchStaff = !filters.staffId || log.staffId === filters.staffId;
        return matchDate && matchSite && matchStaff;
      })
      .sort((a, b) => a.siteId.localeCompare(b.siteId) || a.clockInTime.localeCompare(b.clockInTime));
  }, [authorizedLogs, filters.siteId, filters.staffId]);

  // Today's Logs (Dashboard 2) - Shows all staff in authorized sites for today
  // Ignores date filters but respects Site/Staff filters if selected
  const todayLogs = useMemo(() => {
    const nowInThailand = toZonedTime(new Date(), THAILAND_TZ);
    const today = format(nowInThailand, 'yyyy-MM-dd');
    
    return authorizedLogs
      .filter(log => {
        const matchDate = log.dateClockIn === today;
        const matchSite = !filters.siteId || log.siteId === filters.siteId;
        const matchStaff = !filters.staffId || log.staffId === filters.staffId;
        return matchDate && matchSite && matchStaff;
      })
      .sort((a, b) => a.siteId.localeCompare(b.siteId) || a.clockInTime.localeCompare(b.clockInTime));
  }, [authorizedLogs, filters.siteId, filters.staffId]);

  // Dashboard 4: Full History Logs (Sorted by Site ID and Date Clock-in)
  const fullHistoryLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      const siteCompare = a.siteId.localeCompare(b.siteId);
      if (siteCompare !== 0) return siteCompare;
      return a.dateClockIn.localeCompare(b.dateClockIn);
    });
  }, [filteredLogs]);

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} error={loginError} loading={loading} />;
  }

  const isManager = currentUser?.position === 'Operation Manager' || currentUser?.position === 'General Manager';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-800">SMC Staff Dashboard</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Data Dashboard v2.0</p>
                {lastSynced && (
                  <span className="text-[9px] text-indigo-400 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50">
                    Synced: {lastSynced}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-900 leading-tight">{currentUser?.name}</p>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider leading-tight">{currentUser?.position}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50 border border-slate-200 bg-white"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync Data</span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95 border border-transparent hover:border-rose-100"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
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
              {/* Dashboard 2: Today */}
              {isManager && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-xl font-bold text-slate-800">Dashboard 2: Today's Real-time View</h2>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {format(toZonedTime(new Date(), THAILAND_TZ), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <AttendanceTable logs={todayLogs} title="Current Day Detailed View" />
                </motion.section>
              )}

              {/* Dashboard 3: Yesterday */}
              {isManager && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-bold text-slate-800">Dashboard 3: Yesterday's Attendance</h2>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {format(subDays(toZonedTime(new Date(), THAILAND_TZ), 1), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <AttendanceTable logs={yesterdayLogs} title="Yesterday Detailed View" />
                </motion.section>
              )}

              {/* Dashboard 4: Full Logs */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="print-section"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-500" />
                    <h2 className="text-xl font-bold text-slate-800">Dashboard 4: Full Attendance Logs</h2>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Filtered Results
                    </span>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-100 no-print"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Table
                  </button>
                </div>
                <AttendanceTable logs={fullHistoryLogs} title="Complete Filtered History" isHistory={true} />
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

import React, { useState, useEffect } from 'react';
import { LogEntry, RawData } from './types';
import AttendanceTable from './components/AttendanceTable';
import { RefreshCw, AlertCircle, Database, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [data, setData] = useState<{ logs: LogEntry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // ดึงข้อมูลโดยตรงจาก GAS (Client-side fetch)
      const GAS_URL = 'https://script.google.com/macros/s/AKfycbyvRUhqBoxy7NuozelXiI2azcpSo0pwI7A8TJJfMNZEt-mwVtq8Z7QvXD-5m-aVGu9LyA/exec';
      const params = new URLSearchParams({
        action: 'getData',
        t: Date.now().toString()
      });
      
      const res = await fetch(`${GAS_URL}?${params.toString()}`, {
        method: 'GET',
        redirect: 'follow' // สำคัญมากสำหรับการดึงข้อมูลจาก GAS
      });

      const text = await res.text();
      
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} - ${text.substring(0, 100)}`);
      }
      
      const raw: RawData = JSON.parse(text);
      
      // Process Logs (Skip header row)
      const logs: LogEntry[] = raw.logs.slice(1).map(row => ({
        staffId: String(row[0] || ''),
        name: String(row[1] || ''),
        dateClockIn: String(row[2] || ''),
        clockInTime: String(row[3] || ''),
        clockInLat: String(row[4] || ''),
        clockInLong: String(row[5] || ''),
        dateClockOut: String(row[6] || ''),
        clockOutTime: String(row[7] || ''),
        clockOutLat: String(row[8] || ''),
        clockOutLong: String(row[9] || ''),
        siteId: String(row[10] || ''),
        workingHours: String(row[11] || '')
      }));

      // Sort by date/time descending to show "last data" first
      const sortedLogs = [...logs].reverse();

      setData({ logs: sortedLogs });
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">SMC Analytics</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Attendance System</p>
            </div>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Connection Error</p>
              <p className="text-xs opacity-80">{error}</p>
              <p className="text-xs mt-2 font-medium">Please ensure your Google Apps Script is deployed as a Web App with access set to "Anyone".</p>
            </div>
          </motion.div>
        )}

        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">Loading attendance data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview (Optional but nice) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Logs</p>
                <p className="text-3xl font-bold text-slate-900">{data?.logs.length || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Unique Staff</p>
                <p className="text-3xl font-bold text-slate-900">
                  {new Set(data?.logs.map(l => l.staffId)).size}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Sites</p>
                <p className="text-3xl font-bold text-slate-900">
                  {new Set(data?.logs.map(l => l.siteId)).size}
                </p>
              </div>
            </div>

            {/* Main Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <AttendanceTable 
                logs={data?.logs || []} 
                title="Recent Attendance Logs" 
              />
            </motion.div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-200 mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5" />
            Connected to Google Sheet: 1q9elvW0...
          </div>
          <p>© 2026 SMC Attendance System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

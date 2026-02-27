import React, { useState } from 'react';
import { Lock, User, BarChart2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[350px] space-y-4">
        {/* Logo Section */}
        <div className="bg-white border border-[#DBDBDB] p-10 flex flex-col items-center space-y-6 rounded-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <BarChart2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight italic">SMC Analytics</h1>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="ชื่อพนักงาน (Username)"
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-[3px] px-3 py-2 text-sm focus:border-[#A8A8A8] outline-none transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="รหัสพนักงาน (Password)"
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-[3px] px-3 py-2 text-sm focus:border-[#A8A8A8] outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0095F6] hover:bg-[#1877F2] disabled:bg-[#B2DFFC] text-white font-semibold py-1.5 rounded-[4px] text-sm transition-colors mt-2"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {error && (
            <div className="flex items-start gap-2 text-rose-500 text-xs mt-4 bg-rose-50 p-3 rounded w-full border border-rose-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-white border border-[#DBDBDB] p-6 text-center rounded-sm">
          <p className="text-sm text-[#262626]">
            เฉพาะระดับ <span className="font-semibold">Operation Manager</span> หรือ <span className="font-semibold">General Manager</span> เท่านั้น
          </p>
        </div>

        <div className="text-center space-y-4 pt-4">
          <p className="text-[12px] text-[#8E8E8E] uppercase tracking-widest font-semibold">
            SMC Staff Analytics Dashboard
          </p>
          <p className="text-[12px] text-[#8E8E8E]">
            © 2026 SMC Analytics from Google Sheets
          </p>
        </div>
      </div>
    </div>
  );
};

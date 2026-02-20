import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Bell, 
  Settings, 
  LogOut,
  Search,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'directory', icon: Users, label: 'Staff Directory' },
    { id: 'tasks', icon: CheckSquare, label: 'Operations' },
    { id: 'schedule', icon: Calendar, label: 'Schedule' },
    { id: 'announcements', icon: Bell, label: 'Announcements' },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
          S
        </div>
        <span className="text-xl font-bold text-white tracking-tight">SMC Staff</span>
      </div>

      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search portal..." 
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {item.label}
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
            <img src="https://picsum.photos/seed/admin/100/100" alt="Admin" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin User</p>
            <p className="text-xs text-slate-500 truncate">admin@smc.edu</p>
          </div>
          <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};

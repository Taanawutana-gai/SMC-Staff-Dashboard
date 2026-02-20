import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { StaffTable } from './components/StaffTable';
import { TaskBoard } from './components/TaskBoard';
import { Announcements } from './components/Announcements';
import { MOCK_STAFF, MOCK_TASKS, MOCK_ANNOUNCEMENTS } from './mockData';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Filter,
  Download,
  Plus,
  Bell
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const CHART_DATA = [
  { name: 'CS', count: 45, color: '#6366f1' },
  { name: 'Ops', count: 32, color: '#0ea5e9' },
  { name: 'Adm', count: 28, color: '#f59e0b' },
  { name: 'Tech', count: 38, color: '#10b981' },
  { name: 'Acad', count: 22, color: '#8b5cf6' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Staff" 
                value="142" 
                change="12%" 
                isPositive={true} 
                icon={Users} 
                color="indigo" 
              />
              <StatCard 
                title="Active Now" 
                value="86" 
                change="4%" 
                isPositive={true} 
                icon={TrendingUp} 
                color="emerald" 
              />
              <StatCard 
                title="Pending Tasks" 
                value="24" 
                change="2" 
                isPositive={false} 
                icon={Clock} 
                color="amber" 
              />
              <StatCard 
                title="Completed" 
                value="1,284" 
                change="18%" 
                isPositive={true} 
                icon={CheckCircle2} 
                color="sky" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-8">
                {/* Activity Chart */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="font-bold text-slate-900">Staff Distribution</h3>
                      <p className="text-xs text-slate-500">Headcount by department</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                        <Filter className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={CHART_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#94a3b8' }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#94a3b8' }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                          {CHART_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Staff Table */}
                <StaffTable staff={MOCK_STAFF} />
              </div>

              {/* Sidebar Content Area */}
              <div className="space-y-8">
                <Announcements announcements={MOCK_ANNOUNCEMENTS} />
                <TaskBoard tasks={MOCK_TASKS} />
              </div>
            </div>
          </div>
        );
      case 'directory':
        return (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Staff Directory</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">
                <Plus className="w-4 h-4" />
                Add Staff
              </button>
            </div>
            <StaffTable staff={[...MOCK_STAFF, ...MOCK_STAFF]} />
          </motion.div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <Clock className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Section Under Development</p>
            <p className="text-sm">This module will be available in the next update.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'dashboard' ? 'Good morning, Admin' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-slate-500 mt-1">Here's what's happening at SMC today.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">Friday, March 20</p>
              <p className="text-xs text-slate-500">09:42 AM</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer">
              <Bell className="w-5 h-5" />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

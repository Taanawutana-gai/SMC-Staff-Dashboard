import React from 'react';
import { Task } from '../types';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface TaskBoardProps {
  tasks: Task[];
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-rose-600 bg-rose-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-sky-500" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Operational Tasks</h3>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">+ New Task</button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task, index) => (
          <motion.div 
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4 flex items-center gap-4 group cursor-pointer hover:border-indigo-200 transition-all"
          >
            <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-indigo-50 transition-colors">
              {getStatusIcon(task.status)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 truncate">{task.title}</h4>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Calendar className="w-3 h-3" />
                  Due {task.dueDate}
                </div>
              </div>
            </div>
            <div className="flex -space-x-2">
              <img 
                src={`https://picsum.photos/seed/${task.assigneeId}/50/50`} 
                alt="Assignee" 
                className="w-7 h-7 rounded-full border-2 border-white"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

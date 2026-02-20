import React from 'react';
import { Announcement } from '../types';
import { Bell, Megaphone, PartyPopper, Info } from 'lucide-react';

interface AnnouncementsProps {
  announcements: Announcement[];
}

export const Announcements: React.FC<AnnouncementsProps> = ({ announcements }) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'urgent': return <Megaphone className="w-5 h-5 text-rose-500" />;
      case 'event': return <PartyPopper className="w-5 h-5 text-indigo-500" />;
      default: return <Info className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-5 h-5 text-slate-400" />
        <h3 className="font-bold text-slate-900">Recent Announcements</h3>
      </div>
      <div className="space-y-6">
        {announcements.map((item) => (
          <div key={item.id} className="flex gap-4 group cursor-pointer">
            <div className="mt-1">{getIcon(item.category)}</div>
            <div className="flex-1 border-b border-slate-100 pb-4 group-last:border-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">{item.date}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                {item.content}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  Posted by {item.author}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all">
        View All Announcements
      </button>
    </div>
  );
};

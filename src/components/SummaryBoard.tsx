import React from 'react';
import { Users, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface SummaryBoardProps {
  total: number;
  late: number;
  onTime: number;
}

export const SummaryBoard: React.FC<SummaryBoardProps> = ({ total, late, onTime }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="ig-card p-6 flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-[#DBDBDB]">
          <Users className="w-6 h-6 text-[#262626]" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-[#8E8E8E] uppercase">จำนวนคนทั้งหมด</p>
          <h4 className="text-2xl font-bold text-[#262626]">{total}</h4>
        </div>
      </motion.div>

      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="ig-card p-6 flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
          <Clock className="w-6 h-6 text-rose-500" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-[#8E8E8E] uppercase">มาสาย</p>
          <h4 className="text-2xl font-bold text-rose-500">{late}</h4>
        </div>
      </motion.div>

      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="ig-card p-6 flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-[#8E8E8E] uppercase">มาตรงเวลา</p>
          <h4 className="text-2xl font-bold text-emerald-500">{onTime}</h4>
        </div>
      </motion.div>
    </div>
  );
};

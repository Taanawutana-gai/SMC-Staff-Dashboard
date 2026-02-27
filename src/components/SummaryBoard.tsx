import React from 'react';
import { Users, Clock, CheckCircle, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface SiteStat {
  siteId: string;
  total: number;
  late: number;
  onTime: number;
}

interface SummaryBoardProps {
  siteStats: SiteStat[];
}

export const SummaryBoard: React.FC<SummaryBoardProps> = ({ siteStats }) => {
  const grandTotal = siteStats.reduce((acc, curr) => acc + curr.total, 0);
  const grandLate = siteStats.reduce((acc, curr) => acc + curr.late, 0);
  const grandOnTime = siteStats.reduce((acc, curr) => acc + curr.onTime, 0);

  return (
    <div className="space-y-6">
      {/* Grand Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ scale: 1.01 }} className="ig-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-[#DBDBDB]">
            <Users className="w-6 h-6 text-[#262626]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#8E8E8E] uppercase">จำนวนคนทั้งหมด (รวม)</p>
            <h4 className="text-2xl font-bold text-[#262626]">{grandTotal}</h4>
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.01 }} className="ig-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
            <Clock className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#8E8E8E] uppercase">มาสาย (รวม)</p>
            <h4 className="text-2xl font-bold text-rose-500">{grandLate}</h4>
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.01 }} className="ig-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#8E8E8E] uppercase">มาตรงเวลา (รวม)</p>
            <h4 className="text-2xl font-bold text-emerald-500">{grandOnTime}</h4>
          </div>
        </motion.div>
      </div>

      {/* Site-wise Summary */}
      <div className="ig-card overflow-hidden">
        <div className="p-4 border-b border-[#DBDBDB] bg-[#FAFAFA]">
          <h3 className="font-bold text-[#262626] text-sm">สรุปราย Site</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="data-grid-header"><div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Site ID</div></th>
                <th className="data-grid-header">จำนวนคนมาทำงาน</th>
                <th className="data-grid-header">สาย</th>
                <th className="data-grid-header">ตรงเวลา</th>
              </tr>
            </thead>
            <tbody>
              {siteStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#8E8E8E] text-sm">ไม่มีข้อมูล</td>
                </tr>
              ) : (
                siteStats.map((stat) => (
                  <tr key={stat.siteId} className="data-grid-row">
                    <td className="py-3 px-4 text-sm font-bold text-[#262626]">{stat.siteId}</td>
                    <td className="py-3 px-4 text-sm text-[#262626]">{stat.total}</td>
                    <td className="py-3 px-4 text-sm text-rose-500 font-bold">{stat.late}</td>
                    <td className="py-3 px-4 text-sm text-emerald-500 font-bold">{stat.onTime}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

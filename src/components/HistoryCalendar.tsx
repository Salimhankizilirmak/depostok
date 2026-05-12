"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

interface Movement {
  id: string;
  type: string;
  quantity: number;
  createdAt: string;
}

interface HistoryCalendarProps {
  data: Movement[];
}

export default function HistoryCalendar({ data }: HistoryCalendarProps) {
  const t = useTranslations("History");
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Hareketleri tarihe göre grupla (YYYY-MM-DD)
  const groupedData = data.reduce((acc, h) => {
    const dateKey = new Date(h.createdAt).toISOString().split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = { in: 0, out: 0 };
    if (h.type === "in") acc[dateKey].in += h.quantity;
    else if (h.type === "out") acc[dateKey].out += h.quantity;
    return acc;
  }, {} as Record<string, { in: number; out: number }>);

  const days = [];
  // Boş hücreler (Ayın başladığı günden önceki günler)
  for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
    days.push(null);
  }
  // Ayın günleri
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const navigateMonth = (step: number) => {
    const nextDate = new Date(year, month + step, 1);
    setCurrentDate(nextDate);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Takvim Başlık */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
        <h3 className="text-white font-bold text-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all active:scale-95 text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-[10px] font-bold text-violet-400 hover:text-white uppercase tracking-widest active:scale-95">Bugün</button>
          <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all active:scale-95 text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

      {/* Takvim Grid */}
      <div className="p-4 bg-slate-900/30">
        {/* Haftanın Günleri */}
        <div className="grid grid-cols-7 mb-2">
          {["Pzt", "Sal", "Çar", "Per", "Cuma", "Cmt", "Paz"].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Günler */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="aspect-[4/3] rounded-2xl bg-slate-950/20" />;
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData = groupedData[dateStr];
            const isToday = new Date().toISOString().split("T")[0] === dateStr;

            return (
              <div 
                key={dateStr}
                className={`aspect-[4/3] rounded-2xl border transition-all p-2 flex flex-col justify-between group cursor-default ${
                  isToday ? "bg-violet-600/10 border-violet-500/30 ring-1 ring-violet-500/20" : "bg-slate-950/40 border-slate-800/50 hover:border-slate-700"
                }`}
              >
                <span className={`text-xs font-bold ${isToday ? "text-violet-400" : "text-slate-500"} mb-1`}>{day}</span>
                
                {dayData && (
                  <div className="space-y-1">
                    {dayData.in > 0 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md px-1.5 py-0.5 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-emerald-400 leading-none">+{dayData.in}</span>
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      </div>
                    )}
                    {dayData.out > 0 && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-md px-1.5 py-0.5 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-red-400 leading-none">-{dayData.out}</span>
                        <div className="w-1 h-1 rounded-full bg-red-500" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

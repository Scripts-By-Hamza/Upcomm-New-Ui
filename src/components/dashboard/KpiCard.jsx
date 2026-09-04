import React from 'react';
import { ArrowRight } from 'lucide-react';

export function KpiCard({ title, value, icon: Icon, color = 'blue', subtitle, onClick }) {
  const themes = {
    blue: {
      bg: 'bg-[#EFF6FF] border-[#BFDBFE]/80 hover:border-blue-300',
      title: 'text-[#2563EB]',
      value: 'text-[#1D4ED8]',
      badge: 'bg-[#DBEAFE] text-[#1E40AF]',
      subtitle: 'text-[#2563EB] hover:text-[#1D4ED8]',
    },
    green: {
      bg: 'bg-[#F0FDF4] border-[#BBF7D0]/80 hover:border-emerald-300',
      title: 'text-[#166534]',
      value: 'text-[#15803D]',
      badge: 'bg-[#DCFCE7] text-[#15803D]',
      subtitle: 'text-[#166534] hover:text-[#15803D]',
    },
    yellow: {
      bg: 'bg-[#FFFBEB] border-[#FDE68A]/80 hover:border-amber-300',
      title: 'text-[#92400E]',
      value: 'text-[#B45309]',
      badge: 'bg-[#FEF3C7] text-[#92400E]',
      subtitle: 'text-[#92400E] hover:text-[#B45309]',
    },
    red: {
      bg: 'bg-[#FEF2F2] border-[#FECACA]/80 hover:border-rose-300',
      title: 'text-[#991B1B]',
      value: 'text-[#B91C1C]',
      badge: 'bg-[#FEE2E2] text-[#991B1B]',
      subtitle: 'text-[#991B1B] hover:text-[#B91C1C]',
    },
  };

  const t = themes[color] || themes.blue;

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-3xl border ${t.bg} transition-all duration-200 flex flex-col justify-between shadow-2xs ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-extrabold uppercase tracking-wider ${t.title}`}>
            {title}
          </span>
          {Icon && (
            <div className={`p-2.5 rounded-2xl ${t.badge} flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        <h3 className={`text-4xl sm:text-5xl font-black tracking-tight mt-3 ${t.value}`}>
          {value}
        </h3>
      </div>

      {subtitle && (
        <div className={`mt-4 pt-3 flex items-center justify-between text-xs font-bold ${t.subtitle}`}>
          <span>{subtitle}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      )}
    </div>
  );
}

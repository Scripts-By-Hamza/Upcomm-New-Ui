import React from 'react';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const baseClasses = "inline-flex items-center font-semibold rounded-full tracking-wide font-['Inter']";
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[12px] leading-[16px] font-semibold',
    md: 'px-2.5 py-1 text-[12px] leading-[16px] font-semibold',
    lg: 'px-3 py-1.5 text-[14px] leading-[20px] font-semibold',
  };

  const variants = {
    // Status badges
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    in_progress: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    overdue: 'bg-red-50 text-red-700 border border-red-200 animate-pulse',
    due_soon: 'bg-yellow-50 text-yellow-800 border border-yellow-300',

    // Priority badges
    low: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    medium: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    high: 'bg-orange-50 text-orange-700 border border-orange-200',
    urgent: 'bg-rose-50 text-rose-700 border border-rose-200',

    // Generic
    assistant: 'bg-teal-50 text-teal-800 border border-teal-200',
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    brand: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variants[variant] || variants.default} ${className}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {children}
    </span>
  );
}

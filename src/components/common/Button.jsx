import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  icon: Icon = null,
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98] whitespace-nowrap font-[\'Inter\']';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-[12px] leading-[16px] font-semibold gap-1.5',
    md: 'px-4 py-2 text-[14px] leading-[20px] font-semibold gap-2',
    lg: 'px-5 py-2.5 text-[14px] leading-[20px] font-semibold gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-emerald-200',
    secondary:
      'bg-slate-800 hover:bg-slate-900 text-white focus:ring-slate-700',
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus:ring-emerald-500',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-400 shadow-none',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-rose-200',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

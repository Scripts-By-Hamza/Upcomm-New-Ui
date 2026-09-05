import React from 'react';

export function Avatar({
  src,
  name = 'User',
  size = 'md',
  className = '',
  showRoleBadge = false,
  role = '',
  user,
}) {
  const avatarSrc = user?.avatar_url || src;
  const avatarName = user?.full_name || name || 'User';
  const avatarRole = user?.role || role || '';

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
    '3xl': 'w-28 h-28 text-3xl',
  };

  const initials = avatarName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  const roleColors = {
    admin: 'bg-emerald-700 text-white',
    hod: 'bg-emerald-600 text-white',
    team_member: 'bg-emerald-500 text-white',
    it_support_admin: 'bg-amber-600 text-white',
  };

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full flex-shrink-0 ${className}`}>
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={avatarName}
          className={`${sizeClasses[size] || 'w-8 h-8'} rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0 aspect-square`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div
          className={`${sizeClasses[size] || 'w-8 h-8'} rounded-full bg-emerald-600 text-white font-semibold flex items-center justify-center ring-2 ring-white shadow-sm flex-shrink-0 aspect-square`}
        >
          {initials}
        </div>
      )}

      {showRoleBadge && avatarRole && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full px-1 py-0.2 text-[9px] font-bold ring-1 ring-white ${
            roleColors[avatarRole] || 'bg-gray-600 text-white'
          }`}
          title={`Role: ${avatarRole.replace('_', ' ')}`}
        >
          {avatarRole === 'admin'
            ? 'ADM'
            : avatarRole === 'hod'
            ? 'HOD'
            : avatarRole === 'it_support_admin'
            ? 'IT'
            : 'MBR'}
        </span>
      )}
    </div>
  );
}

export default Avatar;

import React from 'react';

/**
 * Universal Unread Count Badge
 * - Formats 1-9 as exact numbers, 10+ as "9+"
 * - Completely hides when count is 0 or falsy
 * - Uses accessible title/aria-label with full numeric count
 * - Supports Light & Dark themes
 */
export function UnreadBadge({
  count = 0,
  className = '',
  size = 'default', // 'default' | 'sm' | 'dot'
  variant = 'blue',  // 'blue'
}) {
  const numericCount = typeof count === 'number' ? count : parseInt(count, 10) || 0;
  if (numericCount <= 0) return null;

  const displayCount = numericCount > 9 ? '9+' : String(numericCount);
  const accessibleLabel = `${numericCount} unread comment${numericCount === 1 ? '' : 's'}`;

  if (size === 'dot') {
    return (
      <span
        className={`w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] ring-1 ring-white dark:ring-[#18181B] shrink-0 ${className}`}
        title={accessibleLabel}
        aria-label={accessibleLabel}
      />
    );
  }

  const sizeClasses =
    size === 'sm'
      ? 'h-[16px] min-w-[16px] px-1 text-[9.5px]'
      : 'h-[18px] min-w-[18px] px-1.5 text-[10.5px]';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold leading-none text-white bg-[#2563EB] dark:bg-[#3B82F6] shadow-xs select-none shrink-0 ${sizeClasses} ${className}`}
      title={accessibleLabel}
      aria-label={accessibleLabel}
    >
      {displayCount}
    </span>
  );
}

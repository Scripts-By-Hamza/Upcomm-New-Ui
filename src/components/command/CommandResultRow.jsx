import React, { useRef, useEffect } from 'react';
import { Avatar } from '../common/Avatar';
import {
  Plus,
  ClipboardPlus,
  ListTodo,
  Building2,
  Users,
  CornerDownLeft,
  CheckSquare,
  User,
} from 'lucide-react';

export function CommandResultRow({
  item,
  isSelected,
  onSelect,
  onMouseEnter,
}) {
  const rowRef = useRef(null);

  // Scroll into view if selected by keyboard navigation
  useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [isSelected]);

  // Determine icon to render
  const renderIcon = () => {
    if (item.type === 'user' && item.rawEntity) {
      return (
        <Avatar
          src={item.rawEntity.avatar_url}
          name={item.rawEntity.full_name || 'User'}
          size="xs"
          className="flex-shrink-0"
        />
      );
    }

    const IconComponent = item.icon || (
      item.type === 'task' ? ListTodo :
      item.type === 'department' ? Building2 :
      item.type === 'action' ? Plus :
      item.type === 'nav' ? CheckSquare :
      ListTodo
    );

    let iconColor = 'text-[#71717A]';
    if (item.id === 'action-create-task' || item.id === 'action-create-personal') {
      iconColor = 'text-[#059669]';
    }

    return (
      <div className="w-6 h-6 rounded-[6px] bg-[#F4F4F5] flex items-center justify-center flex-shrink-0 text-[#71717A]">
        <IconComponent className={`w-3.5 h-3.5 ${iconColor}`} />
      </div>
    );
  };

  return (
    <div
      ref={rowRef}
      id={item.id}
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      className={`relative flex items-center justify-between px-3 py-2 rounded-[8px] cursor-pointer transition-colors select-none ${
        isSelected ? 'bg-[#F1F3F5] text-[#18181B]' : 'hover:bg-[#F5F6F8] text-[#18181B]'
      }`}
    >
      {/* Left: Icon / Avatar + Title / Secondary */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
        {renderIcon()}

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-[#18181B] truncate leading-tight">
            {item.title || item.label}
          </div>
          {item.secondary && (
            <div className="text-[11px] text-[#71717A] truncate mt-0.5 leading-tight font-normal">
              {item.secondary}
            </div>
          )}
        </div>
      </div>

      {/* Right: Shortcut badge or Enter Indicator */}
      <div className="flex items-center gap-1.5 flex-shrink-0 text-[#8B8B95]">
        {item.shortcut && (
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-[#71717A] bg-[#F4F4F5] border border-[#E4E4E7] rounded-[4px]">
            {item.shortcut}
          </span>
        )}
        {isSelected && (
          <span className="inline-flex items-center text-[#71717A]" title="Press Enter to open">
            <CornerDownLeft className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}

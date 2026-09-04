import React, { useState, useRef, useEffect } from 'react';
import { ListFilter, X, Check, MessageSquare } from 'lucide-react';
import { MemberSearchFilter } from './MemberSearchFilter';

export function TaskFilterPopover({
  selectedStatus = 'all',
  onStatusChange,
  selectedAssignedBy = 'all',
  onAssignedByChange,
  unreadFilter = false,
  onUnreadFilterChange,
  hideCompleted = false,
  onHideCompletedChange,
  unreadCount = 0,
  users = [],
  departments = [],
  isAdmin = false,
  isStatusLocked = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const activeAdvancedCount =
    (selectedStatus !== 'all' && !isStatusLocked ? 1 : 0) +
    (selectedAssignedBy !== 'all' && isAdmin ? 1 : 0) +
    (unreadFilter ? 1 : 0) +
    (hideCompleted ? 1 : 0);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active (Non-completed)' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer select-none ${
          activeAdvancedCount > 0
            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
            : isOpen
            ? 'bg-white border-[#059669] text-[#18181B]'
            : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
        }`}
      >
        <ListFilter className="w-3.5 h-3.5 text-[#71717A]" />
        <span>Filter</span>
        {activeAdvancedCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
            {activeAdvancedCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-3 z-50 animate-fade-in space-y-3.5">
          <div className="flex items-center justify-between pb-1 border-b border-[#F4F4F5]">
            <span className="text-[12px] font-bold text-[#18181B]">
              Advanced Filters
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#8B8B95] hover:text-[#18181B] rounded-[4px]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1. Status Filter */}
          {!isStatusLocked && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#8B8B95] uppercase tracking-wider block">
                Task Status
              </label>
              <div className="grid grid-cols-1 gap-1">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onStatusChange(opt.value);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] transition-colors cursor-pointer text-left ${
                      selectedStatus === opt.value
                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                        : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedStatus === opt.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Assigned By (Admin Only) */}
          {isAdmin && (
            <div className="space-y-1.5 pt-1 border-t border-[#F4F4F5]">
              <label className="text-[11px] font-semibold text-[#8B8B95] uppercase tracking-wider block">
                Assigned By (Creator)
              </label>
              <MemberSearchFilter
                label="Assigned By"
                value={selectedAssignedBy}
                onChange={onAssignedByChange}
                users={users}
                departments={departments}
              />
            </div>
          )}

          {/* 3. Toggles: Unread Messages & Hide Completed */}
          <div className="space-y-2 pt-2 border-t border-[#F4F4F5]">
            {/* Unread Filter Toggle */}
            <label className="flex items-center justify-between cursor-pointer py-1 group">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#18181B]" />
                <span className="text-[12.5px] text-[#18181B] font-medium">
                  Unread Messages
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <input
                type="checkbox"
                checked={unreadFilter}
                onChange={(e) => onUnreadFilterChange(e.target.checked)}
                className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-pointer"
              />
            </label>

            {/* Hide Completed Toggle */}
            {!isStatusLocked && (
              <label className="flex items-center justify-between cursor-pointer py-1 group">
                <span className="text-[12.5px] text-[#18181B] font-medium">
                  Hide completed tasks
                </span>
                <input
                  type="checkbox"
                  checked={hideCompleted}
                  onChange={(e) => onHideCompletedChange(e.target.checked)}
                  className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-pointer"
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

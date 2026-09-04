import React from 'react';
import { X } from 'lucide-react';

export function TaskFilterChips({
  search = '',
  onClearSearch,
  selectedStatus = 'all',
  onClearStatus,
  selectedDept = 'all',
  onClearDept,
  selectedPriority = 'all',
  onClearPriority,
  selectedAssignedTo = 'all',
  onClearAssignedTo,
  selectedAssignedBy = 'all',
  onClearAssignedBy,
  selectedDue = 'all',
  onClearDue,
  unreadFilter = false,
  onClearUnread,
  hideCompleted = false,
  onClearHideCompleted,
  onClearAll,
  users = [],
  departments = [],
  isStatusLocked = false,
}) {
  const chips = [];

  if (search) {
    chips.push({
      id: 'search',
      label: `Search: "${search}"`,
      onRemove: onClearSearch,
    });
  }

  if (selectedStatus !== 'all' && !isStatusLocked) {
    const statusLabel =
      selectedStatus === 'active'
        ? 'Active'
        : selectedStatus === 'in_progress'
        ? 'In Progress'
        : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1);
    chips.push({
      id: 'status',
      label: `Status: ${statusLabel}`,
      onRemove: onClearStatus,
    });
  }

  if (selectedDept !== 'all') {
    const dept = departments.find((d) => d.id === selectedDept);
    chips.push({
      id: 'dept',
      label: `Department: ${dept?.name || 'Selected'}`,
      onRemove: onClearDept,
    });
  }

  if (selectedPriority !== 'all') {
    chips.push({
      id: 'priority',
      label: `Priority: ${selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)}`,
      onRemove: onClearPriority,
    });
  }

  if (selectedAssignedTo !== 'all') {
    const user = users.find((u) => u.id === selectedAssignedTo);
    chips.push({
      id: 'assigned_to',
      label: `Assignee: ${user?.full_name || 'Selected'}`,
      onRemove: onClearAssignedTo,
    });
  }

  if (selectedAssignedBy !== 'all') {
    const user = users.find((u) => u.id === selectedAssignedBy);
    chips.push({
      id: 'assigned_by',
      label: `Assigned By: ${user?.full_name || 'Selected'}`,
      onRemove: onClearAssignedBy,
    });
  }

  if (selectedDue !== 'all') {
    const dueLabels = {
      today: 'Today',
      tomorrow: 'Tomorrow',
      this_week: 'This Week',
      overdue: 'Overdue',
      due_soon: 'Due Soon',
      no_due: 'No Due Date',
    };
    chips.push({
      id: 'due',
      label: `Due: ${dueLabels[selectedDue] || selectedDue}`,
      onRemove: onClearDue,
    });
  }

  if (unreadFilter) {
    chips.push({
      id: 'unread',
      label: 'Unread Messages',
      onRemove: onClearUnread,
    });
  }

  if (hideCompleted && !isStatusLocked) {
    chips.push({
      id: 'hide_completed',
      label: 'Hide completed',
      onRemove: onClearHideCompleted,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap pt-1 select-none">
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-[#F4F4F5] text-[#18181B] border border-[#E4E4E7] transition-all"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="p-0.5 hover:bg-[#E4E4E7] rounded text-[#71717A] hover:text-[#18181B] cursor-pointer"
            aria-label={`Remove filter ${chip.label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="text-[12px] font-medium text-[#059669] hover:text-[#047857] hover:underline cursor-pointer ml-1"
      >
        Clear all
      </button>
    </div>
  );
}

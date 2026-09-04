import React from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { MemberSearchFilter } from './MemberSearchFilter';
import { Search, RotateCcw } from 'lucide-react';

export function TaskFilterBar({
  search,
  setSearch,
  selectedDept,
  setSelectedDept,
  selectedStatus,
  setSelectedStatus,
  selectedPriority,
  setSelectedPriority,
  selectedAssignedBy = 'all',
  setSelectedAssignedBy,
  selectedAssignedTo = 'all',
  setSelectedAssignedTo,
  unreadCount = 0,
  onResetFilters,
}) {
  const { departments } = useAppData();
  const { currentUser, users } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'it_support_admin';
  const userDept = departments.find((d) => d.id === currentUser?.department_id);

  const statusOptions = [
    { value: 'all', label: 'All Tasks' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'due_soon', label: 'Due Soon' },
    { value: 'unread', label: 'Unread Messages' },
  ];

  const hasActiveFilters =
    search ||
    selectedDept !== 'all' ||
    selectedStatus !== 'all' ||
    selectedPriority !== 'all' ||
    (isAdmin && (selectedAssignedBy !== 'all' || selectedAssignedTo !== 'all'));

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5 font-['Inter']"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Top Search & Reset */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title, description or TM-0001..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Options */}
      <div className="flex flex-col space-y-3 pt-3 border-t border-slate-100">
        {/* Status Tabs with scrollable container */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 max-w-full no-scrollbar">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedStatus(opt.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === opt.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              <span>{opt.label}</span>
              {opt.value === 'unread' && unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                    selectedStatus === 'unread' ? 'bg-red-500 text-white' : 'bg-red-600 text-white shadow-xs'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dropdown Selectors Grid */}
        <div
          className={`grid grid-cols-1 gap-2.5 w-full ${
            isAdmin
              ? 'sm:grid-cols-2 lg:grid-cols-4'
              : 'sm:grid-cols-2'
          }`}
        >
          {/* 1. Department Selector */}
          {isAdmin ? (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : (
            <div
              className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-2 select-none"
              title="Locked to your department"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: userDept?.color || '#10B981' }}
              />
              <span className="truncate">{userDept?.name || 'My Department'}</span>
              <span className="text-[10px] text-slate-400 font-normal ml-auto">(Your Dept)</span>
            </div>
          )}

          {/* 2. Priority Selector */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent Priority</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* 3 & 4: Searchable "Assign By" and "Assign To" (Admin Only) */}
          {isAdmin && (
            <>
              {/* Assign By Filter (Search by Member Name + Department) */}
              <MemberSearchFilter
                label="Assign By"
                value={selectedAssignedBy}
                onChange={setSelectedAssignedBy}
                users={users}
                departments={departments}
              />

              {/* Assign To Filter (Search by Member Name + Department) */}
              <MemberSearchFilter
                label="Assign To"
                value={selectedAssignedTo}
                onChange={setSelectedAssignedTo}
                users={users}
                departments={departments}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

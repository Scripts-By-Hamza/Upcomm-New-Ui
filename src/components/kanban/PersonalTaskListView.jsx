import React, { useState, useMemo } from 'react';
import { PersonalTaskRow } from './PersonalTaskRow';
import {
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  Filter,
  ArrowUpDown,
  PlusCircle,
  Inbox,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../common/Button';

const SUB_PAGES = [
  {
    id: 'all',
    label: 'All Tasks',
    shortLabel: 'All Tasks',
    icon: Layers,
    color: 'slate',
    activeBg: 'bg-slate-900 text-white',
    activeTabClass: 'bg-white text-slate-900 border-slate-300 shadow-xs ring-2 ring-slate-400/30',
    badgeClass: 'bg-slate-900 text-white',
    headerAccent: 'text-slate-800',
  },
  {
    id: 'pending',
    label: 'Pending Tasks',
    shortLabel: 'Pending',
    icon: Clock,
    color: 'amber',
    activeBg: 'bg-amber-500 text-white',
    activeTabClass: 'bg-white text-amber-900 border-amber-300 shadow-xs ring-2 ring-amber-400/30',
    badgeClass: 'bg-amber-100 text-amber-800',
    headerAccent: 'text-amber-700',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    shortLabel: 'In Progress',
    icon: Play,
    color: 'blue',
    activeBg: 'bg-blue-500 text-white',
    activeTabClass: 'bg-white text-blue-900 border-blue-300 shadow-xs ring-2 ring-blue-400/30',
    badgeClass: 'bg-blue-100 text-blue-800',
    headerAccent: 'text-blue-700',
  },
  {
    id: 'completed',
    label: 'Completed',
    shortLabel: 'Completed',
    icon: CheckCircle2,
    color: 'emerald',
    activeBg: 'bg-emerald-500 text-white',
    activeTabClass: 'bg-white text-emerald-900 border-emerald-300 shadow-xs ring-2 ring-emerald-400/30',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    headerAccent: 'text-emerald-700',
  },
];

export function PersonalTaskListView({
  tasks = [],
  onStatusChange,
  onAddTask,
  onViewTask,
  onEditTask,
  onDeleteTask,
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'in_progress' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at', 'due_date', 'priority', 'sort_order'
  const [errorBanner, setErrorBanner] = useState('');

  // Extract unique categories from tasks
  const uniqueCategories = useMemo(() => {
    const cats = tasks.map((t) => t.category).filter(Boolean);
    return Array.from(new Set(cats));
  }, [tasks]);

  // Overall Statistics Counts
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => (t.status || 'pending') === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskStatus = task.status || 'pending';

      // 1. Tab / Sub-page Filter
      if (activeTab !== 'all' && taskStatus !== activeTab) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = task.title?.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchCat = task.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      // 3. Priority Filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // 4. Category Filter
      if (categoryFilter !== 'all' && task.category !== categoryFilter) {
        return false;
      }

      // 5. Date Filter
      if (dateFilter !== 'all') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateFilter === 'today') {
          if (task.due_date !== todayStr) return false;
        } else if (dateFilter === 'overdue') {
          if (!task.due_date || task.due_date >= todayStr || task.status === 'completed') {
            return false;
          }
        } else if (dateFilter === 'upcoming') {
          if (!task.due_date || task.due_date <= todayStr) return false;
        }
      }

      return true;
    });
  }, [tasks, activeTab, searchQuery, priorityFilter, categoryFilter, dateFilter]);

  // Sort Tasks for Active Sub-page
  const sortedTasks = useMemo(() => {
    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
    const list = [...filteredTasks];

    list.sort((a, b) => {
      if (sortBy === 'priority') {
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      if (sortBy === 'due_date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      }
      if (sortBy === 'created_at') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

    return list;
  }, [filteredTasks, sortBy]);

  const activePageConfig = SUB_PAGES.find((p) => p.id === activeTab) || SUB_PAGES[0];

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await onStatusChange?.(taskId, newStatus);
    } catch (err) {
      setErrorBanner(err?.message || 'Failed to update task status.');
    }
  };

  return (
    <div className="space-y-5 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Single Unified Sub-Page / Stats Tab Bar */}
      <div className="bg-slate-100/90 p-1.5 rounded-3xl border border-slate-200 flex flex-wrap sm:flex-nowrap gap-1.5 shadow-2xs">
        {SUB_PAGES.map((tab) => {
          const count =
            tab.id === 'all'
              ? stats.total
              : tab.id === 'pending'
              ? stats.pending
              : tab.id === 'in_progress'
              ? stats.inProgress
              : stats.completed;
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] py-2.5 px-3.5 sm:px-4 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isActive
                  ? `${tab.activeTabClass} border`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
              }`}
            >
              <TabIcon className={`w-4 h-4 flex-shrink-0 ${tab.id === 'in_progress' && isActive ? 'fill-blue-800' : ''}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-black ${
                  isActive ? tab.badgeClass : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {errorBanner && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner('')}
            className="text-[11px] font-bold text-rose-800 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activePageConfig.label.toLowerCase()}, descriptions, or tags...`}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            {/* Category Filter */}
            {uniqueCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 cursor-pointer"
            >
              <option value="all">All Due Dates</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 cursor-pointer"
            >
              <option value="created_at">Sort by Newest</option>
              <option value="due_date">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="sort_order">Custom Order</option>
            </select>

            {(searchQuery || priorityFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                  setDateFilter('all');
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Active Sub-Page Task List Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        {/* Sub-Page Section Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                activeTab === 'all'
                  ? 'bg-slate-900 ring-4 ring-slate-100'
                  : activeTab === 'pending'
                  ? 'bg-amber-500 ring-4 ring-amber-100'
                  : activeTab === 'in_progress'
                  ? 'bg-blue-500 ring-4 ring-blue-100'
                  : 'bg-emerald-500 ring-4 ring-emerald-100'
              }`}
            />
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              {activePageConfig.label}
            </h2>
            <span className="text-xs font-bold font-mono px-2.5 py-0.5 bg-slate-200/70 text-slate-700 rounded-full">
              {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAddTask?.(activeTab === 'all' ? 'pending' : activeTab)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {activeTab === 'all' ? 'Add Personal Task' : `Add to ${activePageConfig.shortLabel}`}
            </span>
          </button>
        </div>

        {/* Column Labels (Header Row) */}
        <div className="hidden sm:flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 bg-slate-100/70 border-b border-slate-200/60 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
          {/* Left: No & Status */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 w-17 sm:w-21">
            <span className="w-8 sm:w-10 text-center font-mono">NO.</span>
            <span className="text-center">STATUS</span>
          </div>

          {/* Middle: Details */}
          <div className="flex-1 min-w-0 pl-1">
            <span>TASK DETAILS & DESCRIPTION</span>
          </div>

          {/* Right: Badges Header */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0 text-left">
            <span>PRIORITY, CATEGORY & DUE DATE</span>
          </div>

          {/* Actions with generous right padding */}
          <div className="w-10 sm:w-12 text-center flex-shrink-0 pr-2">
            <span>ACTION</span>
          </div>
        </div>

        {/* Task Rows List */}
        <div className="p-3.5 sm:p-5 space-y-2.5">
          {sortedTasks.length === 0 ? (
            /* Empty State */
            <div className="py-12 sm:py-16 text-center px-4 space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200/80">
                <Inbox className="w-7 h-7" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                No tasks found in {activePageConfig.label}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                {searchQuery || priorityFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all'
                  ? 'No personal tasks match your current search or filter criteria. Try clearing filters.'
                  : `You don't have any personal tasks in ${activePageConfig.label.toLowerCase()} yet.`}
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={PlusCircle}
                  onClick={() => onAddTask?.(activeTab === 'all' ? 'pending' : activeTab)}
                >
                  Create {activePageConfig.shortLabel === 'All Tasks' ? 'Personal' : activePageConfig.shortLabel} Task
                </Button>
              </div>
            </div>
          ) : (
            sortedTasks.map((task, idx) => (
              <PersonalTaskRow
                key={task.id}
                task={task}
                index={idx}
                onView={onViewTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

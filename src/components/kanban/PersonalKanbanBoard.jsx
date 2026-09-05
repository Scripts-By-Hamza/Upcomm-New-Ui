import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCardView } from './PersonalTaskCard';
import {
  Search,
  ListFilter,
  Filter,
  ArrowUpDown,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { parseTaskDueDateLocal, isTaskOverdue, toLocalDateKey } from '../../utils/dateUtils';
import { format } from 'date-fns';

const COLUMNS = [
  { id: 'pending', title: 'TO DO' },
  { id: 'in_progress', title: 'IN PROGRESS' },
  { id: 'completed', title: 'DONE' },
];

export function PersonalKanbanBoard({
  tasks = [],
  onStatusChange,
  onReorder,
  onAddTask,
  onViewTask,
  onEditTask,
  onDeleteTask,
}) {
  const [activeTask, setActiveTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'overdue', 'upcoming'
  const [sortBy, setSortBy] = useState('sort_order'); // 'sort_order', 'due_date', 'priority', 'created_at'
  const [mobileActiveTab, setMobileActiveTab] = useState('pending');

  // Desktop dropdown states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  // Mobile Filter Dialog Modal State
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sensors configuration with touch, pointer, and keyboard support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Extract unique categories from personal tasks
  const uniqueCategories = useMemo(() => {
    const cats = tasks.map((t) => t.category).filter(Boolean);
    return Array.from(new Set(cats));
  }, [tasks]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    priorityFilter !== 'all' ||
    categoryFilter !== 'all' ||
    dateFilter !== 'all';

  const activeFiltersCount =
    (priorityFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (dateFilter !== 'all' ? 1 : 0);

  const handleClearAllFilters = () => {
    setPriorityFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
    setSortBy('sort_order');
  };

  // 1. Filter Tasks
  const filteredTasks = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    return tasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = task.title?.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchCat = task.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      // Priority Filter
      if (priorityFilter !== 'all' && (task.priority || 'medium').toLowerCase() !== priorityFilter.toLowerCase()) {
        return false;
      }

      // Category Filter
      if (categoryFilter !== 'all' && task.category !== categoryFilter) {
        return false;
      }

      // Date Filter (Timezone-safe)
      if (dateFilter !== 'all') {
        if (!task.due_date) return false;
        const parsed = parseTaskDueDateLocal(task.due_date);
        if (!parsed) return false;
        const taskDateStr = format(parsed, 'yyyy-MM-dd');

        if (dateFilter === 'today') {
          if (taskDateStr !== todayStr) return false;
        } else if (dateFilter === 'overdue') {
          if (!isTaskOverdue(task.due_date, task.status)) return false;
        } else if (dateFilter === 'upcoming') {
          if (taskDateStr <= todayStr) return false;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, priorityFilter, categoryFilter, dateFilter]);

  // 2. Group into Columns and Sort
  const columnsData = useMemo(() => {
    const grouped = {
      pending: [],
      in_progress: [],
      completed: [],
    };

    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };

    filteredTasks.forEach((task) => {
      const colId = task.status || 'pending';
      if (grouped[colId]) {
        grouped[colId].push(task);
      } else {
        grouped.pending.push(task);
      }
    });

    // Sort tasks in each column
    Object.keys(grouped).forEach((colKey) => {
      grouped[colKey].sort((a, b) => {
        if (sortBy === 'priority') {
          return (
            (priorityWeight[b.priority?.toLowerCase()] || 0) -
            (priorityWeight[a.priority?.toLowerCase()] || 0)
          );
        }
        if (sortBy === 'due_date') {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        }
        if (sortBy === 'created_at') {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
    });

    return grouped;
  }, [filteredTasks, sortBy]);

  // 3. Drag and Drop Handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id;
    const overId = over.id;

    const draggedTask = tasks.find((t) => t.id === activeTaskId);
    if (!draggedTask) return;

    // Determine target column
    let destinationStatus = null;
    let targetIndex = 0;

    if (COLUMNS.some((col) => col.id === overId)) {
      destinationStatus = overId;
      targetIndex = columnsData[overId]?.length || 0;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        destinationStatus = overTask.status || 'pending';
        const colTasks = columnsData[destinationStatus] || [];
        targetIndex = colTasks.findIndex((t) => t.id === overId);
        if (targetIndex < 0) targetIndex = 0;
      }
    }

    if (!destinationStatus) return;

    // Cross-column movement
    if (draggedTask.status !== destinationStatus) {
      try {
        await onStatusChange?.(draggedTask.id, destinationStatus, targetIndex);
      } catch (err) {
        console.error('Failed to update personal task status:', err);
      }
    } else if (
      activeTaskId !== overId &&
      sortBy === 'sort_order' &&
      !hasActiveFilters
    ) {
      // Same-column reordering (only enabled in Custom Order without filters)
      const currentList = columnsData[destinationStatus] || [];
      const oldIndex = currentList.findIndex((t) => t.id === activeTaskId);
      const newIndex = currentList.findIndex((t) => t.id === overId);

      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        const reorderedColumn = arrayMove(currentList, oldIndex, newIndex);
        const newOverallTasks = tasks.map((t) => {
          if (t.status === destinationStatus) {
            const reorderedIdx = reorderedColumn.findIndex((rt) => rt.id === t.id);
            return { ...t, sort_order: reorderedIdx >= 0 ? reorderedIdx : t.sort_order };
          }
          return t;
        });

        try {
          await onReorder?.(newOverallTasks);
        } catch (err) {
          console.error('Failed to save personal task ordering:', err);
        }
      }
    }
  };

  // Card-center collision detection for instant drop targeting
  const customCollisionDetection = (args) => {
    const { collisionRect, droppableRects, droppableContainers } = args;
    if (!collisionRect) return [];

    const cardCenterX = collisionRect.left + collisionRect.width / 2;
    const columnContainers = droppableContainers.filter((c) =>
      COLUMNS.some((col) => col.id === c.id)
    );

    for (const container of columnContainers) {
      const rect = droppableRects.get(container.id);
      if (!rect) continue;

      if (cardCenterX >= rect.left && cardCenterX <= rect.left + rect.width) {
        return [{ id: container.id, data: { value: 1000 } }];
      }
    }

    return closestCorners(args);
  };

  const sortOptions = [
    { value: 'sort_order', label: 'Custom Order' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'created_at', label: 'Newest' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const dateOptions = [
    { value: 'all', label: 'All Due Dates' },
    { value: 'today', label: 'Due Today' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'upcoming', label: 'Upcoming' },
  ];

  return (
    <div className="space-y-4 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Mobile Toolbar (sm:hidden): Search Input + Right Filter Button in a Single Clean Line */}
      <div className="flex sm:hidden items-center justify-between gap-2 w-full select-none">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search personal tasks..."
            className="w-full pl-8 pr-7 h-9 bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[12.5px] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95] transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] dark:hover:text-[#F4F4F5] p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <button
          type="button"
          onClick={() => setShowMobileFilterModal(true)}
          className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs flex-shrink-0 whitespace-nowrap outline-none focus:outline-none ${
            activeFiltersCount > 0 || sortBy !== 'sort_order'
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
              : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5]'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. Desktop Toolbar (hidden sm:flex): Full controls with separate popovers */}
      <div className="hidden sm:flex items-center justify-between gap-2.5 select-none">
        {/* Left: Search & Filter Popover */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search personal tasks..."
              className="w-full pl-8 pr-7 h-9 bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[12.5px] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95] transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] dark:hover:text-[#F4F4F5] p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Popover Button */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer outline-none focus:outline-none ${
                activeFiltersCount > 0
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                  : isFilterOpen
                  ? 'bg-white border-[#059669] text-[#18181B] dark:bg-[#18181B] dark:border-[#10B981] dark:text-[#F4F4F5]'
                  : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-[#18181B] rounded-[10px] border border-[#E5E7EB] dark:border-[#27272A] shadow-xl p-3 z-50 animate-fade-in space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#F4F4F5] dark:border-[#27272A]">
                  <span className="text-[11px] font-bold text-[#8B8B95] uppercase tracking-wider">
                    Filters
                  </span>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="text-[11px] font-semibold text-[#059669] dark:text-[#34D399] hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Priority Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#71717A] dark:text-[#A1A1AA]">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full h-8 px-2 text-[12px] bg-white dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[6px] text-[#18181B] dark:text-[#F4F4F5] focus:border-[#059669] focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Category Filter */}
                {uniqueCategories.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#71717A] dark:text-[#A1A1AA]">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full h-8 px-2 text-[12px] bg-white dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[6px] text-[#18181B] dark:text-[#F4F4F5] focus:border-[#059669] focus:outline-none"
                    >
                      <option value="all">All Categories</option>
                      {uniqueCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Due Date Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#71717A] dark:text-[#A1A1AA]">Due Date</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full h-8 px-2 text-[12px] bg-white dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[6px] text-[#18181B] dark:text-[#F4F4F5] focus:border-[#059669] focus:outline-none"
                  >
                    <option value="all">All Due Dates</option>
                    <option value="today">Due Today</option>
                    <option value="overdue">Overdue</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sort Button */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setIsSortOpen((prev) => !prev)}
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer outline-none focus:outline-none ${
              sortBy !== 'sort_order'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                : isSortOpen
                ? 'bg-white border-[#059669] text-[#18181B] dark:bg-[#18181B] dark:border-[#10B981] dark:text-[#F4F4F5]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <span>Sort</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#18181B] rounded-[10px] border border-[#E5E7EB] dark:border-[#27272A] shadow-xl p-1.5 z-50 animate-fade-in space-y-0.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.value);
                    setIsSortOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer transition-colors ${
                    sortBy === opt.value
                      ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                      : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Mobile Column Tabs Selector (< md screens) */}
      <div className="flex md:hidden items-center gap-1.5 p-1.5 bg-white dark:bg-[#18181B] rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] select-none shadow-2xs">
        {COLUMNS.map((col) => {
          const count = columnsData[col.id]?.length || 0;
          const isActive = mobileActiveTab === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileActiveTab(col.id)}
              className={`flex-1 py-2 px-2.5 rounded-[9px] text-[12px] font-semibold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer outline-none focus:outline-none whitespace-nowrap min-w-0 ${
                isActive
                  ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] shadow-xs'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F4F4F5]/60 dark:hover:bg-[#27272A]/60'
              }`}
            >
              <span className="truncate">{col.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 min-w-[18px] text-center rounded-full font-bold inline-flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#18181B]' : 'bg-[#F4F4F5] dark:bg-[#27272A] text-[#52525B] dark:text-[#C4C7CE]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. DndContext & 3-Column Kanban Layout */}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Desktop 3-Column Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-5 items-start">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={columnsData[col.id] || []}
              onAddTask={onAddTask}
              onViewTask={onViewTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>

        {/* Mobile Single Column Active View */}
        <div className="md:hidden">
          {COLUMNS.filter((col) => col.id === mobileActiveTab).map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={columnsData[col.id] || []}
              onAddTask={onAddTask}
              onViewTask={onViewTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>

        {/* Floating Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="w-[300px] pointer-events-none shadow-xl">
              <TaskCardView task={activeTask} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 5. Mobile All-in-One Filter Dialog Modal (Portaled) */}
      {showMobileFilterModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            onClick={() => setShowMobileFilterModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Dialog Box Modal */}
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-[#18181B] rounded-t-[20px] sm:rounded-[16px] border border-[#E5E7EB] dark:border-[#27272A] shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="px-4 py-3.5 border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                <h3 className="text-[15px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
                  Personal Task Filters
                </h3>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#059669] dark:text-[#34D399] text-[11px] font-semibold border border-[#A7F3D0] dark:border-[#059669]/40">
                    {activeFiltersCount} active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {(activeFiltersCount > 0 || sortBy !== 'sort_order') && (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="text-[12px] font-medium text-[#059669] dark:text-[#34D399] hover:underline cursor-pointer"
                  >
                    Reset all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMobileFilterModal(false)}
                  className="p-1 rounded-[6px] text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] cursor-pointer"
                  aria-label="Close filters dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
              {/* 1. Priority Section */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {priorityOptions.map((opt) => {
                    const isSelected = priorityFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPriorityFilter(opt.value)}
                        className={`px-2.5 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-center flex items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                            : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Due Date Section */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Due Date
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {dateOptions.map((opt) => {
                    const isSelected = dateFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDateFilter(opt.value)}
                        className={`px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                            : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Category Section (if available) */}
              {uniqueCategories.length > 0 && (
                <div>
                  <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('all')}
                      className={`px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-left flex items-center justify-between cursor-pointer ${
                        categoryFilter === 'all'
                          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                          : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                      }`}
                    >
                      <span>All Categories</span>
                      {categoryFilter === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    {uniqueCategories.map((cat) => {
                      const isSelected = categoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-left flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                              : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                          }`}
                        >
                          <span className="truncate">{cat}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Sort Section */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Sort Order
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {sortOptions.map((opt) => {
                    const isSelected = sortBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSortBy(opt.value)}
                        className={`px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                            : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-[#E5E7EB] dark:border-[#27272A] bg-[#F9FAFB] dark:bg-[#18181B]">
              <button
                type="button"
                onClick={() => setShowMobileFilterModal(false)}
                className="w-full py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-[13.5px] font-semibold rounded-[10px] transition-colors cursor-pointer shadow-sm text-center outline-none"
              >
                Apply Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

import React, { useState, useMemo, useRef, useEffect } from 'react';
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

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef(null);
  const sortRef = useRef(null);

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

  return (
    <div className="space-y-4 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Compact One-Line Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 select-none">
        {/* Left: Search & Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search personal tasks..."
              className="w-full pl-8 pr-7 h-9 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[12.5px] text-[#18181B] placeholder:text-[#8B8B95] transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
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
              className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeFiltersCount > 0
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                  : isFilterOpen
                  ? 'bg-white border-[#059669] text-[#18181B]'
                  : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-[#71717A]" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-3 z-50 animate-fade-in space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#F4F4F5]">
                  <span className="text-[11px] font-bold text-[#8B8B95] uppercase tracking-wider">
                    Filters
                  </span>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPriorityFilter('all');
                        setCategoryFilter('all');
                        setDateFilter('all');
                      }}
                      className="text-[11px] font-semibold text-[#059669] hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Priority Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#71717A]">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full h-8 px-2 text-[12px] bg-white border border-[#E5E7EB] rounded-[6px] text-[#18181B] focus:border-[#059669] focus:outline-none"
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
                    <label className="text-[11px] font-medium text-[#71717A]">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full h-8 px-2 text-[12px] bg-white border border-[#E5E7EB] rounded-[6px] text-[#18181B] focus:border-[#059669] focus:outline-none"
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
                  <label className="text-[11px] font-medium text-[#71717A]">Due Date</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full h-8 px-2 text-[12px] bg-white border border-[#E5E7EB] rounded-[6px] text-[#18181B] focus:border-[#059669] focus:outline-none"
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
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              sortBy !== 'sort_order'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                : isSortOpen
                ? 'bg-white border-[#059669] text-[#18181B]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#71717A]" />
            <span>Sort</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-1.5 z-50 animate-fade-in space-y-0.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.value);
                    setIsSortOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                    sortBy === opt.value
                      ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                      : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
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

      {/* 2. Mobile Column Tabs Selector (< md screens) */}
      <div className="flex md:hidden bg-white p-1 rounded-[8px] border border-[#E5E7EB] select-none">
        {COLUMNS.map((col) => {
          const count = columnsData[col.id]?.length || 0;
          const isActive = mobileActiveTab === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileActiveTab(col.id)}
              className={`flex-1 py-1.5 rounded-[6px] text-[12px] font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[#18181B] text-white font-semibold shadow-2xs'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <span>{col.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#F4F4F5] text-[#52525B]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. DndContext & 3-Column Kanban Layout */}
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
    </div>
  );
}

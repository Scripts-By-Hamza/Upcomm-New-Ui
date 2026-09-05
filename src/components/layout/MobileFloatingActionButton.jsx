import React, { useState, useRef, useEffect } from 'react';
import { Plus, ListPlus, Lock, Sparkles, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MobileFloatingActionButton({
  onOpenCreatePersonalTask,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleNewTask = () => {
    setIsOpen(false);
    navigate('/tasks/create');
  };

  const handlePersonalTask = () => {
    setIsOpen(false);
    if (onOpenCreatePersonalTask) {
      onOpenCreatePersonalTask();
    }
  };

  return (
    <div
      ref={menuRef}
      className="sm:hidden fixed bottom-6 right-5 z-40 select-none"
    >
      {/* Backdrop overlay with smooth blur when open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity z-[-1] animate-fade-in"
        />
      )}

      {/* Floating Action Cards Menu (Floats smoothly above the button) */}
      <div
        className={`absolute bottom-16 right-0 flex flex-col items-end gap-2.5 transition-all duration-300 ease-out pointer-events-none ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-90'
        }`}
      >
        {/* Action 1: New Task */}
        <button
          type="button"
          onClick={handleNewTask}
          style={{ transitionDelay: isOpen ? '50ms' : '0ms' }}
          className="flex items-center gap-3 pl-3 pr-3 py-2.5 bg-white/95 dark:bg-[#1E2024]/95 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[16px] shadow-[0_12px_28px_rgba(0,0,0,0.14)] hover:bg-white dark:hover:bg-[#25282E] active:scale-95 transition-all cursor-pointer group text-left w-52 outline-none"
          aria-label="Create New Task"
        >
          <div className="w-9 h-9 rounded-[11px] bg-[#F4F4F5] dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#373C44] text-[#27272A] dark:text-[#F4F4F5] flex items-center justify-center shadow-xs flex-shrink-0 group-hover:scale-105 group-hover:bg-[#E4E4E7] dark:group-hover:bg-[#32363F] transition-all">
            <ListPlus className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-[#18181B] dark:text-[#F4F4F5] leading-tight">
              New Task
            </div>
            <div className="text-[10.5px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 truncate">
              Assign to workspace
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#18181B] dark:group-hover:text-[#F4F4F5] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>

        {/* Action 2: Personal Task */}
        <button
          type="button"
          onClick={handlePersonalTask}
          style={{ transitionDelay: isOpen ? '25ms' : '0ms' }}
          className="flex items-center gap-3 pl-3 pr-3 py-2.5 bg-white/95 dark:bg-[#1E2024]/95 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[16px] shadow-[0_12px_28px_rgba(0,0,0,0.14)] hover:bg-white dark:hover:bg-[#25282E] active:scale-95 transition-all cursor-pointer group text-left w-52 outline-none"
          aria-label="Create Personal Task"
        >
          <div className="w-9 h-9 rounded-[11px] bg-[#F4F4F5] dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#373C44] text-[#27272A] dark:text-[#F4F4F5] flex items-center justify-center shadow-xs flex-shrink-0 group-hover:scale-105 group-hover:bg-[#E4E4E7] dark:group-hover:bg-[#32363F] transition-all">
            <Lock className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-[#18181B] dark:text-[#F4F4F5] leading-tight">
              Personal Task
            </div>
            <div className="text-[10.5px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 truncate">
              Private note for you
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#18181B] dark:group-hover:text-[#F4F4F5] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>
      </div>

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close menu' : 'Add task or personal task'}
        title="Create Task"
        className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-[0_8px_24px_rgba(5,150,105,0.45)] transition-all duration-300 cursor-pointer border border-[#047857]/20 outline-none focus:outline-none active:scale-95 ${
          isOpen
            ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] rotate-45 shadow-xl scale-105'
            : 'bg-[#059669] hover:bg-[#047857] hover:scale-105'
        }`}
      >
        <Plus className="w-6 h-6 stroke-[2.5] transition-transform duration-300" />
      </button>
    </div>
  );
}

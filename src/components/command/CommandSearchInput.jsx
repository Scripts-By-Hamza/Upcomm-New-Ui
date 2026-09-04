import React from 'react';
import { Search, X } from 'lucide-react';

export function CommandSearchInput({
  value,
  onChange,
  onKeyDown,
  onClose,
  inputRef,
}) {
  return (
    <div className="relative flex items-center h-[54px] px-4 border-b border-[#E5E7EB] flex-shrink-0 select-none bg-white">
      {/* Search Icon */}
      <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#8B8B95] flex-shrink-0 mr-3 pointer-events-none" />

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-autocomplete="list"
        aria-controls="command-palette-results"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search tasks, people, departments..."
        className="flex-1 min-w-0 h-full bg-transparent text-[14.5px] sm:text-[15px] font-normal text-[#18181B] placeholder:text-[#8B8B95] focus:outline-none border-none p-0"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />

      {/* Right: ESC Badge on Desktop / Clear or Close Button */}
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 rounded-[4px] text-[#8B8B95] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
            title="Clear search"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}

        {/* ESC Key Badge (Desktop) */}
        <span
          className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 min-w-[28px] h-[22px] text-[10.5px] font-semibold text-[#71717A] bg-[#F4F4F5] border border-[#E4E4E7] rounded-[5px] pointer-events-none select-none"
          title="Press Escape to close"
        >
          ESC
        </span>

        {/* Close Icon (Mobile) */}
        <button
          type="button"
          onClick={onClose}
          className="sm:hidden p-1.5 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
          title="Close command palette"
          aria-label="Close command palette"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

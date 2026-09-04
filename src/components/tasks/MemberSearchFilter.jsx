import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Avatar } from '../common/Avatar';
import { Search, X, ChevronDown, Check, User, Building2 } from 'lucide-react';

export function MemberSearchFilter({
  label = 'Assign To',
  value = 'all',
  onChange,
  users = [],
  departments = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Map departments by ID for quick lookup
  const deptMap = useMemo(() => {
    const map = {};
    (departments || []).forEach((d) => {
      if (d && d.id) map[d.id] = d;
    });
    return map;
  }, [departments]);

  // Filter users by name or department
  const filteredUsers = useMemo(() => {
    const activeList = (users || []).filter(
      (u) =>
        u &&
        !u.is_system_account &&
        !u.exclude_from_directory &&
        u.role !== 'it_support_admin' &&
        u.role !== 'it_support'
    );

    if (!searchQuery.trim()) {
      return activeList.sort((a, b) =>
        (a.full_name || '').localeCompare(b.full_name || '')
      );
    }

    const q = searchQuery.toLowerCase().trim();
    return activeList.filter((u) => {
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const userDept = deptMap[u.department_id];
      const matchDept = userDept?.name?.toLowerCase().includes(q);
      const matchRole = u.role?.toLowerCase().includes(q);
      return matchName || matchEmail || matchDept || matchRole;
    });
  }, [users, searchQuery, deptMap]);

  const selectedUser = useMemo(() => {
    if (!value || value === 'all') return null;
    return users.find((u) => u.id === value) || null;
  }, [value, users]);

  const selectedDept = selectedUser ? deptMap[selectedUser.department_id] : null;

  const handleSelect = (userId) => {
    onChange?.(userId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('all');
    setSearchQuery('');
  };

  return (
    <div className="relative flex-1 min-w-[190px]" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3 py-2 text-xs rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer text-left shadow-2xs ${
          selectedUser
            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 ring-2 ring-emerald-400/20 font-bold'
            : isOpen
            ? 'bg-white border-emerald-500 ring-2 ring-emerald-400/20 text-slate-800'
            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700 font-semibold'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <User className={`w-3.5 h-3.5 flex-shrink-0 ${selectedUser ? 'text-emerald-700' : 'text-slate-400'}`} />
          {selectedUser ? (
            <div className="min-w-0 flex-1 truncate">
              <span className="text-[10px] text-emerald-700 uppercase font-black tracking-wider block leading-none mb-0.5">
                {label}:
              </span>
              <span className="text-xs font-bold text-emerald-950 truncate block">
                {selectedUser.full_name}
                {selectedDept ? ` • ${selectedDept.name}` : ''}
              </span>
            </div>
          ) : (
            <span className="truncate text-slate-700">
              {label}: <span className="text-slate-500 font-normal">All</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedUser && (
            <span
              onClick={handleClear}
              className="p-1 hover:bg-emerald-200/80 rounded-md text-emerald-800 hover:text-emerald-950 transition-colors"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
        </div>
      </button>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-fade-in min-w-[260px]">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()} by name or dept...`}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* User Options List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {/* Reset / All option */}
            <button
              type="button"
              onClick={() => handleSelect('all')}
              className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                value === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{label}: All Members</span>
              {value === 'all' && <Check className="w-3.5 h-3.5" />}
            </button>

            {filteredUsers.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                No matching members or departments found
              </div>
            ) : (
              filteredUsers.map((u) => {
                const dept = deptMap[u.department_id];
                const isSelected = value === u.id;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u.id)}
                    className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Avatar
                        src={u.avatar_url}
                        name={u.full_name}
                        size="xs"
                        showRoleBadge
                        role={u.role}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold truncate text-slate-900">
                            {u.full_name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium capitalize">
                            ({u.role === 'admin' ? 'Admin' : u.role === 'hod' ? 'HOD' : 'Member'})
                          </span>
                        </div>
                        {dept && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate mt-0.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: dept.color || '#10B981' }}
                            />
                            <span className="truncate">{dept.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

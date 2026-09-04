import React, { useState, useRef, useEffect } from 'react';
import { getDepartmentIconComponent } from '../../../utils/departmentIcons';
import { Edit2, MoreVertical, Trash2 } from 'lucide-react';

export function DepartmentDetailHeader({
  department,
  memberCount = 0,
  activeTaskCount = 0,
  canManage = false,
  onEdit,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const IconComponent = getDepartmentIconComponent(department);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
      {/* Left: Department Icon + Name + Metadata */}
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
        <div className="w-14 h-14 rounded-[10px] bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 text-[#18181B]">
          <IconComponent className="w-6 h-6 text-[#18181B]" />
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl sm:text-[26px] font-bold text-[#18181B] tracking-tight truncate leading-tight">
            {department?.name || 'Department'}
          </h1>
          <p className="text-[13.5px] text-[#52525B] mt-0.5">
            {memberCount} {memberCount === 1 ? 'member' : 'members'} • {activeTaskCount}{' '}
            {activeTaskCount === 1 ? 'active task' : 'active tasks'}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      {canManage && (
        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 h-[38px] px-3.5 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B] rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer shadow-none"
          >
            <span>Edit Department</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-[38px] h-[38px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[8px] flex items-center justify-center text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer shadow-none"
              aria-label={`Actions for ${department?.name || 'department'}`}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1 z-40 animate-fade-in text-left">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (onEdit) onEdit();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#71717A]" />
                  <span>Edit Department</span>
                </button>

                <div className="my-1 border-t border-[#F4F4F5]" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (onDelete) onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Delete Department</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

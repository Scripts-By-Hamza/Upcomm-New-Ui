import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { getDepartmentIconComponent } from '../../utils/departmentIcons';
import { MoreVertical, ArrowRight, ExternalLink, Edit2, Trash2 } from 'lucide-react';

export function DepartmentCard({
  department,
  members = [],
  activeTasks = 0,
  overdueTasks = 0,
  completionPercentage = 0,
  canManage = false,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close card action menu on outside click
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
  const displayedMembers = members.slice(0, 3);
  const extraMembersCount = Math.max(0, members.length - 3);
  const memberCount = members.length;

  const handleOpenDepartment = () => {
    navigate(`/departments/${department.id}`);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[10px] p-5 sm:p-6 flex flex-col justify-between transition-all select-none min-h-[320px] shadow-none group">
      <div>
        {/* Top Row: Icon Container + Name & Description + 3-Dot Menu */}
        <div className="flex items-start gap-3.5 relative">
          {/* Icon Box (56px) */}
          <div
            className="w-14 h-14 rounded-[10px] bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 text-[#18181B] group-hover:border-[#D4D4D8] transition-colors cursor-pointer"
            onClick={handleOpenDepartment}
            title={department.name}
          >
            <IconComponent className="w-6 h-6 text-[#18181B]" />
          </div>

          {/* Department Name & Description */}
          <div className="flex-1 min-w-0 pr-1">
            <h3
              onClick={handleOpenDepartment}
              className="text-[15.5px] font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors truncate cursor-pointer leading-tight"
              title={department.name}
            >
              {department.name}
            </h3>
            <p className="text-[12.5px] text-[#52525B] line-clamp-2 mt-1 leading-relaxed">
              {department.description || 'No description added.'}
            </p>
          </div>

          {/* Three-dot Action Menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 -mr-1.5 -mt-1 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
              aria-label={`Actions for ${department.name}`}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1 z-40 animate-fade-in text-left">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleOpenDepartment();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#71717A]" />
                  <span>Open Department</span>
                </button>

                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        if (onEdit) onEdit(department);
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
                        if (onDelete) onDelete(department);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>Delete Department</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Member Section: Avatar Group + Member Count */}
        <div className="flex items-center justify-between mt-5">
          {memberCount > 0 ? (
            <div className="flex items-center -space-x-1.5 overflow-hidden">
              {displayedMembers.map((member) => (
                <div
                  key={member.id}
                  className="ring-2 ring-white rounded-full flex-shrink-0"
                  title={member.full_name}
                >
                  <Avatar
                    src={member.avatar_url}
                    name={member.full_name}
                    size="sm"
                    className="w-8 h-8"
                  />
                </div>
              ))}
              {extraMembersCount > 0 && (
                <div
                  className="w-8 h-8 rounded-full bg-[#F4F4F5] text-[#52525B] text-[11px] font-semibold flex items-center justify-center ring-2 ring-white flex-shrink-0"
                  title={`+${extraMembersCount} more members`}
                >
                  +{extraMembersCount}
                </div>
              )}
            </div>
          ) : (
            <div className="h-8 flex items-center text-[12px] text-[#8B8B95] italic">
              0 members
            </div>
          )}

          <span className="text-[12.5px] text-[#52525B] font-medium whitespace-nowrap">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E5E7EB] my-4" />

        {/* Metrics Section: Active / Overdue & Completion Rate */}
        <div className="flex items-center justify-between text-[12.5px]">
          <div className="space-y-0.5">
            <div>
              <span className="font-semibold text-[#18181B]">{activeTasks}</span>{' '}
              <span className="text-[#52525B]">
                {activeTasks === 1 ? 'active task' : 'active tasks'}
              </span>
            </div>
            <div>
              <span
                className={`font-semibold ${
                  overdueTasks > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'
                }`}
              >
                {overdueTasks} overdue
              </span>
            </div>
          </div>

          <div className="text-right self-start">
            <span className="font-semibold text-[#18181B]">{completionPercentage}%</span>{' '}
            <span className="text-[#52525B]">completion</span>
          </div>
        </div>

        {/* Thin Progress Bar */}
        <div className="w-full bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden mt-3 mb-4">
          <div
            className="bg-[#059669] h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
            role="progressbar"
            aria-valuenow={completionPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${department.name} ${completionPercentage}% task completion`}
          />
        </div>
      </div>

      {/* Card Footer: Open Department Link */}
      <div className="border-t border-[#E5E7EB] pt-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={handleOpenDepartment}
          className="text-[13px] font-medium text-[#059669] hover:text-[#047857] inline-flex items-center gap-1.5 transition-colors cursor-pointer group/link"
        >
          <span>Open department</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

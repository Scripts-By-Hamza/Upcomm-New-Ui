import React, { useState, useRef, useEffect } from 'react';
import { Avatar } from '../common/Avatar';
import {
  MoreVertical,
  Pencil,
  UserX,
  UserCheck,
  Trash2,
  Mail,
  Shield,
  Building2,
} from 'lucide-react';
import { getRoleDisplayLabel } from '../../utils/employeeWorkloadUtils';

export function TeamRow({
  user,
  department,
  workload,
  currentUser,
  canManageUsers,
  onEditUser,
  onManagePermissions,
  onToggleStatus,
  onDeleteUser,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSelf = String(currentUser?.id) === String(user.id);
  const isActive = user.is_active !== false && user.status !== 'inactive' && user.status !== 'disabled';
  const roleLabel = getRoleDisplayLabel(user.role);
  const isHod = user.role === 'hod';

  return (
    <tr className="border-b border-[#F4F4F5] hover:bg-[#F7F8FA] transition-colors group select-none h-[70px]">
      {/* 1. Employee Column (Avatar, Name, Email) */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <Avatar
            src={user.avatar_url}
            name={user.full_name}
            size="md"
            className="w-10 h-10 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13.5px] font-semibold text-[#18181B] truncate">
                {user.full_name || 'Unnamed Employee'}
              </span>
              {isSelf && (
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded">
                  You
                </span>
              )}
            </div>
            <div className="text-[11.5px] text-[#71717A] truncate mt-0.5">
              {user.email || '—'}
            </div>
          </div>
        </div>
      </td>

      {/* 2. Department Column */}
      <td className="px-5 py-3 text-[13px] text-[#18181B]">
        {department ? (
          <span className="font-medium text-[#18181B] truncate max-w-[160px] inline-block">
            {department.name}
          </span>
        ) : (
          <span className="text-[#8B8B95]">—</span>
        )}
      </td>

      {/* 3. Role Column */}
      <td className="px-5 py-3 text-[13px] text-[#52525B]">
        <span className="font-medium text-[#18181B]">
          {roleLabel}
        </span>
      </td>

      {/* 4. Active Tasks */}
      <td className="px-5 py-3 text-[13px] text-[#18181B] font-medium font-mono">
        {workload.activeTasks}
      </td>

      {/* 5. Overdue */}
      <td className="px-5 py-3 text-[13px] font-mono">
        {workload.overdueTasks > 0 ? (
          <span className="text-[#DC2626] font-semibold">
            {workload.overdueTasks}
          </span>
        ) : (
          <span className="text-[#8B8B95]">0</span>
        )}
      </td>

      {/* 6. Status Column (● Active / ● Inactive) */}
      <td className="px-5 py-3 text-[12.5px]">
        <div className="inline-flex items-center gap-1.5 font-medium">
          <span
            className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-[#16A34A]' : 'bg-[#8B8B95]'
            }`}
          />
          <span className={isActive ? 'text-[#18181B]' : 'text-[#71717A]'}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </td>

      {/* 7. More Actions Menu */}
      <td className="px-5 py-3 text-right">
        {canManageUsers ? (
          <div ref={menuRef} className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-[6px] hover:bg-[#F1F3F5] text-[#71717A] hover:text-[#18181B] flex items-center justify-center transition-colors cursor-pointer"
              aria-label={`Actions for ${user.full_name}`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-30 animate-fade-in text-left divide-y divide-[#F4F4F5]">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEditUser(user);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-[#18181B] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#71717A]" />
                    <span>Edit User</span>
                  </button>

                  {canManageUsers && onManagePermissions && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onManagePermissions(user);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-[#18181B] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#059669]" />
                      <span>Manage Permissions</span>
                    </button>
                  )}

                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onToggleStatus(user);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-[#18181B] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                    >
                      {isActive ? (
                        <>
                          <UserX className="w-3.5 h-3.5 text-[#71717A]" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span>Reactivate</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {!isSelf && (
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteUser(user);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>Delete User</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <span className="w-8 h-8 inline-block" />
        )}
      </td>
    </tr>
  );
}

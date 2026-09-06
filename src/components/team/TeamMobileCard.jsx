import React, { useState, useRef, useEffect } from 'react';
import { Avatar } from '../common/Avatar';
import {
  MoreVertical,
  Pencil,
  Shield,
  UserX,
  UserCheck,
  Trash2,
  Mail,
  Building2,
} from 'lucide-react';
import { getRoleDisplayLabel } from '../../utils/employeeWorkloadUtils';

export function TeamMobileCard({
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

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 space-y-3 select-none">
      {/* Top Header: Avatar + Identity + More Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar
            src={user.avatar_url}
            name={user.full_name}
            size="md"
            className="w-10 h-10 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-[13.5px] font-semibold text-[#18181B] truncate">
                {user.full_name || 'Unnamed Employee'}
              </h4>
              {user.custom_id && (
                <span className="px-1.5 py-0.5 text-[10.5px] font-mono font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] rounded tracking-wide">
                  {user.custom_id}
                </span>
              )}
              {isSelf && (
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded">
                  You
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-[#71717A] truncate mt-0.5">
              {user.email || '—'}
            </p>
          </div>
        </div>

        {/* Three-dot More Actions */}
        {canManageUsers && (
          <div ref={menuRef} className="relative flex-shrink-0">
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
        )}
      </div>

      {/* Department & Role Pills */}
      <div className="flex items-center gap-2 text-[12px] flex-wrap pt-2 border-t border-[#F4F4F5]">
        <div className="flex items-center gap-1 text-[#52525B]">
          <Building2 className="w-3.5 h-3.5 text-[#8B8B95]" />
          <span>{department ? department.name : 'No department'}</span>
        </div>
        <span className="text-[#D4D4D8]">•</span>
        <span className="text-[#52525B] font-medium">{roleLabel}</span>
      </div>

      {/* Bottom Row: Metrics & Status */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F4F4F5] text-[12px]">
        {/* Metrics */}
        <div className="flex items-center gap-3">
          <span className="text-[#18181B] font-medium">
            {workload.activeTasks} active
          </span>
          {workload.overdueTasks > 0 ? (
            <span className="text-[#DC2626] font-semibold">
              {workload.overdueTasks} overdue
            </span>
          ) : (
            <span className="text-[#8B8B95]">0 overdue</span>
          )}
        </div>

        {/* Status */}
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
      </div>
    </div>
  );
}

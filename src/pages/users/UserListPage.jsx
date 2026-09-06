import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/dateUtils';
import {
  Users,
  UserPlus,
  Mail,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Briefcase,
  Building2,
  Shield,
} from 'lucide-react';

export function UserListPage() {
  const { users, currentUser, updateUser, deleteUser } = useAuth();
  const { departments, createNewUser } = useAppData();

  // Modal States
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);

  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Add User Form State
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addCustomId, setAddCustomId] = useState('');
  const [addDesignation, setAddDesignation] = useState('');
  const [addRole, setAddRole] = useState('team_member');
  const [addDepartmentId, setAddDepartmentId] = useState(departments[0]?.id || '');
  const [successMessage, setSuccessMessage] = useState('');

  // Edit User Form State
  const [editFullName, setEditFullName] = useState('');
  const [editCustomId, setEditCustomId] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editRole, setEditRole] = useState('team_member');
  const [editDepartmentId, setEditDepartmentId] = useState('');

  // Exclude IT Support Admin and hidden system accounts per PRD Section 29!
  // Sort order: 1. Admin -> 2. HODs -> 3. Team Members
  const ROLE_HIERARCHY = {
    admin: 1,
    it_support_admin: 2,
    hod: 3,
    team_member: 4,
  };

  const normalUsers = users
    .filter(
      (u) =>
        !u.exclude_from_directory &&
        !u.is_system_account &&
        u.role !== 'it_support_admin' &&
        u.role !== 'it_support'
    )
    .sort((a, b) => {
      const rankA = ROLE_HIERARCHY[a.role] || 99;
      const rankB = ROLE_HIERARCHY[b.role] || 99;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return (a.full_name || '').localeCompare(b.full_name || '');
    });

  // Helper designation default getter
  const getDesignation = (user) => {
    if (user.designation) return user.designation;
    if (user.role === 'admin') return 'System Administrator';
    if (user.role === 'hod') return 'Head of Department';
    return 'Team Member Specialist';
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!addFullName.trim() || !addEmail.trim()) return;

    const defaultCustomId = addCustomId.trim() || addFullName.trim().split(/\s+/)[0];
    const newUser = await createNewUser({
      full_name: addFullName,
      email: addEmail,
      custom_id: defaultCustomId || undefined,
      designation: addDesignation.trim() || 'Team Member Specialist',
      role: addRole,
      department_id: addDepartmentId,
    });

    setSuccessMessage(
      `User ${newUser.full_name} created successfully in database! Default password is "123456".`
    );

    setAddFullName('');
    setAddEmail('');
    setAddCustomId('');
    setAddDesignation('');
    setAddRole('team_member');

    setTimeout(() => {
      setSuccessMessage('');
      setIsAddUserModalOpen(false);
    }, 1800);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setEditFullName(user.full_name || '');
    setEditCustomId(user.custom_id || '');
    setEditDesignation(getDesignation(user));
    setEditRole(user.role || 'team_member');
    setEditDepartmentId(user.department_id || departments[0]?.id || '');
    setIsEditUserModalOpen(true);
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    await updateUser(editingUser.id, {
      full_name: editFullName,
      custom_id: editCustomId.trim() || null,
      designation: editDesignation,
      role: editRole,
      department_id: editDepartmentId,
    });

    setIsEditUserModalOpen(false);
    setEditingUser(null);
  };

  const handleOpenDeleteModal = (user) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (deletingUser) {
      await deleteUser(deletingUser.id);
      setDeletingUser(null);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Users & Roles Management
          </h2>
          <p className="text-[14px] leading-[20px] font-semibold text-slate-500 mt-1">
            Provision staff accounts, assign departmental leadership (HOD), edit designations, and set permissions.
          </p>
        </div>

        <Button variant="primary" icon={UserPlus} onClick={() => setIsAddUserModalOpen(true)}>
          Add Portal User
        </Button>
      </div>

      {/* Auto-Confirmed Provisioning Callout */}
      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-emerald-900 text-[12px] leading-[16px] font-semibold flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>
            <strong className="font-extrabold">Auto-Confirmed Provisioning Active:</strong> Admin-created users can log in immediately with default password <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-800">123456</code>.
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-[16px] font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-emerald-600" />
            Active Portal Accounts ({normalUsers.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr className="bg-slate-50 text-[14px] font-semibold leading-[20px] text-slate-600 tracking-tight border-b border-slate-200">
                <th className="py-3.5 px-6">User / Identity</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[14px] font-semibold leading-[20px] text-slate-800">
              {normalUsers.map((u) => {
                const dept = departments.find((d) => d.id === u.department_id);
                const designation = getDesignation(u);

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User / Identity */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar_url} name={u.full_name} size="md" showRoleBadge role={u.role} />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-[14px] leading-[20px] text-slate-900">{u.full_name}</p>
                            {u.custom_id && (
                              <span className="px-1.5 py-0.5 text-[10.5px] font-mono font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] rounded tracking-wide">
                                {u.custom_id}
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] leading-[16px] font-semibold text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 capitalize text-[14px] leading-[20px] font-semibold whitespace-nowrap">
                      <span
                        className={`px-3 py-0.5 rounded-full text-[12px] leading-[16px] font-semibold whitespace-nowrap inline-block ${
                          u.role === 'admin'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : u.role === 'hod'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}
                      >
                        {u.role === 'admin' ? 'Admin' : u.role === 'hod' ? 'HOD' : 'Team Member'}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-[14px] leading-[20px] font-semibold">
                      {dept ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dept.color }} />
                          <span className="text-slate-800">{dept.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold">All Departments</span>
                      )}
                    </td>

                    {/* Designation */}
                    <td className="py-3.5 px-4 text-[14px] leading-[20px] font-semibold text-slate-700">
                      {designation}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-[14px] leading-[20px] font-semibold text-slate-600">
                      {formatDate(u.created_at || '2026-01-10', 'dd MMM yyyy')}
                    </td>

                    {/* Actions (Edit & Delete User Icons) */}
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit User Icon */}
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-2 rounded-xl text-slate-600 hover:text-brand-700 hover:bg-brand-50 border border-slate-200/80 hover:border-brand-200 transition-all cursor-pointer"
                          title={`Edit User ${u.full_name}`}
                        >
                          <Pencil className="w-4 h-4 text-brand-600" />
                        </button>

                        {/* Delete User Icon */}
                        <button
                          onClick={() => handleOpenDeleteModal(u)}
                          className="p-2 rounded-xl text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 transition-all cursor-pointer"
                          title={`Delete User ${u.full_name}`}
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={isEditUserModalOpen}
          onClose={() => setIsEditUserModalOpen(false)}
          title={`Edit User Account — ${editingUser.full_name}`}
        >
          <form onSubmit={handleEditUserSubmit} className="space-y-4 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Name Field (Editable) */}
            <div>
              <label className="block text-[12px] leading-[16px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="User full name"
                className="w-full px-3.5 py-2 text-[14px] leading-[20px] bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-900"
              />
            </div>

            {/* Email Field (Read-only styled with Mid-Gray color!) */}
            <div>
              <label className="block text-[12px] leading-[16px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                readOnly
                value={editingUser.email}
                className="w-full px-3.5 py-2 text-[14px] leading-[20px] bg-slate-100 text-slate-400 font-semibold rounded-2xl border border-slate-200 cursor-not-allowed select-none"
                title="Email address cannot be modified"
              />
              <p className="text-[11px] text-slate-400 font-semibold mt-1">
                Primary user email address is locked and cannot be edited.
              </p>
            </div>

            {/* Custom User ID (Editable) */}
            <div>
              <label className="block text-[12px] leading-[16px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unique User ID (First Name / Identifier)
              </label>
              <input
                type="text"
                value={editCustomId}
                onChange={(e) => setEditCustomId(e.target.value)}
                placeholder="e.g. Ahmed, Hamza, Ahsan"
                className="w-full px-3.5 py-2 text-[14px] leading-[20px] bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-semibold text-slate-900"
              />
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Unique name/identifier used instead of full email when importing tasks via CSV/Excel.
              </p>
            </div>

            {/* Designation Field (Editable) */}
            <div>
              <label className="block text-[12px] leading-[16px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Designation *
              </label>
              <input
                type="text"
                required
                value={editDesignation}
                onChange={(e) => setEditDesignation(e.target.value)}
                placeholder="e.g. Social Media Manager / Senior Editor"
                className="w-full px-3.5 py-2 text-[14px] leading-[20px] bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-900"
              />
            </div>

            {/* Role & Department Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] leading-[16px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Role *
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] leading-[20px] bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-900"
                >
                  <option value="team_member">Team Member</option>
                  <option value="hod">HOD</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] leading-[16px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department *
                </label>
                <select
                  value={editDepartmentId}
                  onChange={(e) => setEditDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] leading-[20px] bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-900"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="ghost" onClick={() => setIsEditUserModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm User Account Deletion"
        >
          <div className="space-y-4 font-['Inter'] text-center py-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-[16px] font-black text-slate-900">
                Delete account for {deletingUser.full_name}?
              </h4>
              <p className="text-[14px] leading-[20px] font-semibold text-slate-500 mt-1">
                Are you sure you want to delete user account <strong className="text-slate-800">{deletingUser.email}</strong>? This action will remove the user from portal directory.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-3">
              <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" icon={Trash2} onClick={handleConfirmDeleteUser}>
                Confirm Delete User
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add User Modal */}
      <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Add New Portal User">
        {successMessage ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-bounce" />
            <p className="text-[14px] leading-[20px] font-semibold text-emerald-800">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleAddUserSubmit} className="space-y-4 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div>
              <label className="block text-[12px] leading-[16px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={addFullName}
                onChange={(e) => setAddFullName(e.target.value)}
                placeholder="e.g. Tariq Mahmood"
                className="w-full px-3.5 py-2 text-[14px] leading-[20px] bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[12px] leading-[16px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="user@company.com"
                className="w-full px-3.5 py-2 text-[14px] leading-[20px] bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[12px] leading-[16px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unique User ID (First Name / Identifier)
              </label>
              <input
                type="text"
                value={addCustomId}
                onChange={(e) => setAddCustomId(e.target.value)}
                placeholder="e.g. Ahmed, Hamza, Ahsan (leave blank to auto-use first name)"
                className="w-full px-3.5 py-2 text-[14px] leading-[20px] bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-semibold"
              />
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Used to assign tasks quickly in CSV task imports without typing full email.
              </p>
            </div>

            <div>
              <label className="block text-[12px] leading-[16px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Designation *
              </label>
              <input
                type="text"
                value={addDesignation}
                onChange={(e) => setAddDesignation(e.target.value)}
                placeholder="e.g. Senior Content Editor"
                className="w-full px-3.5 py-2 text-[14px] leading-[20px] bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] leading-[16px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Role *
                </label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] leading-[20px] bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                >
                  <option value="team_member">Team Member</option>
                  <option value="hod">HOD</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] leading-[16px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department *
                </label>
                <select
                  value={addDepartmentId}
                  onChange={(e) => setAddDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] leading-[20px] bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-2xl text-[12px] leading-[16px] font-semibold text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Auto-Confirmed User Creation Rules:</p>
              <p>• Default password set automatically to <code className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800">123456</code></p>
              <p>• User can log in immediately (No email confirmation required)</p>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="ghost" onClick={() => setIsAddUserModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" icon={UserPlus}>
                Create User
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

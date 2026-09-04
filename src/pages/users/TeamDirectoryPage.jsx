import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { Avatar } from '../../components/common/Avatar';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { formatDate } from '../../utils/dateUtils';
import {
  Mail,
  Search,
  Users,
  ChevronDown,
  ChevronUp,
  Calendar,
  Briefcase,
  UserCheck,
  CheckCircle,
  Building2,
  Sparkles,
} from 'lucide-react';
import { isTaskInDepartment } from '../../utils/taskDepartmentUtils';

export function TeamDirectoryPage() {
  const { users, currentUser } = useAuth();
  const { departments, tasks } = useAppData();

  const role = currentUser?.role || 'team_member';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const userDept = departments.find((d) => d.id === currentUser?.department_id);

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState(() => (isAdmin ? 'all' : currentUser?.department_id || 'all'));

  // Modal State for HOD Details
  const [selectedHod, setSelectedHod] = useState(null);
  const [isHodModalOpen, setIsHodModalOpen] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  // Filter Head of Departments (HODs), excluding IT Support Admin and hidden system accounts
  const hodUsers = users.filter((u) => {
    if (u.exclude_from_directory || u.is_system_account) return false;
    if (!isAdmin && u.department_id !== currentUser?.department_id) return false;
    const isHodRole = u.role === 'hod';
    const isDeptHod = departments.some((d) => d.hod_id === u.id);
    return isHodRole || isDeptHod;
  });

  const filteredHods = hodUsers.filter((u) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = u.full_name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    if (isAdmin && selectedDept !== 'all' && u.department_id !== selectedDept) {
      return false;
    }
    if (!isAdmin && u.department_id !== currentUser?.department_id) {
      return false;
    }
    return true;
  });

  const handleOpenHodModal = (hod) => {
    setSelectedHod(hod);
    setIsHodModalOpen(true);

    // Auto expand first team member if exists
    const deptMembers = users.filter(
      (m) => m.department_id === hod.department_id && m.id !== hod.id && !m.exclude_from_directory
    );
    if (deptMembers.length > 0) {
      setExpandedMemberId(deptMembers[0].id);
    } else {
      setExpandedMemberId(null);
    }
  };

  // Helper designation mapping for team members
  const getDesignation = (user, deptName) => {
    if (user.designation) return user.designation;
    const roleTitles = {
      'dept-social': ['Social Media Strategist', 'Content Creator', 'Community Lead'],
      'dept-marketing': ['Digital Marketing Specialist', 'SEO Analyst', 'Growth Marketer'],
      'dept-video': ['Senior Video Editor', 'Motion Graphics Artist', 'Videographer'],
      'dept-sourcing': ['Procurement Specialist', 'Supplier Relations Lead'],
      'dept-finance': ['Financial Analyst', 'Accountant'],
      'dept-hr': ['HR Operations Associate', 'Talent Acquisition Coordinator'],
      'dept-procurement': ['Logistics Coordinator', 'Inventory Analyst'],
    };
    const titles = roleTitles[user.department_id] || ['Team Specialist'];
    return titles[0];
  };

  // Current selected HOD data for modal
  const selectedHodDept = selectedHod ? departments.find((d) => d.id === selectedHod.department_id) : null;
  const selectedHodMembers = selectedHod
    ? users.filter(
        (m) =>
          m.department_id === selectedHod.department_id &&
          m.id !== selectedHod.id &&
          !m.exclude_from_directory &&
          !m.is_system_account
      )
    : [];

  const selectedHodDeptTasks = selectedHod
    ? tasks.filter((t) => isTaskInDepartment(t, selectedHod.department_id, users))
    : [];

  return (
    <div className="space-y-6 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Head Of Departments Directory
          </h2>
          <p className="text-[13px] leading-[18px] font-semibold text-slate-500 mt-1">
            Double-click an HOD card to inspect leadership details and complete department team member listings.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
          <div className="relative min-w-[200px] sm:w-56 lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
            />
          </div>

          {isAdmin ? (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700 max-w-[220px] truncate"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : (
            <div
              className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 flex items-center gap-2 select-none flex-shrink-0 whitespace-nowrap shadow-2xs"
              title={`Assigned department: ${userDept?.name || 'My Department'}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: userDept?.color || '#10B981' }}
              />
              <span className="truncate max-w-[220px]">{userDept?.name || 'My Department'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Directory Cards Grid (Showing ONLY HODs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredHods.map((hod) => {
          const dept = departments.find((d) => d.id === hod.department_id);
          const teamMemberCount = users.filter(
            (u) => u.department_id === hod.department_id && u.id !== hod.id && !u.exclude_from_directory
          ).length;

          return (
            <div
              key={hod.id}
              onDoubleClick={() => handleOpenHodModal(hod)}
              onClick={() => handleOpenHodModal(hod)}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center flex flex-col items-center justify-between hover:border-brand-400 hover:shadow-xl transition-all duration-200 cursor-pointer group relative"
              title="Double click to view department team details"
            >
              <div className="flex flex-col items-center w-full">
                {/* HOD Avatar Container with Fixed Dimensions */}
                <div className="mb-3">
                  {hod.avatar_url ? (
                    <img
                      src={hod.avatar_url}
                      alt={hod.full_name}
                      className="w-20 h-20 rounded-full object-cover shadow-sm ring-4 ring-white flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-400 text-white font-bold text-xl flex items-center justify-center shadow-sm ring-4 ring-white flex-shrink-0">
                      {hod.full_name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* HOD Name */}
                <h3 className="text-[16px] font-extrabold text-slate-900 mt-2 group-hover:text-brand-600 transition-colors">
                  {hod.full_name}
                </h3>

                {/* Role Subtitle */}
                <p className="text-[14px] leading-[20px] font-semibold text-slate-500 mt-0.5">
                  Head Of Department
                </p>

                {/* Department Name Badge */}
                {dept && (
                  <span
                    className="mt-2.5 px-3 py-1 rounded-full text-[12px] leading-[16px] font-semibold text-white shadow-2xs"
                    style={{ backgroundColor: dept.color }}
                  >
                    {dept.name}
                  </span>
                )}

                {/* Email Address */}
                <div className="mt-4 pt-3 border-t border-slate-100 w-full text-[12px] leading-[16px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate max-w-[190px]">{hod.email}</span>
                </div>
              </div>

              {/* Bottom Section: Team Members Count */}
              <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-[12px] leading-[16px]">
                <span className="text-slate-500 font-semibold">Team Members:</span>
                <span className="font-semibold text-brand-700 bg-brand-50 border border-brand-100 px-3 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                  {teamMemberCount} {teamMemberCount === 1 ? 'Member' : 'Members'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Split Dialog Modal for HOD & Department Team Members */}
      {selectedHod && (
        <Modal
          isOpen={isHodModalOpen}
          onClose={() => setIsHodModalOpen(false)}
          title={`Department Leadership & Staff Directory — ${selectedHodDept?.name || 'Department'}`}
          maxWidth="max-w-5xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Left Column: Head of Department Person Information */}
            <div className="md:col-span-5 bg-slate-50 p-6 rounded-3xl border border-slate-200/80 flex flex-col items-center text-center space-y-4">
              <div>
                {selectedHod.avatar_url ? (
                  <img
                    src={selectedHod.avatar_url}
                    alt={selectedHod.full_name}
                    className="w-24 h-24 rounded-full object-cover shadow-md ring-4 ring-white flex-shrink-0 mx-auto"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-400 text-white font-bold text-2xl flex items-center justify-center shadow-md ring-4 ring-white flex-shrink-0 mx-auto">
                    {selectedHod.full_name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <h3 className="text-xl font-black text-slate-900">{selectedHod.full_name}</h3>
                <p className="text-[14px] leading-[20px] font-semibold text-brand-700 mt-0.5">
                  Head Of Department
                </p>
                {selectedHodDept && (
                  <span
                    className="inline-block mt-2 px-3.5 py-1 rounded-full text-[12px] leading-[16px] font-semibold text-white shadow-xs"
                    style={{ backgroundColor: selectedHodDept.color }}
                  >
                    {selectedHodDept.name}
                  </span>
                )}
              </div>

              {/* HOD Contact & Info */}
              <div className="w-full space-y-2.5 pt-2 text-left text-[12px] leading-[16px] font-semibold text-slate-700">
                <div className="p-3 bg-white rounded-2xl border border-slate-200/60 flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Official Email</p>
                    <p className="truncate font-semibold text-slate-900">{selectedHod.email}</p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200/60 flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Leadership Joined</p>
                    <p className="font-semibold text-slate-900">{formatDate(selectedHod.created_at || '2026-01-10')}</p>
                  </div>
                </div>
              </div>

              {/* Department Performance Overview */}
              <div className="w-full p-4 bg-white rounded-2xl border border-slate-200/60 space-y-2 text-left">
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Department Stats Overview
                </p>
                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="p-2 bg-indigo-50/60 rounded-xl border border-indigo-100">
                    <p className="text-lg font-black text-brand-700">{selectedHodMembers.length}</p>
                    <p className="text-[10px] font-semibold text-slate-500">Team Staff</p>
                  </div>
                  <div className="p-2 bg-amber-50/60 rounded-xl border border-amber-100">
                    <p className="text-lg font-black text-amber-700">
                      {selectedHodDeptTasks.filter((t) => t.status !== 'completed').length}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500">Active Tasks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: List of Department Team Members with Dropdown Detail View */}
            <div className="md:col-span-7 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-[16px] font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-brand-600" />
                    Department Team Members ({selectedHodMembers.length})
                  </h4>
                  <p className="text-[12px] leading-[16px] font-semibold text-slate-500 mt-0.5">
                    Click any team member dropdown to view full details
                  </p>
                </div>
              </div>

              {selectedHodMembers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200/80">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[14px] leading-[20px] font-semibold text-slate-600">No direct team members assigned yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {selectedHodMembers.map((member) => {
                    const isExpanded = expandedMemberId === member.id;
                    const memberTasksCount = tasks.filter(
                      (t) => t.assigned_to === member.id && t.status !== 'completed'
                    ).length;
                    const designation = getDesignation(member, selectedHodDept?.name);

                    return (
                      <div
                        key={member.id}
                        className={`rounded-2xl border transition-all duration-150 overflow-hidden ${
                          isExpanded
                            ? 'bg-white border-brand-300 shadow-md ring-1 ring-brand-200'
                            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80'
                        }`}
                      >
                        {/* Dropdown Accordion Header Bar */}
                        <button
                          onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                          className="w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar src={member.avatar_url} name={member.full_name} size="sm" />
                            <div className="min-w-0">
                              <h5 className="text-[14px] leading-[20px] font-semibold text-slate-900 truncate">
                                {member.full_name}
                              </h5>
                              <p className="text-[12px] leading-[16px] font-semibold text-slate-500 truncate">
                                {designation}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                              {memberTasksCount} Tasks
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-brand-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Dropdown Details View */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-white space-y-3 animate-fade-in font-['Inter']">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] leading-[16px] font-semibold">
                              {/* Email */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                                  Email Address
                                </span>
                                <span className="text-slate-900 font-semibold truncate block">
                                  {member.email}
                                </span>
                              </div>

                              {/* Designation */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                                  Designation
                                </span>
                                <span className="text-brand-700 font-semibold block">
                                  {designation}
                                </span>
                              </div>

                              {/* Team Add Date */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                                  Team Add Date
                                </span>
                                <span className="text-slate-800 font-semibold flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {formatDate(member.created_at || '2026-02-01')}
                                </span>
                              </div>

                              {/* Workload Status */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                                  Workload Status
                                </span>
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  Active ({memberTasksCount} Pending Tasks)
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

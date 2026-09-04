import React, { useState, useEffect, useMemo } from 'react';
import { X, Target, BarChart2, Calendar, User, Building2, Check, AlertCircle } from 'lucide-react';
import {
  calculateMonthEndDate,
  formatDueDateDisplay,
  getAvailableMonthOptions,
  formatMonthYear,
} from '../../utils/monthlyTargets/monthlyTargetUtils';
import { getEligibleTargetOwners } from '../../utils/monthlyTargets/monthlyTargetPermissions';

export function AddMonthlyTargetModal({
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
  targetToEdit = null,
  initialYear = 2026,
  initialMonth = 9,
  users = [],
  departments = [],
  currentUser = null,
}) {
  const isEditing = Boolean(targetToEdit);
  const role = currentUser?.role || 'team_member';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const isHOD = role === 'hod';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('target'); // 'target' | 'kpi'
  const [kpiTargetValue, setKpiTargetValue] = useState('');
  const [kpiCurrentValue, setKpiCurrentValue] = useState('0');
  const [kpiUnit, setKpiUnit] = useState('');
  const [selectedMonthKey, setSelectedMonthKey] = useState(`${initialYear}-${String(initialMonth).padStart(2, '0')}`);
  const [status, setStatus] = useState('not_started');
  const [priority, setPriority] = useState('medium');
  const [progress, setProgress] = useState(0);
  const [ownerUserId, setOwnerUserId] = useState(currentUser?.id || '');
  const [error, setError] = useState('');

  // Month options for selector (past 6 months to next 6 months)
  const monthOptions = useMemo(() => {
    const now = new Date();
    return getAvailableMonthOptions(now.getFullYear(), now.getMonth() + 1, 6);
  }, []);

  // Eligible owners for selection based on current user role
  const eligibleOwners = useMemo(() => {
    return getEligibleTargetOwners(currentUser, users, departments);
  }, [currentUser, users, departments]);

  // Derived parsed year and month
  const { parsedYear, parsedMonth } = useMemo(() => {
    const [y, m] = selectedMonthKey.split('-');
    return {
      parsedYear: parseInt(y, 10) || initialYear,
      parsedMonth: parseInt(m, 10) || initialMonth,
    };
  }, [selectedMonthKey, initialYear, initialMonth]);

  // Auto-calculated month-end due date (Strictly read-only)
  const autoDueDate = useMemo(() => {
    return calculateMonthEndDate(parsedYear, parsedMonth);
  }, [parsedYear, parsedMonth]);

  // Initialize or reset form fields
  useEffect(() => {
    if (targetToEdit) {
      setTitle(targetToEdit.title || '');
      setDescription(targetToEdit.description || '');
      setType(targetToEdit.type || 'target');
      setKpiTargetValue(targetToEdit.kpi_target_value !== null && targetToEdit.kpi_target_value !== undefined ? String(targetToEdit.kpi_target_value) : '');
      setKpiCurrentValue(targetToEdit.kpi_current_value !== null && targetToEdit.kpi_current_value !== undefined ? String(targetToEdit.kpi_current_value) : '0');
      setKpiUnit(targetToEdit.kpi_unit || '');
      setSelectedMonthKey(targetToEdit.target_month || `${targetToEdit.year}-${String(targetToEdit.month).padStart(2, '0')}`);
      setStatus(targetToEdit.status || 'not_started');
      setPriority(targetToEdit.priority || 'medium');
      setProgress(targetToEdit.progress || 0);
      setOwnerUserId(targetToEdit.owner_user_id || currentUser?.id);
    } else {
      setTitle('');
      setDescription('');
      setType('target');
      setKpiTargetValue('');
      setKpiCurrentValue('0');
      setKpiUnit('');
      setSelectedMonthKey(`${initialYear}-${String(initialMonth).padStart(2, '0')}`);
      setStatus('not_started');
      setPriority('medium');
      setProgress(0);
      setOwnerUserId(currentUser?.id || '');
    }
    setError('');
  }, [targetToEdit, isOpen, initialYear, initialMonth, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Target title is required.');
      return;
    }

    if (type === 'kpi' && (!kpiTargetValue || isNaN(Number(kpiTargetValue)) || Number(kpiTargetValue) <= 0)) {
      setError('Please provide a valid positive KPI target value.');
      return;
    }

    // Resolve owner and department
    const selectedOwner = (users || []).find((u) => u.id === ownerUserId) || currentUser;
    const resolvedDeptId = selectedOwner?.department_id || currentUser?.department_id || null;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      type,
      year: parsedYear,
      month: parsedMonth,
      target_month: selectedMonthKey,
      due_date: autoDueDate,
      status,
      priority,
      progress: status === 'completed' ? 100 : progress,
      kpi_target_value: type === 'kpi' ? Number(kpiTargetValue) : null,
      kpi_current_value: type === 'kpi' ? Number(kpiCurrentValue || 0) : null,
      kpi_unit: type === 'kpi' ? kpiUnit.trim() : null,
      owner_user_id: ownerUserId,
      department_id: resolvedDeptId,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-emerald-50 text-[#059669] flex items-center justify-center border border-emerald-100">
              <Target className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#18181B] leading-tight">
                {isEditing ? 'Edit Monthly Target' : 'Add Monthly Target'}
              </h3>
              <p className="text-[12px] text-[#71717A]">
                Set a goal for {formatMonthYear(parsedYear, parsedMonth)}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[12px] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Switcher: Standard Target vs KPI */}
          <div>
            <label className="block text-[12px] font-semibold text-[#52525B] mb-1.5">
              Goal Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('target')}
                className={`py-2 px-3 rounded-[8px] border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                  type === 'target'
                    ? 'border-[#059669] bg-emerald-50/50 text-[#059669]'
                    : 'border-[#E5E7EB] hover:bg-[#F4F4F5] text-[#71717A]'
                }`}
              >
                <Target className="w-4 h-4" />
                <div>
                  <div className="text-[12.5px] font-bold text-[#18181B]">Standard Target</div>
                  <div className="text-[11px] text-[#71717A]">Deliverable / milestone</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('kpi')}
                className={`py-2 px-3 rounded-[8px] border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                  type === 'kpi'
                    ? 'border-purple-600 bg-purple-50/50 text-purple-700'
                    : 'border-[#E5E7EB] hover:bg-[#F4F4F5] text-[#71717A]'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <div>
                  <div className="text-[12.5px] font-bold text-[#18181B]">Measurable KPI</div>
                  <div className="text-[11px] text-[#71717A]">Target value & metric</div>
                </div>
              </button>
            </div>
          </div>

          {/* Target Title */}
          <div>
            <label className="block text-[12px] font-semibold text-[#52525B] mb-1">
              Target Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete website redesign, Publish 20 posts..."
              className="w-full bg-white text-[13px] text-[#18181B] placeholder-[#8B8B95] px-3 py-2 rounded-[8px] border border-[#E5E7EB] focus:border-[#059669] focus:outline-none transition-colors"
              required
            />
          </div>

          {/* KPI Fields (if Type === 'kpi') */}
          {type === 'kpi' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-purple-50/40 rounded-[8px] border border-purple-100">
              <div>
                <label className="block text-[11.5px] font-semibold text-[#52525B] mb-1">
                  Target Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={kpiTargetValue}
                  onChange={(e) => setKpiTargetValue(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full bg-white text-[13px] text-[#18181B] px-2.5 py-1.5 rounded-[6px] border border-[#E5E7EB] focus:border-purple-600 focus:outline-none"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[#52525B] mb-1">
                  Current Value
                </label>
                <input
                  type="number"
                  value={kpiCurrentValue}
                  onChange={(e) => setKpiCurrentValue(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white text-[13px] text-[#18181B] px-2.5 py-1.5 rounded-[6px] border border-[#E5E7EB] focus:border-purple-600 focus:outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[#52525B] mb-1">
                  Unit (Label)
                </label>
                <input
                  type="text"
                  value={kpiUnit}
                  onChange={(e) => setKpiUnit(e.target.value)}
                  placeholder="e.g. posts, tickets"
                  className="w-full bg-white text-[13px] text-[#18181B] px-2.5 py-1.5 rounded-[6px] border border-[#E5E7EB] focus:border-purple-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-[12px] font-semibold text-[#52525B] mb-1">
              Description / Action Items
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline specific objectives, constraints or deliverables..."
              rows={3}
              className="w-full bg-white text-[13px] text-[#18181B] placeholder-[#8B8B95] px-3 py-2 rounded-[8px] border border-[#E5E7EB] focus:border-[#059669] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Target Month & Read-Only Auto Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#52525B] mb-1">
                Target Month
              </label>
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="w-full bg-white text-[13px] text-[#18181B] px-3 py-2 rounded-[8px] border border-[#E5E7EB] focus:border-[#059669] focus:outline-none cursor-pointer"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#52525B] mb-1">
                Due Date <span className="text-[10.5px] font-normal text-[#8B8B95]">(Auto-set month end)</span>
              </label>
              <div className="flex items-center gap-2 bg-[#F4F4F5] px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] text-[#52525B] font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#8B8B95]" />
                <span>{formatDueDateDisplay(autoDueDate)}</span>
              </div>
            </div>
          </div>

          {/* Owner & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Target Owner (Role aware) */}
            <div>
              <label className="block text-[12px] font-semibold text-[#52525B] mb-1">
                Target Owner
              </label>
              {role === 'team_member' ? (
                <div className="flex items-center gap-2 bg-[#F4F4F5] px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] text-[#18181B] font-medium">
                  <User className="w-3.5 h-3.5 text-[#8B8B95]" />
                  <span>{currentUser?.full_name || 'You'} (Self)</span>
                </div>
              ) : (
                <select
                  value={ownerUserId}
                  onChange={(e) => setOwnerUserId(e.target.value)}
                  className="w-full bg-white text-[13px] text-[#18181B] px-3 py-2 rounded-[8px] border border-[#E5E7EB] focus:border-[#059669] focus:outline-none cursor-pointer"
                >
                  {eligibleOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.full_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-[12px] font-semibold text-[#52525B] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white text-[13px] text-[#18181B] px-3 py-2 rounded-[8px] border border-[#E5E7EB] focus:border-[#059669] focus:outline-none cursor-pointer"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Progress Slider (for Standard Target) */}
          {type === 'target' && (
            <div>
              <div className="flex items-center justify-between text-[12px] font-semibold text-[#52525B] mb-1">
                <span>Progress</span>
                <span className="font-bold text-[#18181B]">{progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[#059669] cursor-pointer"
              />
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-[8px] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-[13px] font-medium bg-[#059669] hover:bg-[#047857] text-white rounded-[8px] transition-colors cursor-pointer shadow-none"
          >
            {isEditing ? 'Save Changes' : 'Add Target'}
          </button>
        </div>
      </div>
    </div>
  );
}

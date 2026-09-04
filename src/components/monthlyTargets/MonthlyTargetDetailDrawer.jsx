import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Target,
  BarChart2,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle2,
  CircleDot,
  Edit2,
  Trash2,
  Send,
  MessageSquare,
  History,
  AlertCircle,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import {
  formatDueDateDisplay,
  formatMonthYear,
  isTargetOverdue,
} from '../../utils/monthlyTargets/monthlyTargetUtils';
import {
  canEditMonthlyTarget,
  canDeleteMonthlyTarget,
} from '../../utils/monthlyTargets/monthlyTargetPermissions';
import { useAppData } from '../../contexts/AppDataContext';

export function MonthlyTargetDetailDrawer({
  target = null,
  isOpen = false,
  onClose = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onUpdateStatus = () => {},
  onUpdateProgress = () => {},
  comments = [],
  onAddComment = () => {},
  users = [],
  departments = [],
  currentUser = null,
}) {
  const { readChatIds = [], markAllChatsAsRead } = useAppData();
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'updates'
  const [commentText, setCommentText] = useState('');
  const [inlineProgress, setInlineProgress] = useState(0);
  const [inlineKpiCurrent, setInlineKpiCurrent] = useState(0);
  const commentsEndRef = useRef(null);

  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  const deptMap = useMemo(() => {
    const map = {};
    (departments || []).forEach((d) => {
      if (d && d.id) map[d.id] = d;
    });
    return map;
  }, [departments]);

  useEffect(() => {
    if (target) {
      setInlineProgress(target.progress || 0);
      setInlineKpiCurrent(target.kpi_current_value || 0);
    }
  }, [target]);

  // Target-specific comments
  const targetComments = useMemo(() => {
    if (!target) return [];
    return (comments || []).filter((c) => c.target_id === target.id);
  }, [comments, target]);

  // Mark unread target comments as read when drawer is open
  useEffect(() => {
    if (isOpen && target && targetComments.length > 0 && markAllChatsAsRead) {
      const unreadIds = targetComments
        .filter((c) => c && c.id && c.user_id !== currentUser?.id && !readChatIds.includes(String(c.id)))
        .map((c) => String(c.id));
      if (unreadIds.length > 0) {
        markAllChatsAsRead(unreadIds);
      }
    }
  }, [isOpen, target, targetComments, currentUser?.id, readChatIds, markAllChatsAsRead]);

  if (!isOpen || !target) return null;

  const owner = userMap[target.owner_user_id];
  const creator = userMap[target.created_by];
  const dept = deptMap[target.department_id];
  const isKpi = target.type === 'kpi';
  const overdue = isTargetOverdue(target);

  const canEdit = canEditMonthlyTarget(currentUser, target, users);
  const canDelete = canDeleteMonthlyTarget(currentUser, target);

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment(target.id, {
      text: commentText.trim(),
    });
    setCommentText('');

    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleProgressBlur = () => {
    if (isKpi) {
      const current = Number(inlineKpiCurrent);
      const total = Number(target.kpi_target_value) || 1;
      const calcProgress = Math.min(Math.round((current / total) * 100), 100);
      onUpdateProgress(target.id, calcProgress, current);
    } else {
      onUpdateProgress(target.id, Number(inlineProgress), null);
    }
  };

  const formatCommentTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs select-none">
      <div className="w-full max-w-[640px] bg-white h-full shadow-2xl flex flex-col animate-slide-left border-l border-[#E5E7EB]">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold px-2 py-0.5 rounded-[6px] bg-emerald-50 text-[#059669] border border-emerald-200">
              {formatMonthYear(target.year, target.month)}
            </span>
            {isKpi ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                KPI
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                Target
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(target)}
                className="p-1.5 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
                title="Edit Target"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this monthly target?')) {
                    onDelete(target.id);
                    onClose();
                  }
                }}
                className="p-1.5 rounded-[6px] text-[#71717A] hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                title="Delete Target"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Target Title */}
          <div>
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#18181B] leading-snug">
              {target.title}
            </h2>
          </div>

          {/* Properties Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#F9FAFB] rounded-[10px] border border-[#E5E7EB] text-[12.5px]">
            {/* Status */}
            <div>
              <span className="text-[11px] font-semibold text-[#71717A] uppercase block mb-1">
                Status
              </span>
              <select
                value={target.status || 'not_started'}
                onChange={(e) => onUpdateStatus(target.id, e.target.value)}
                className="bg-white border border-[#E5E7EB] text-[12px] font-semibold text-[#18181B] px-2 py-1 rounded-[6px] cursor-pointer focus:outline-none focus:border-[#059669]"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Owner */}
            <div>
              <span className="text-[11px] font-semibold text-[#71717A] uppercase block mb-1">
                Owner
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar
                  src={owner?.avatar_url}
                  name={owner?.full_name || 'Owner'}
                  size="xs"
                />
                <span className="font-semibold text-[#18181B] truncate">
                  {owner?.full_name || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Department */}
            <div>
              <span className="text-[11px] font-semibold text-[#71717A] uppercase block mb-1">
                Department
              </span>
              <span className="font-semibold text-[#18181B] truncate block">
                {dept?.name || 'General'}
              </span>
            </div>

            {/* Target Month */}
            <div>
              <span className="text-[11px] font-semibold text-[#71717A] uppercase block mb-1">
                Target Month
              </span>
              <span className="font-medium text-[#18181B]">
                {formatMonthYear(target.year, target.month)}
              </span>
            </div>

            {/* Due Date (Auto Month-End) */}
            <div>
              <span className="text-[11px] font-semibold text-[#71717A] uppercase block mb-1">
                Due Date
              </span>
              <span
                className={`font-mono font-medium ${
                  overdue ? 'text-[#DC2626] font-bold' : 'text-[#18181B]'
                }`}
              >
                {formatDueDateDisplay(target.due_date)}
              </span>
            </div>

            {/* Created By */}
            <div>
              <span className="text-[11px] font-semibold text-[#71717A] uppercase block mb-1">
                Created By
              </span>
              <span className="font-medium text-[#52525B]">
                {creator?.full_name?.split(' ')[0] || 'Admin'}
              </span>
            </div>
          </div>

          {/* Progress / KPI interactive editor */}
          <div className="p-4 bg-white rounded-[10px] border border-[#E5E7EB] space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-bold text-[#18181B]">
                {isKpi ? 'KPI Metric Target' : 'Current Progress'}
              </span>
              <span className="font-bold text-[#059669]">
                {isKpi
                  ? `${target.kpi_current_value ?? 0} / ${target.kpi_target_value ?? 0} ${
                      target.kpi_unit || ''
                    }`
                  : `${target.progress || 0}%`}
              </span>
            </div>

            {isKpi ? (
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-[12px] text-[#71717A]">Update Current:</span>
                  <input
                    type="number"
                    value={inlineKpiCurrent}
                    onChange={(e) => setInlineKpiCurrent(e.target.value)}
                    onBlur={handleProgressBlur}
                    className="w-20 bg-[#F4F4F5] text-[13px] font-bold text-[#18181B] px-2 py-1 rounded-[6px] border border-[#E5E7EB] focus:border-purple-600 focus:outline-none"
                    min="0"
                  />
                  <span className="text-[12px] text-[#71717A]">{target.kpi_unit || ''}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={inlineProgress}
                  onChange={(e) => setInlineProgress(Number(e.target.value))}
                  onMouseUp={handleProgressBlur}
                  onTouchEnd={handleProgressBlur}
                  className="w-full accent-[#059669] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Description */}
          {target.description && (
            <div>
              <h4 className="text-[12px] font-bold uppercase text-[#71717A] tracking-wider mb-2">
                Description & Deliverables
              </h4>
              <p className="text-[13.5px] text-[#3F3F46] leading-relaxed whitespace-pre-wrap bg-[#FAFAFA] p-3.5 rounded-[8px] border border-[#E5E7EB]">
                {target.description}
              </p>
            </div>
          )}

          {/* Local Thread Tabs: Comments & Updates */}
          <div className="pt-2">
            <div className="flex items-center gap-4 border-b border-[#E5E7EB] mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`pb-2 text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'comments'
                    ? 'border-[#059669] text-[#059669]'
                    : 'border-transparent text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comments ({targetComments.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('updates')}
                className={`pb-2 text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'updates'
                    ? 'border-[#059669] text-[#059669]'
                    : 'border-transparent text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Timeline History</span>
              </button>
            </div>

            {/* Comments Tab Content */}
            {activeTab === 'comments' ? (
              <div className="space-y-4">
                {targetComments.length === 0 ? (
                  <div className="py-8 text-center text-[#8B8B95] space-y-1">
                    <MessageSquare className="w-6 h-6 mx-auto opacity-40 mb-1" />
                    <p className="text-[13px] font-medium text-[#18181B]">No comments yet</p>
                    <p className="text-[11.5px] text-[#71717A]">
                      Post updates, questions, or notes on this monthly target.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {targetComments.map((comment) => {
                      const author = userMap[comment.user_id];
                      const authorName = author?.full_name || comment.user_name || 'Team Member';
                      const authorRole = author?.role || comment.user_role;

                      return (
                        <div
                          key={comment.id}
                          className="flex items-start gap-3 p-3 rounded-[8px] bg-[#F9FAFB] border border-[#E5E7EB]"
                        >
                          <Avatar
                            src={author?.avatar_url || comment.user_avatar}
                            name={authorName}
                            size="sm"
                            className="flex-shrink-0 mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-bold text-[#18181B]">
                                {authorName}
                              </span>
                              {authorRole && (
                                <span className="text-[9.5px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#E5E7EB] text-[#52525B]">
                                  {authorRole === 'admin'
                                    ? 'Admin'
                                    : authorRole === 'hod'
                                    ? 'HOD'
                                    : 'Member'}
                                </span>
                              )}
                              <span className="text-[11px] text-[#8B8B95] font-mono ml-auto">
                                {formatCommentTime(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-[13px] text-[#3F3F46] mt-1 whitespace-pre-wrap leading-relaxed">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={commentsEndRef} />
                  </div>
                )}
              </div>
            ) : (
              /* Updates Timeline Content */
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 text-[12px] text-[#52525B]">
                  <div className="w-2 h-2 rounded-full bg-[#059669] mt-1.5 flex-shrink-0"></div>
                  <div>
                    <span className="font-semibold text-[#18181B]">Target Created</span> on{' '}
                    {new Date(target.created_at).toLocaleDateString()}
                  </div>
                </div>
                {target.updated_at && target.updated_at !== target.created_at && (
                  <div className="flex items-start gap-2.5 text-[12px] text-[#52525B]">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                    <div>
                      <span className="font-semibold text-[#18181B]">Last Modified</span> on{' '}
                      {new Date(target.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {target.status === 'completed' && (
                  <div className="flex items-start gap-2.5 text-[12px] text-[#059669]">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Marked Completed</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Sticky Comment Composer */}
        <div className="p-3.5 border-t border-[#E5E7EB] bg-[#FAFAFA]">
          <form onSubmit={handleSendComment} className="flex items-center gap-2">
            <Avatar
              src={currentUser?.avatar_url}
              name={currentUser?.full_name || 'You'}
              size="sm"
              className="flex-shrink-0"
            />
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment or update on this target..."
              className="flex-1 bg-white text-[13px] text-[#18181B] placeholder-[#8B8B95] px-3.5 py-2 rounded-[8px] border border-[#E5E7EB] focus:border-[#059669] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="h-[36px] px-3.5 bg-[#059669] hover:bg-[#047857] disabled:bg-[#E5E7EB] disabled:text-[#8B8B95] text-white rounded-[8px] font-medium text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-none flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

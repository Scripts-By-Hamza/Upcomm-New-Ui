import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../common/Avatar';
import {
  X,
  Search,
  FileText,
  Mail,
  Shield,
  Briefcase,
  Users,
  Download,
  Calendar,
  Lock,
} from 'lucide-react';

export function ConversationDetailsDrawer({
  conversation,
  participants = [],
  messages = [],
  onClose,
  onSearchInChat,
}) {
  const { currentUser, users = [] } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'files'

  const isGroup = conversation?.type === 'group';
  const otherUser = !isGroup
    ? participants.find((p) => String(p.id) !== String(currentUser?.id))
    : null;

  // Extract shared files from messages (mock or real attachments)
  const sharedFiles = messages
    .filter((m) => !m.deleted_at && m.attachments && Array.isArray(m.attachments) && m.attachments.length > 0)
    .flatMap((m) => m.attachments);

  const filteredParticipants = participants.filter((p) => {
    if (!searchQuery.trim()) return true;
    return (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-80 lg:w-[320px] flex-shrink-0 border-l border-[#E5E7EB] dark:border-[#2A2E34] bg-white dark:bg-[#17191C] flex flex-col h-full z-20 animate-fade-in select-none">
      {/* Header */}
      <div className="h-16 px-4 border-b border-[#E5E7EB] dark:border-[#2A2E34] flex items-center justify-between">
        <h3 className="text-[14.5px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
          Conversation Details
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] rounded-[7px] transition-colors cursor-pointer"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Profile Card / Header */}
        {!isGroup ? (
          <div className="flex flex-col items-center text-center pb-4 border-b border-[#E5E7EB] dark:border-[#2A2E34]">
            <Avatar
              src={otherUser?.avatar_url}
              name={otherUser?.full_name || 'User'}
              size="lg"
              className="w-16 h-16 text-lg mb-2.5 ring-2 ring-emerald-500/20"
            />
            <h4 className="text-[15px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
              {otherUser?.full_name || 'Direct Contact'}
            </h4>
            <p className="text-[12px] text-[#71717A] dark:text-[#8E949E] mt-0.5">
              {otherUser?.designation || 'Team Member'}
            </p>
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-[#F4F4F5] dark:bg-[#22262B] text-[11px] text-[#52525B] dark:text-[#C4C7CE]">
              <Lock className="w-3 h-3 text-[#059669]" />
              <span>Private 1-on-1 Chat</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center pb-4 border-b border-[#E5E7EB] dark:border-[#2A2E34]">
            <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] dark:bg-[#064E3B]/30 border border-[#A7F3D0] dark:border-[#059669]/30 flex items-center justify-center text-[#059669] mb-2.5">
              <Users className="w-7 h-7" />
            </div>
            <h4 className="text-[15px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
              {conversation.name || 'Private Group'}
            </h4>
            <p className="text-[12px] text-[#71717A] dark:text-[#8E949E] mt-0.5">
              {participants.length} participants
            </p>
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-[#F4F4F5] dark:bg-[#22262B] text-[11px] text-[#52525B] dark:text-[#C4C7CE]">
              <Lock className="w-3 h-3 text-[#059669]" />
              <span>Private Group Conversation</span>
            </div>
          </div>
        )}

        {/* User Info Details for Direct Chat */}
        {!isGroup && otherUser && (
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B8B95]">
              Contact Information
            </span>
            <div className="space-y-2 text-[12.5px]">
              <div className="flex items-center gap-2.5 text-[#52525B] dark:text-[#C4C7CE]">
                <Mail className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                <span className="truncate">{otherUser.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#52525B] dark:text-[#C4C7CE]">
                <Briefcase className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                <span className="truncate">{otherUser.designation || 'Specialist'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#52525B] dark:text-[#C4C7CE]">
                <Shield className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                <span className="capitalize">{otherUser.role?.replace('_', ' ') || 'Member'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Group Participants List */}
        {isGroup && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B8B95]">
                Participants ({participants.length})
              </span>
            </div>

            <div className="divide-y divide-[#F4F4F5] dark:divide-[#22262B] max-h-56 overflow-y-auto -mx-1 px-1">
              {filteredParticipants.map((member) => (
                <div key={member.id} className="py-2 flex items-center gap-2.5">
                  <Avatar
                    src={member.avatar_url}
                    name={member.full_name || 'User'}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">
                      {member.full_name} {String(member.id) === String(currentUser?.id) ? '(You)' : ''}
                    </p>
                    <p className="text-[11px] text-[#71717A] dark:text-[#8E949E] truncate">
                      {member.designation || member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Files & Attachments */}
        <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#2A2E34] space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B8B95]">
            Shared Files
          </span>

          {sharedFiles.length === 0 ? (
            <div className="py-4 text-center text-[#8B8B95] text-[12px] bg-[#F9FAFB] dark:bg-[#1D2024] rounded-[8px] border border-dashed border-[#E5E7EB] dark:border-[#2A2E34]">
              <FileText className="w-5 h-5 mx-auto mb-1 text-[#A1A1AA]" />
              <span>No shared files yet</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sharedFiles.map((file, idx) => (
                <a
                  key={file.id || idx}
                  href={file.url}
                  download={file.name || 'file'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-[8px] bg-[#F9FAFB] dark:bg-[#1D2024] hover:bg-[#EAEAEA] dark:hover:bg-[#22262B] border border-[#E5E7EB] dark:border-[#2A2E34] text-[12px] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-[#059669] shrink-0" />
                    <span className="truncate font-medium text-[#18181B] dark:text-[#F4F4F5]">
                      {file.name || 'Document.pdf'}
                    </span>
                  </div>
                  <div className="p-1 text-[#71717A] group-hover:text-[#18181B] dark:group-hover:text-[#F4F4F5] rounded transition-colors shrink-0">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConversationDetailsDrawer;

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import {
  canStartDirectMessage,
  canCreateGroup,
  canBroadcast,
  getEligibleMessageRecipients,
} from '../../utils/messages/messagePermissions';
import { Avatar } from '../common/Avatar';
import {
  X,
  Search,
  MessageSquare,
  Users,
  Radio,
  Check,
  Send,
  Plus,
  Info,
  Building,
} from 'lucide-react';

export function NewMessageDialog({
  isOpen,
  onClose,
  onSelectConversation,
}) {
  const { currentUser, users = [] } = useAuth();
  const {
    departments = [],
    conversations = [],
    conversationParticipants = [],
    getOrCreateDirectConversation,
    sendDirectMessage,
    createGroupConversation,
    sendBroadcastMessage,
  } = useAppData();

  const userCanDirect = canStartDirectMessage(currentUser);
  const userCanGroup = canCreateGroup(currentUser);
  const userCanBroadcast = canBroadcast(currentUser);

  // Tab state: 'direct' | 'group' | 'broadcast'
  const [activeTab, setActiveTab] = useState('direct');
  const [searchQuery, setSearchQuery] = useState('');

  // Group Form state
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState([]);
  const [groupInitialMessage, setGroupInitialMessage] = useState('');

  // Broadcast Form state
  const [selectedBroadcastRecipientIds, setSelectedBroadcastRecipientIds] = useState([]);
  const [broadcastBody, setBroadcastBody] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Eligible recipients filtered for currentUser
  const eligibleRecipients = useMemo(() => {
    return getEligibleMessageRecipients(currentUser, users);
  }, [currentUser, users]);

  // Search filtered recipients
  const filteredRecipients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return eligibleRecipients;

    return eligibleRecipients.filter((u) => {
      const name = (u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const designation = (u.designation || '').toLowerCase();
      const dept = (departments.find((d) => d.id === u.department_id)?.name || '').toLowerCase();
      return name.includes(q) || email.includes(q) || designation.includes(q) || dept.includes(q);
    });
  }, [eligibleRecipients, searchQuery, departments]);

  if (!isOpen) return null;

  const resetAll = () => {
    setSearchQuery('');
    setGroupName('');
    setSelectedGroupMemberIds([]);
    setGroupInitialMessage('');
    setSelectedBroadcastRecipientIds([]);
    setBroadcastBody('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // Direct message selection: find existing direct conversation or start one
  const handleSelectDirectUser = async (targetUser) => {
    if (isSubmitting || !targetUser?.id) return;
    setIsSubmitting(true);

    try {
      // Find existing or create empty direct container
      const conv = await getOrCreateDirectConversation({
        recipientId: targetUser.id,
      });

      if (conv && conv.id) {
        onSelectConversation(conv.id);
      }
      handleClose();
    } catch (err) {
      console.error('Error opening direct message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group conversation creation
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (isSubmitting || !groupName.trim() || selectedGroupMemberIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const newGroup = await createGroupConversation({
        name: groupName.trim(),
        participantIds: selectedGroupMemberIds,
        initialMessage: groupInitialMessage.trim(),
      });

      if (newGroup && newGroup.id) {
        onSelectConversation(newGroup.id);
      }
      handleClose();
    } catch (err) {
      console.error('Error creating group:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Broadcast submission
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (isSubmitting || !broadcastBody.trim() || selectedBroadcastRecipientIds.length === 0) return;

    setIsSubmitting(true);
    try {
      await sendBroadcastMessage({
        recipientIds: selectedBroadcastRecipientIds,
        body: broadcastBody.trim(),
      });

      handleClose();
    } catch (err) {
      console.error('Error sending broadcast:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGroupMember = (uid) => {
    const sId = String(uid);
    setSelectedGroupMemberIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  const toggleBroadcastRecipient = (uid) => {
    const sId = String(uid);
    setSelectedBroadcastRecipientIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  const handleSelectAllBroadcast = () => {
    if (selectedBroadcastRecipientIds.length === eligibleRecipients.length) {
      setSelectedBroadcastRecipientIds([]);
    } else {
      setSelectedBroadcastRecipientIds(eligibleRecipients.map((u) => String(u.id)));
    }
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : 'General';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Tabs */}
        <div className="border-b border-[#E5E7EB] bg-[#FAFBFB] px-5 pt-4 pb-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[16px] text-[#18181B]">New Message</h3>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-md text-[#71717A] hover:text-[#18181B] hover:bg-[#E5E7EB]/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 -mb-px">
            {userCanDirect && (
              <button
                type="button"
                onClick={() => setActiveTab('direct')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'direct'
                    ? 'border-[#059669] text-[#059669]'
                    : 'border-transparent text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Direct Message</span>
              </button>
            )}

            {userCanGroup && (
              <button
                type="button"
                onClick={() => setActiveTab('group')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'group'
                    ? 'border-[#059669] text-[#059669]'
                    : 'border-transparent text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Group Chat</span>
              </button>
            )}

            {userCanBroadcast && (
              <button
                type="button"
                onClick={() => setActiveTab('broadcast')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'broadcast'
                    ? 'border-[#059669] text-[#059669]'
                    : 'border-transparent text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Broadcast</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Direct Message */}
        {activeTab === 'direct' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-3 border-b border-[#E5E7EB]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search colleagues by name, email, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] text-[#18181B]"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#F4F4F5]">
              {filteredRecipients.length === 0 ? (
                <div className="p-8 text-center text-[#8B8B95] text-[13px]">
                  No colleagues match your search or permissions scope.
                </div>
              ) : (
                filteredRecipients.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectDirectUser(user)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F4F4F5] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={user.avatar_url}
                        name={user.full_name || 'User'}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-semibold text-[#18181B] truncate group-hover:text-[#059669] transition-colors">
                            {user.full_name}
                          </span>
                          {user.role === 'admin' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-700 rounded border border-purple-200">
                              Admin
                            </span>
                          )}
                          {user.role === 'hod' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded border border-blue-200">
                              HOD
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-[#71717A] truncate">
                          {user.designation || getDepartmentName(user.department_id)} • {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 text-[12px] font-medium bg-[#059669]/10 text-[#059669] rounded-md group-hover:bg-[#059669] group-hover:text-white transition-colors"
                    >
                      Chat
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Group Chat */}
        {activeTab === 'group' && (
          <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 min-h-0">
            <div className="p-4 border-b border-[#E5E7EB] space-y-3">
              <div>
                <label className="block text-[12.5px] font-medium text-[#18181B] mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Design Sprint Team, Marketing Launch"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-1.5 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] text-[#18181B]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#18181B] mb-1">
                  Select Participants ({selectedGroupMemberIds.length} selected)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search participants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1 text-[12.5px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] text-[#18181B]"
                  />
                </div>
              </div>
            </div>

            {/* Participants Checklist */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#F4F4F5] max-h-48">
              {filteredRecipients.map((user) => {
                const isSelected = selectedGroupMemberIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleGroupMember(user.id)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        src={user.avatar_url}
                        name={user.full_name || 'User'}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#18181B] truncate">
                          {user.full_name}
                        </p>
                        <p className="text-[11px] text-[#71717A] truncate">
                          {getDepartmentName(user.department_id)}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#059669] border-[#059669] text-white'
                          : 'border-[#D4D4D8] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional First Message */}
            <div className="p-3 border-t border-[#E5E7EB] bg-[#FAFBFB]">
              <label className="block text-[12px] font-medium text-[#52525B] mb-1">
                Initial Group Message (optional)
              </label>
              <input
                type="text"
                placeholder="Send a welcome message..."
                value={groupInitialMessage}
                onChange={(e) => setGroupInitialMessage(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] text-[#18181B] bg-white"
              />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2 bg-white">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-1.5 text-[13px] font-medium text-[#52525B] hover:bg-[#F4F4F5] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !groupName.trim() || selectedGroupMemberIds.length === 0}
                className="px-4 py-1.5 text-[13px] font-medium bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Create Group</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Broadcast */}
        {activeTab === 'broadcast' && (
          <form onSubmit={handleSendBroadcast} className="flex flex-col flex-1 min-h-0">
            <div className="p-3 bg-amber-50/70 border-b border-amber-100 flex items-start gap-2 text-[12px] text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Broadcast creates separate 1-to-1 direct messages to each recipient. Recipients will never see each other, and all replies will come directly to your private thread.
              </span>
            </div>

            <div className="p-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="relative flex-1 mr-3">
                <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter recipients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1 text-[12.5px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] text-[#18181B]"
                />
              </div>
              <button
                type="button"
                onClick={handleSelectAllBroadcast}
                className="px-2.5 py-1 text-[12px] font-medium text-[#059669] hover:bg-[#ECFDF5] rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                {selectedBroadcastRecipientIds.length === eligibleRecipients.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            {/* Recipients list */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#F4F4F5] max-h-44">
              {filteredRecipients.map((user) => {
                const isSelected = selectedBroadcastRecipientIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleBroadcastRecipient(user.id)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        src={user.avatar_url}
                        name={user.full_name || 'User'}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#18181B] truncate">
                          {user.full_name}
                        </p>
                        <p className="text-[11px] text-[#71717A] truncate">
                          {getDepartmentName(user.department_id)}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#059669] border-[#059669] text-white'
                          : 'border-[#D4D4D8] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Broadcast Message Composer */}
            <div className="p-3 border-t border-[#E5E7EB] bg-[#FAFBFB]">
              <label className="block text-[12.5px] font-medium text-[#18181B] mb-1">
                Broadcast Announcement Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="Type the message to broadcast to selected colleagues..."
                rows={3}
                className="w-full px-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] text-[#18181B] bg-white"
                required
              />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#E5E7EB] flex items-center justify-between bg-white">
              <span className="text-[12px] text-[#71717A]">
                {selectedBroadcastRecipientIds.length} recipient{selectedBroadcastRecipientIds.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3.5 py-1.5 text-[13px] font-medium text-[#52525B] hover:bg-[#F4F4F5] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !broadcastBody.trim() ||
                    selectedBroadcastRecipientIds.length === 0
                  }
                  className="px-4 py-1.5 text-[13px] font-medium bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default NewMessageDialog;

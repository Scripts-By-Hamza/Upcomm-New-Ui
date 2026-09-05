import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { groupMessagesByDate } from '../../utils/messages/messageSelectors';
import { MessageBubble } from './MessageBubble';
import { ReportMessageDialog } from './ReportMessageDialog';
import { MessageSquare } from 'lucide-react';

export function MessageThread({
  conversation,
  messages = [],
  participants = [],
  onReply,
}) {
  const { currentUser, users = [] } = useAuth();
  const messagesEndRef = useRef(null);

  const [reportingMessage, setReportingMessage] = useState(null);

  const isGroup = conversation?.type === 'group';

  // Group messages chronologically by date
  const groupedDates = groupMessagesByDate(messages);

  // Auto-scroll to bottom on messages change
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, conversation?.id]);

  const handleOpenReport = (msg) => {
    setReportingMessage(msg);
  };

  const handleCloseReport = () => {
    setReportingMessage(null);
  };

  const reportedUser = reportingMessage
    ? users.find((u) => String(u.id) === String(reportingMessage.sender_id))
    : null;

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17191C] flex flex-col justify-between min-h-0 relative select-none">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8B8B95]">
          <div className="w-14 h-14 rounded-2xl bg-[#F4F4F5] dark:bg-[#1D2024] flex items-center justify-center text-[#71717A] dark:text-[#8E949E] mb-3">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h4 className="text-[15px] font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-1">
            No messages yet
          </h4>
          <p className="text-[13px] max-w-sm text-[#71717A] dark:text-[#8E949E]">
            Say hello to start the conversation! You can also use @ to mention participants.
          </p>
        </div>
      ) : (
        <div className="py-4 space-y-4">
          {Object.entries(groupedDates).map(([dateLabel, dateMsgs]) => (
            <div key={dateLabel} className="space-y-1">
              {/* Minimal Centered Date Separator with Horizontal Rule */}
              <div className="relative flex items-center justify-center my-5 px-6 select-none">
                <div className="absolute inset-0 flex items-center px-6">
                  <div className="w-full border-t border-[#E5E7EB] dark:border-[#2A2E34]" />
                </div>
                <div className="relative px-3 bg-white dark:bg-[#17191C] text-[11.5px] font-medium text-[#71717A] dark:text-[#8E949E]">
                  {dateLabel}
                </div>
              </div>

              {/* Message Bubbles with Smart Sender Grouping */}
              {dateMsgs.map((msg, index) => {
                const prevMsg = index > 0 ? dateMsgs[index - 1] : null;
                const nextMsg = index < dateMsgs.length - 1 ? dateMsgs[index + 1] : null;

                const isSameSenderAsPrev =
                  prevMsg &&
                  String(prevMsg.sender_id) === String(msg.sender_id) &&
                  new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() <
                    5 * 60 * 1000;

                const isSameSenderAsNext =
                  nextMsg &&
                  String(nextMsg.sender_id) === String(msg.sender_id) &&
                  new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() <
                    5 * 60 * 1000;

                const isFirstInGroup = !isSameSenderAsPrev;
                const isLastInGroup = !isSameSenderAsNext;

                const sender = users.find((u) => String(u.id) === String(msg.sender_id));
                const parentId = msg.reply_to_message_id || msg.reply_to_id;
                const parentMsg = parentId
                  ? messages.find((m) => String(m.id) === String(parentId))
                  : null;
                const parentSender = parentMsg
                  ? users.find((u) => String(u.id) === String(parentMsg.sender_id))
                  : null;

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    conversation={conversation}
                    senderUser={sender}
                    parentMessage={parentMsg}
                    parentSenderUser={parentSender}
                    onReply={onReply}
                    onReport={handleOpenReport}
                    isGroup={isGroup}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                  />
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      )}

      {/* Report Modal */}
      {reportingMessage && (
        <ReportMessageDialog
          isOpen={Boolean(reportingMessage)}
          onClose={handleCloseReport}
          message={reportingMessage}
          conversation={conversation}
          reportedUser={reportedUser}
        />
      )}
    </div>
  );
}

export default MessageThread;

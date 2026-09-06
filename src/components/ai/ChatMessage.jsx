import React, { useState } from 'react';
import { Sparkles, User, Copy, Check, AlertCircle } from 'lucide-react';
import { ActionConfirmationCard } from './blocks/ActionConfirmationCard';
import { ActionResultCard } from './blocks/ActionResultCard';
import { ReportCard } from './blocks/ReportCard';
import { TaskListBlock } from './blocks/TaskListBlock';
import { formatDateTime } from '../../utils/dateUtils';

export function ChatMessage({
  message,
  currentUser,
  onConfirmAction,
  onCancelAction,
  isExecutingAction,
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const metadata = message.metadata || {};
  const blocks = metadata.blocks || [];

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`flex items-start gap-2 sm:gap-3.5 py-2.5 sm:py-4 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      } font-['Inter'] group`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser
            ? 'bg-[#18181B] dark:bg-zinc-700 text-white font-bold text-[11px] sm:text-[12px]'
            : 'bg-gradient-to-tr from-[#059669] to-[#10B981] text-white shadow-xs'
        }`}
      >
        {isUser ? (
          currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt="User"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>{currentUser?.full_name?.charAt(0) || 'U'}</span>
          )
        ) : (
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        )}
      </div>

      {/* Message Content Container */}
      <div
        className={`flex flex-col max-w-[92%] sm:max-w-[80%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >

        {/* Name & Timestamp Header */}
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-[12px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
            {isUser ? currentUser?.full_name || 'Admin' : 'UPCOMM AI'}
          </span>
          <span className="text-[11px] text-[#8B8B95]">
            {message.created_at ? formatDateTime(message.created_at) : 'Just now'}
          </span>
          {!isUser && message.content && (
            <button
              type="button"
              onClick={handleCopy}
              title="Copy message"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-[#8B8B95] hover:text-[#18181B] dark:hover:text-[#F4F4F5] cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Message Bubble or Blocks */}
        {isUser ? (
          <div className="px-4 py-2.5 rounded-[14px] rounded-tr-none bg-[#059669] text-white text-[13.5px] leading-relaxed shadow-xs whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          <div className="w-full space-y-2">
            {/* Direct Text Answer */}
            {message.content && blocks.length === 0 && (
              <div className="px-4 py-3 rounded-[14px] rounded-tl-none bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-[#F4F4F5] text-[13.5px] leading-relaxed shadow-xs whitespace-pre-wrap">
                {message.content}
              </div>
            )}

            {/* Structured Blocks Render */}
            {blocks.map((block, idx) => {
              switch (block.type) {
                case 'ACTION_CONFIRMATION':
                  return (
                    <ActionConfirmationCard
                      key={idx}
                      pendingActionId={block.data.pending_action_id}
                      actionType={block.data.action_type}
                      cardData={block.data.card}
                      expiresAt={block.data.expires_at}
                      onConfirm={onConfirmAction}
                      onCancel={onCancelAction}
                      isExecuting={isExecutingAction}
                    />
                  );
                case 'ACTION_RESULT':
                  return <ActionResultCard key={idx} result={block.data} />;
                case 'REPORT':
                  return <ReportCard key={idx} data={block.data} />;
                case 'TASK_LIST':
                  return <TaskListBlock key={idx} data={block.data} />;
                case 'CLARIFICATION':
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-[12px] bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-[#18181B] dark:text-[#F4F4F5] text-[13px] leading-relaxed flex items-start gap-2.5 shadow-xs"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="whitespace-pre-wrap">{block.data.text}</div>
                    </div>
                  );
                case 'TEXT':
                default:
                  return (
                    <div
                      key={idx}
                      className="px-4 py-3 rounded-[12px] bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] text-[#18181B] dark:text-[#F4F4F5] text-[13.5px] leading-relaxed shadow-xs whitespace-pre-wrap"
                    >
                      {block.data.text}
                    </div>
                  );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}

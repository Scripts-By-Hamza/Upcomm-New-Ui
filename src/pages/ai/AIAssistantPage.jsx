import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import {
  Sparkles,
  Send,
  Plus,
  History,
  AlertCircle,
  BarChart3,
  ListTodo,
  Clock,
  Mic,
  MicOff,
} from 'lucide-react';
import { ChatMessage } from '../../components/ai/ChatMessage';
import { ConversationHistoryDrawer } from '../../components/ai/ConversationHistoryDrawer';
import { useWebSpeechRecognition } from '../../hooks/useWebSpeechRecognition';
import {
  sendAiMessage,
  confirmAiPendingAction,
  cancelAiPendingAction,
  fetchUserAiConversations,
  fetchConversationMessages,
  archiveAiConversation,
} from '../../lib/ai/aiClient';

const SUGGESTED_PROMPTS = [
  {
    icon: Plus,
    label: 'Create a task',
    prompt: 'Create a task called "Website Mobile QA" assigned to Muhammad Hamza, Support Admin as assistant, High priority, Status In Progress, start today, due in 5 days.',
  },
  {
    icon: BarChart3,
    label: 'Department report',
    prompt: 'Give me the Website Development department report for this month.',
  },
  {
    icon: AlertCircle,
    label: 'Show overdue tasks',
    prompt: 'Show all overdue tasks across the company.',
  },
  {
    icon: Clock,
    label: 'Due this week',
    prompt: 'Which tasks are due in the next 3 days?',
  },
  {
    icon: ListTodo,
    label: 'Team workload',
    prompt: 'Show me the team workload breakdown and active tasks.',
  },
];

export function AIAssistantPage() {
  const { currentUser } = useAuth();
  const { refreshAllData } = useAppData();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState('en-US');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Web Speech API Voice Recognition Hook
  const {
    isSupported: isSpeechSupported,
    isListening: isSpeechListening,
    isRequestingPermission: isSpeechRequestingPermission,
    interimTranscript: speechInterim,
    elapsedSeconds: speechElapsed,
    errorMessage: speechError,
    startListening: startVoiceInput,
    stopListening: stopVoiceInput,
    cancelListening: cancelVoiceInput,
    appendSpeechTranscript,
  } = useWebSpeechRecognition({
    language: speechLanguage,
    onTranscriptFinalized: (finalText) => {
      setInputPrompt((prev) => appendSpeechTranscript(prev, finalText));
      setTimeout(() => textareaRef.current?.focus(), 50);
    },
    onError: (err) => {
      setErrorMessage(err);
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 1. Load User AI Conversations
  const loadConversations = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const convList = await fetchUserAiConversations(currentUser.id);
      setConversations(convList);
    } catch (e) {
      console.warn('Could not load conversations:', e);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 2. Load Active Conversation Messages
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        const msgList = await fetchConversationMessages(activeConversationId);
        setMessages(msgList);
        setTimeout(scrollToBottom, 100);
      } catch (e) {
        console.warn('Could not load messages:', e);
      }
    }

    loadMessages();
  }, [activeConversationId, scrollToBottom]);

  // 3. Handle Send Message
  const handleSendMessage = async (textToSend) => {
    if (isSpeechListening) {
      stopVoiceInput();
    }
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    setInputPrompt('');
    setErrorMessage('');
    setIsLoading(true);

    // Optimistic user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const response = await sendAiMessage({
        conversationId: activeConversationId,
        message: text,
        currentUser,
      });

      if (response.conversationId && response.conversationId !== activeConversationId) {
        setActiveConversationId(response.conversationId);
        await loadConversations();
      }

      // Add assistant response to messages
      const assistantMsg = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: response.assistant?.content || '',
        metadata: {
          blocks: response.blocks || [],
          pendingAction: response.pendingAction || null,
        },
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setErrorMessage(err.message || 'AI Assistant request failed. Please try again.');
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  // 4. Handle Action Confirmation
  const handleConfirmAction = async (pendingActionId) => {
    setIsExecutingAction(true);
    setErrorMessage('');
    try {
      const execResult = await confirmAiPendingAction({
        pendingActionId,
        currentUser,
      });

      // Refresh global app data (tasks, activity)
      if (refreshAllData) {
        await refreshAllData();
      }

      // Add action result card to messages
      const resultMsg = {
        id: `result-${Date.now()}`,
        role: 'assistant',
        content: null,
        metadata: {
          blocks: [
            {
              type: 'ACTION_RESULT',
              data: execResult.result || {},
            },
          ],
        },
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, resultMsg]);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setErrorMessage(err.message || 'Action execution failed.');
      throw err;
    } finally {
      setIsExecutingAction(false);
    }
  };

  // 5. Handle Action Cancellation
  const handleCancelAction = async (pendingActionId) => {
    try {
      await cancelAiPendingAction({
        pendingActionId,
        currentUser,
      });

      const cancelMsg = {
        id: `cancel-${Date.now()}`,
        role: 'assistant',
        content: 'Action cancelled. Let me know if you need anything else.',
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, cancelMsg]);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setErrorMessage(err.message || 'Cancellation failed.');
    }
  };

  // 6. Handle New Chat
  const handleNewChat = () => {
    cancelVoiceInput();
    setActiveConversationId(null);
    setMessages([]);
    setErrorMessage('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // 7. Handle Archive Chat
  const handleArchiveChat = async (convId) => {
    cancelVoiceInput();
    await archiveAiConversation(convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversationId === convId) {
      handleNewChat();
    }
  };

  // 8. Handle Textarea Keydown (Enter to send, Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-[#18181B] sm:rounded-[14px] sm:border sm:border-[#E5E7EB] dark:sm:border-[#27272A] sm:shadow-xs overflow-hidden font-['Inter'] relative min-h-0">
      {/* Slide-over Conversation History Drawer */}
      <ConversationHistoryDrawer
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          cancelVoiceInput();
          setActiveConversationId(id);
        }}
        onNewChat={handleNewChat}
        onArchiveConversation={handleArchiveChat}
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
      />

      {/* Main Responsive Header */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3.5 border-b border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#18181B] shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-[7px] sm:rounded-[10px] bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-[13.5px] sm:text-[16px] font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">
                AI Assistant
              </h1>
              <span className="inline-flex items-center text-[9.5px] sm:text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 sm:py-0.5 rounded-full shrink-0">
                Admin
              </span>
            </div>
            <p className="hidden sm:block text-[12px] text-[#71717A] dark:text-[#8B8B95] truncate">
              Manage work and analyze UPCOMM using natural language.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* History Button */}
          <button
            type="button"
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-[7px] text-[11.5px] sm:text-[12.5px] font-semibold bg-[#F4F4F5] dark:bg-[#202024] hover:bg-[#E5E7EB] dark:hover:bg-[#2E2E33] text-[#52525B] dark:text-[#D4D4D8] transition-colors cursor-pointer"
            title="Open Chat History"
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#71717A]" />
            <span className="hidden sm:inline">History</span>
            {conversations.length > 0 && (
              <span className="text-[9.5px] sm:text-[11px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-1.5 py-0.2 rounded-full font-bold">
                {conversations.length}
              </span>
            )}
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-[7px] text-[11.5px] sm:text-[12.5px] font-semibold bg-[#059669] hover:bg-[#047857] text-white transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Responsive Message Stream Workspace */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 lg:p-8 space-y-2.5 sm:space-y-4">
        {messages.length === 0 ? (
          /* Empty State - Mobile Optimized */
          <div className="min-h-full flex flex-col items-center justify-start sm:justify-center max-w-2xl mx-auto text-center py-3 sm:py-8 px-1 sm:px-4 select-none animate-fade-in">
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-[12px] sm:rounded-2xl bg-gradient-to-tr from-[#ECFDF5] to-[#D1FAE5] dark:from-emerald-950/50 dark:to-emerald-900/30 text-[#059669] flex items-center justify-center mb-2.5 sm:mb-4 shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-[16px] sm:text-[22px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
              How can I help you today?
            </h2>
            <p className="text-[12px] sm:text-[14px] text-[#71717A] dark:text-[#8B8B95] mt-1 max-w-md px-2">
              Ask me to create tasks, check department productivity, review team workload, or locate overdue items.
            </p>

            {/* Suggestion Chips Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-7 text-left">
              {SUGGESTED_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-2.5 sm:p-3.5 rounded-[9px] sm:rounded-[12px] bg-[#F7F8FA] dark:bg-[#202024] hover:bg-[#ECFDF5] dark:hover:bg-emerald-950/30 border border-[#E5E7EB] dark:border-[#27272A] hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-left cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[#059669] mb-0.5 sm:mb-1">
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="text-[11.5px] sm:text-[13px] font-bold text-[#18181B] dark:text-[#F4F4F5] group-hover:text-[#059669] truncate">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-[12px] text-[#71717A] dark:text-[#8B8B95] line-clamp-1 sm:line-clamp-2">
                      {item.prompt}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="max-w-4xl mx-auto space-y-2.5 sm:space-y-3">
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id || index}
                message={msg}
                currentUser={currentUser}
                onConfirmAction={handleConfirmAction}
                onCancelAction={handleCancelAction}
                isExecutingAction={isExecutingAction}
              />
            ))}

            {/* Thinking / Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5 sm:gap-3 py-2 sm:py-3 font-['Inter']">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#059669] to-[#10B981] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                </div>
                <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-[12px] sm:rounded-[14px] bg-[#F7F8FA] dark:bg-[#202024] border border-[#E5E7EB] dark:border-[#27272A] flex items-center gap-2 text-[12.5px] sm:text-[13px] text-[#71717A]">
                  <div className="w-2 h-2 rounded-full bg-[#059669] animate-ping" />
                  <span>Analyzing UPCOMM workspace...</span>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 sm:p-3.5 rounded-[10px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-[12px] sm:text-[12.5px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Responsive Bottom Composer Surface */}
      <div className="p-2 sm:p-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-white dark:bg-[#18181B] border-t border-[#E5E7EB] dark:border-[#27272A] shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* Live Voice Input Status Banner */}
          {isSpeechListening && (
            <div
              className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-[8px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-[12px] text-red-700 dark:text-red-400 animate-fade-in font-['Inter']"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="font-semibold shrink-0">Listening...</span>
                <span className="text-[11px] font-mono bg-red-100 dark:bg-red-900/60 px-1.5 py-0.2 rounded shrink-0">
                  {String(Math.floor(speechElapsed / 60)).padStart(2, '0')}:
                  {String(speechElapsed % 60).padStart(2, '0')}
                </span>
                {speechInterim && (
                  <span className="text-[11.5px] italic text-[#52525B] dark:text-[#D4D4D8] truncate">
                    "{speechInterim}"
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={cancelVoiceInput}
                  aria-label="Cancel voice input"
                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={stopVoiceInput}
                  aria-label="Stop voice input and finalize text"
                  className="px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          <div className="relative flex items-end rounded-[10px] sm:rounded-[12px] bg-[#F7F8FA] dark:bg-[#202024] border border-[#E5E7EB] dark:border-[#27272A] focus-within:border-[#059669] focus-within:ring-1 focus-within:ring-[#059669] transition-all p-1.5 sm:p-2">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={isSpeechListening ? 'Listening to voice...' : 'Ask UPCOMM AI anything...'}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 max-h-32 bg-transparent resize-none border-none outline-none px-2.5 sm:px-3 py-1 text-[13px] sm:text-[13.5px] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#8B8B95] disabled:opacity-50"
              style={{ minHeight: '34px' }}
            />

            <div className="flex items-center gap-1 shrink-0">
              {/* Voice Microphone Button */}
              {isSpeechSupported ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeechListening) {
                      stopVoiceInput();
                    } else {
                      startVoiceInput(speechLanguage);
                    }
                  }}
                  disabled={isLoading || isSpeechRequestingPermission}
                  aria-label={isSpeechListening ? 'Stop voice input' : 'Start voice input'}
                  title={isSpeechListening ? 'Stop listening' : 'Speak your message'}
                  className={`p-1.5 sm:p-2 rounded-[7px] sm:rounded-[8px] transition-all cursor-pointer shrink-0 ${
                    isSpeechListening
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs animate-pulse'
                      : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[#71717A] dark:text-[#A1A1AA]'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isSpeechListening ? (
                    <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-label="Voice input not supported"
                  title="Voice input is not supported in this browser"
                  className="p-1.5 sm:p-2 rounded-[7px] sm:rounded-[8px] opacity-30 cursor-not-allowed text-[#71717A] shrink-0"
                >
                  <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}

              {/* Send Message Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputPrompt.trim() || isLoading || isSpeechListening}
                className="p-1.5 sm:p-2 rounded-[7px] sm:rounded-[8px] bg-[#059669] hover:bg-[#047857] text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
                title={isSpeechListening ? 'Stop speaking before sending' : 'Send message'}
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          <div className="hidden sm:flex items-center justify-between text-[11px] text-[#8B8B95] px-2 pt-1.5">
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px]">Shift+Enter</kbd> for new line
            </span>
            <div className="flex items-center gap-2">
              {isSpeechSupported && (
                <select
                  value={speechLanguage}
                  onChange={(e) => setSpeechLanguage(e.target.value)}
                  className="bg-transparent text-[11px] text-[#71717A] dark:text-[#A1A1AA] border-none outline-none cursor-pointer hover:text-[#059669] transition-colors"
                  title="Speech Recognition Language"
                  aria-label="Speech Recognition Language"
                >
                  <option value="en-US">EN (English)</option>
                  <option value="ur-PK">UR (Urdu)</option>
                </select>
              )}
              <span>•</span>
              <span>UPCOMM AI • Admin Workspace Agent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

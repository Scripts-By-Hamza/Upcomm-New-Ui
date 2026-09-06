import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useWebSpeechRecognition } from '../../hooks/useWebSpeechRecognition';

/**
 * AIComposerVoiceInput Component
 *
 * Encapsulates browser Web Speech API voice recognition for UPCOMM AI Assistant.
 * Self-contained so it only initializes speech objects when mounted (when FEATURES.AI_VOICE_INPUT === true).
 * 
 * Preserved for future re-enabling or provider integration (e.g. Fish Audio / Speech-to-Text).
 */
export function AIComposerVoiceInput({
  onAppendTranscript,
  onError,
  isLoading = false,
  onListeningChange,
}) {
  const [speechLanguage, setSpeechLanguage] = useState('en-US');

  const {
    isSupported,
    isListening,
    isRequestingPermission,
    interimTranscript,
    elapsedSeconds,
    errorMessage: speechError,
    startListening,
    stopListening,
    cancelListening,
  } = useWebSpeechRecognition({
    language: speechLanguage,
    onTranscriptFinalized: (finalText) => {
      if (onAppendTranscript) {
        onAppendTranscript(finalText);
      }
    },
    onError: (err) => {
      if (onError) onError(err);
    },
  });

  // Notify parent of listening status changes if callback provided
  useEffect(() => {
    if (onListeningChange) {
      onListeningChange(isListening);
    }
  }, [isListening, onListeningChange]);

  // Clean up and notify parent on unmount
  useEffect(() => {
    return () => {
      if (onListeningChange) {
        onListeningChange(false);
      }
    };
  }, [onListeningChange]);

  return (
    <>
      {/* Live Voice Input Status Banner (Rendered when listening) */}
      {isListening && (
        <div
          className="absolute -top-11 left-0 right-0 flex items-center justify-between px-3 py-1.5 rounded-[8px] bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-[12px] text-red-700 dark:text-red-400 animate-fade-in font-['Inter'] shadow-sm z-10"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="font-semibold shrink-0">Listening...</span>
            <span className="text-[11px] font-mono bg-red-100 dark:bg-red-900/60 px-1.5 py-0.2 rounded shrink-0">
              {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
              {String(elapsedSeconds % 60).padStart(2, '0')}
            </span>
            {interimTranscript && (
              <span className="text-[11.5px] italic text-[#52525B] dark:text-[#D4D4D8] truncate">
                "{interimTranscript}"
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={cancelListening}
              aria-label="Cancel voice input"
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={stopListening}
              aria-label="Stop voice input and finalize text"
              className="px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Voice Microphone Control Button */}
      {isSupported ? (
        <button
          type="button"
          onClick={() => {
            if (isListening) {
              stopListening();
            } else {
              startListening(speechLanguage);
            }
          }}
          disabled={isLoading || isRequestingPermission}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          title={isListening ? 'Stop listening' : 'Speak your message'}
          className={`p-1.5 sm:p-2 rounded-[7px] sm:rounded-[8px] transition-all cursor-pointer shrink-0 ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs animate-pulse'
              : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[#71717A] dark:text-[#A1A1AA]'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isListening ? (
            <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>
      ) : null}
    </>
  );
}

export default AIComposerVoiceInput;

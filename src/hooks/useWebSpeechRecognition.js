import { useState, useRef, useEffect, useCallback } from 'react';
import {
  getSpeechRecognitionClass,
  isWebSpeechRecognitionSupported,
  normalizeSpeechError,
  appendSpeechTranscript,
} from '../lib/speech/webSpeechRecognition';

const MAX_SESSION_SECONDS = 45;

/**
 * Custom React Hook for managing browser-native Web Speech Recognition
 * Provides lifecycle control, transcript accumulation, timer tracking, and safety cleanups.
 * 
 * @param {Object} options
 * @param {string} [options.language='en-US'] - Default speech recognition locale
 * @param {function} [options.onTranscriptFinalized] - Callback when speech session completes with text
 * @param {function} [options.onError] - Callback when an error occurs
 */
export function useWebSpeechRecognition({
  language = 'en-US',
  onTranscriptFinalized,
  onError,
} = {}) {
  const [isSupported] = useState(() => isWebSpeechRecognitionSupported());
  const [isListening, setIsListening] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const isAbortingRef = useRef(false);
  const accumulatedFinalRef = useRef('');
  const currentLanguageRef = useRef(language);

  // Keep language ref updated
  useEffect(() => {
    currentLanguageRef.current = language;
  }, [language]);

  // Clean up all running timers
  const clearTimers = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  // Stop listening gracefully and finalize transcript
  const stopListening = useCallback(() => {
    clearTimers();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Recognition might already be stopped
      }
    }
  }, [clearTimers]);

  // Cancel listening and discard current voice segment
  const cancelListening = useCallback(() => {
    isAbortingRef.current = true;
    clearTimers();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignored
      }
    }
    setIsListening(false);
    setIsRequestingPermission(false);
    setInterimTranscript('');
    setFinalTranscript('');
    accumulatedFinalRef.current = '';
    setElapsedSeconds(0);
  }, [clearTimers]);

  // Start listening session
  const startListening = useCallback(
    (customLang) => {
      if (!isSupported) {
        const err = 'Voice input is not supported in this browser.';
        setErrorMessage(err);
        if (onError) onError(err);
        return;
      }

      // Duplicate invocation protection
      if (isListening || isRequestingPermission) {
        return;
      }

      const SpeechRecognitionClass = getSpeechRecognitionClass();
      if (!SpeechRecognitionClass) return;

      // Reset state for new session
      clearTimers();
      isAbortingRef.current = false;
      accumulatedFinalRef.current = '';
      setInterimTranscript('');
      setFinalTranscript('');
      setElapsedSeconds(0);
      setErrorMessage(null);
      setIsRequestingPermission(true);

      try {
        const recognition = new SpeechRecognitionClass();
        recognitionRef.current = recognition;

        // Configure speech properties
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = customLang || currentLanguageRef.current || 'en-US';

        recognition.onstart = () => {
          setIsRequestingPermission(false);
          setIsListening(true);
          setElapsedSeconds(0);

          // Start 1-second elapsed counter
          timerIntervalRef.current = setInterval(() => {
            setElapsedSeconds((prev) => {
              const next = prev + 1;
              if (next >= MAX_SESSION_SECONDS) {
                stopListening();
              }
              return next;
            });
          }, 1000);

          // 45-second hard session timeout safeguard
          maxTimeoutRef.current = setTimeout(() => {
            stopListening();
          }, MAX_SESSION_SECONDS * 1000);
        };

        recognition.onresult = (event) => {
          let currentInterim = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcriptChunk = result[0]?.transcript || '';

            if (result.isFinal) {
              const chunkClean = transcriptChunk.trim();
              if (chunkClean) {
                if (accumulatedFinalRef.current) {
                  accumulatedFinalRef.current += ` ${chunkClean}`;
                } else {
                  accumulatedFinalRef.current = chunkClean;
                }
              }
            } else {
              currentInterim += transcriptChunk;
            }
          }

          setInterimTranscript(currentInterim);
          setFinalTranscript(accumulatedFinalRef.current);
        };

        recognition.onerror = (event) => {
          clearTimers();
          setIsRequestingPermission(false);
          setIsListening(false);

          if (isAbortingRef.current) {
            isAbortingRef.current = false;
            return;
          }

          const friendlyMsg = normalizeSpeechError(event.error);
          if (friendlyMsg) {
            setErrorMessage(friendlyMsg);
            if (onError) onError(friendlyMsg);
          }
        };

        recognition.onend = () => {
          clearTimers();
          setIsRequestingPermission(false);
          setIsListening(false);
          setInterimTranscript('');

          const fullFinal = accumulatedFinalRef.current.trim();
          if (fullFinal && !isAbortingRef.current) {
            if (onTranscriptFinalized) {
              onTranscriptFinalized(fullFinal);
            }
          }
          isAbortingRef.current = false;
        };

        recognition.start();
      } catch (err) {
        clearTimers();
        setIsRequestingPermission(false);
        setIsListening(false);
        console.warn('SpeechRecognition start exception:', err);
        const friendly = 'Unable to start microphone. Please try again.';
        setErrorMessage(friendly);
        if (onError) onError(friendly);
      }
    },
    [isSupported, isListening, isRequestingPermission, clearTimers, stopListening, onError, onTranscriptFinalized]
  );

  // Stop listening when page visibility is lost (protect user privacy)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        stopListening();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isListening, stopListening]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      isAbortingRef.current = true;
      clearTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [clearTimers]);

  return {
    isSupported,
    isListening,
    isRequestingPermission,
    interimTranscript,
    finalTranscript,
    elapsedSeconds,
    errorMessage,
    startListening,
    stopListening,
    cancelListening,
    appendSpeechTranscript,
  };
}

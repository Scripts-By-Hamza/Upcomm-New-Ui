/**
 * UPCOMM SOLUTIONS TASK MANAGER — Web Speech API Utility
 * Browser-native speech-to-text integration for AI Assistant
 * 
 * Safe capability detection, error normalization, and transcript formatting.
 * Zero paid APIs, zero external speech libraries, zero cloud audio storage.
 */

/**
 * Safely resolves the browser SpeechRecognition constructor
 * Supports standard SpeechRecognition and webkitSpeechRecognition
 */
export function getSpeechRecognitionClass() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Checks if browser-native Web Speech API is supported in current environment
 * @returns {boolean}
 */
export function isWebSpeechRecognitionSupported() {
  return Boolean(getSpeechRecognitionClass());
}

/**
 * Normalizes speech recognition errors into user-friendly messages
 * @param {string} errorCode - Error code from SpeechRecognitionErrorEvent
 * @returns {string|null} User-friendly message, or null if silent (e.g. intentional abort)
 */
export function normalizeSpeechError(errorCode) {
  switch (errorCode) {
    case 'no-speech':
      return "I didn't hear anything. Try speaking again.";
    case 'audio-capture':
      return 'No microphone was detected. Check your microphone and try again.';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is blocked. Enable microphone permissions in your browser settings to use voice input.';
    case 'network':
      return 'Voice recognition is temporarily unavailable. You can continue typing.';
    case 'language-not-supported':
      return 'The selected speech language is not supported by your browser.';
    case 'aborted':
      // Intentional cancellation or stop, do not display error banner
      return null;
    default:
      return `Voice input error: ${errorCode || 'Unknown issue'}.`;
  }
}

/**
 * Appends spoken transcript cleanly to existing manual text in the composer
 * Prevents squished words or duplicate whitespace
 * @param {string} baseText - Existing text currently in the composer textarea
 * @param {string} speechText - Finalized speech transcript to append
 * @returns {string} Cleanly concatenated prompt string
 */
export function appendSpeechTranscript(baseText = '', speechText = '') {
  const cleanSpeech = (speechText || '').trim();
  if (!cleanSpeech) return baseText || '';

  const cleanBase = (baseText || '').trimEnd();
  if (!cleanBase) return cleanSpeech;

  // If base text ends with punctuation or letter, add a single space
  return `${cleanBase} ${cleanSpeech}`;
}

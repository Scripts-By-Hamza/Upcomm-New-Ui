/**
 * UPCOMM SOLUTIONS TASK MANAGER — Centralized Application Feature Flags
 *
 * Feature flags for gradual rollouts and temporary disabling of experimental
 * or postponed features.
 */

export const FEATURES = {
  // Temporarily disabled. Voice input may return through a provider-based
  // speech implementation in a future release.
  AI_VOICE_INPUT: false,
};

export default FEATURES;

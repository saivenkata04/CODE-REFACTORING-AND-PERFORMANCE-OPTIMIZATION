/**
 * Configuration and constants for the LogFlow analytics engine.
 * Eliminates magic numbers and centralizes business rules.
 */

const CONFIG = {
  HTTP_STATUS: {
    VALID_MIN: 200,
    VALID_MAX: 599,
    CLIENT_ERROR_MIN: 400,
    SERVER_ERROR_MIN: 500
  },
  ANOMALY_THRESHOLDS: {
    MIN_SERVER_ERRORS: 3,
    LATENCY_SPIKE_THRESHOLD_MS: 1000
  },
  PERCENTILE_TARGET: 0.95,
  BOT_USER_AGENT_REGEX: /(bot|crawler|spider|curl|urllib)/i,
  BYTES_PER_MEGABYTE: 1024 * 1024
};

module.exports = { CONFIG };

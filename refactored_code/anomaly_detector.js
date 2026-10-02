/**
 * Anomaly detection service.
 * Operates on pre-aggregated IP statistics in O(M) time (M = unique IPs)
 * instead of the legacy O(N^2) quadratic scan.
 */

const { CONFIG } = require('./config');

class AnomalyDetector {
  /**
   * Detects IPs exceeding error thresholds and suffering latency spikes.
   * @param {Map<string, Object>} ipAggregations - Pre-indexed IP map
   * @returns {Array<string>} Alphabetically sorted list of flagged IP addresses
   */
  static detectSuspiciousIps(ipAggregations) {
    const flagged = [];

    for (const [ip, stats] of ipAggregations.entries()) {
      if (
        stats.serverErrorCount >= CONFIG.ANOMALY_THRESHOLDS.MIN_SERVER_ERRORS &&
        stats.hasSlowResponse
      ) {
        flagged.push(ip);
      }
    }

    return flagged.sort();
  }
}

module.exports = { AnomalyDetector };

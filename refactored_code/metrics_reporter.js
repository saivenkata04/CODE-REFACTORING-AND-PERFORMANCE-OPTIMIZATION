/**
 * Metrics aggregation and reporting service.
 */

const { CONFIG } = require('./config');

class MetricsReporter {
  /**
   * Compiles detailed metrics for each endpoint based on pre-aggregated data.
   * @param {Map<string, Object>} endpointAggregations 
   * @returns {Object} Structured endpoint metrics map
   */
  static compileEndpointMetrics(endpointAggregations) {
    const metrics = {};

    for (const [endpoint, stats] of endpointAggregations.entries()) {
      const times = stats.responseTimes;
      // Sort times array once for exact percentile calculation
      times.sort((a, b) => a - b);
      
      const p95Index = Math.floor(times.length * CONFIG.PERCENTILE_TARGET);
      const p95 = times[p95Index] || 0;
      const avg = stats.count > 0 ? parseFloat((stats.sumTime / stats.count).toFixed(2)) : 0;
      const errorRate = stats.count > 0 ? parseFloat(((stats.errorCount / stats.count) * 100).toFixed(2)) : 0;

      metrics[endpoint] = {
        count: stats.count,
        avgResponseTime: avg,
        maxResponseTime: stats.maxTime,
        p95ResponseTime: p95,
        errorRate: errorRate
      };
    }

    return metrics;
  }

  /**
   * Compiles the overall system summary.
   * @param {number} rawCount 
   * @param {Object} indexerInstance 
   * @param {number} flaggedCount 
   * @returns {Object} System summary
   */
  static compileSummary(rawCount, indexerInstance, flaggedCount) {
    const validCount = indexerInstance.validLogs.length;
    const totalErrors = indexerInstance.totalErrors;
    const totalBytes = indexerInstance.totalBytes;
    const totalTime = indexerInstance.totalResponseTime;

    return {
      totalProcessed: validCount,
      rawRecordsCount: rawCount,
      duplicatesRemoved: indexerInstance.duplicateCount,
      errorCount: totalErrors,
      errorRate: validCount > 0 ? parseFloat(((totalErrors / validCount) * 100).toFixed(2)) : 0,
      avgLatency: validCount > 0 ? parseFloat((totalTime / validCount).toFixed(2)) : 0,
      totalMegabytesTransferred: parseFloat((totalBytes / CONFIG.BYTES_PER_MEGABYTE).toFixed(3)),
      flaggedSuspiciousIPsCount: flaggedCount
    };
  }
}

module.exports = { MetricsReporter };

/**
 * LogFlow Analytics Engine (Refactored & Optimized Production Release)
 * 
 * Architecture:
 * - Single Responsibility Principle (SRP)
 * - Separation of Concerns (Parser -> Indexer -> AnomalyDetector -> MetricsReporter)
 * - O(N) linear time complexity with Set/Map hash indexing
 * - Zero GC-thrashing and immutable data handling
 */

const fs = require('fs');
const path = require('path');
const { LogIndexer } = require('./indexer');
const { AnomalyDetector } = require('./anomaly_detector');
const { MetricsReporter } = require('./metrics_reporter');

class LogFlowEngine {
  /**
   * Executes the full analytics pipeline over input log data.
   * @param {Array<Object>} inputData 
   * @returns {Object} Analytical report
   */
  static process(inputData) {
    if (!Array.isArray(inputData) || inputData.length === 0) {
      return { err: "no data" };
    }

    // 1. Single-pass indexing & aggregation O(N)
    const indexer = new LogIndexer();
    indexer.index(inputData);

    // 2. Anomaly detection O(M)
    const flaggedSuspiciousIPs = AnomalyDetector.detectSuspiciousIps(indexer.ipAggregations);

    // 3. Endpoint metrics compilation O(E)
    const endpointMetrics = MetricsReporter.compileEndpointMetrics(indexer.endpointAggregations);

    // 4. Global summary calculation O(1)
    const summary = MetricsReporter.compileSummary(
      inputData.length,
      indexer,
      flaggedSuspiciousIPs.length
    );

    return {
      summary,
      flaggedSuspiciousIPs,
      endpointMetrics
    };
  }
}

/**
 * Drop-in backward-compatible entry point.
 */
function runOptimizedPipeline(inputData) {
  return LogFlowEngine.process(inputData);
}

if (require.main === module) {
  const samplePath = path.join(__dirname, '../data/logs_small.json');
  if (fs.existsSync(samplePath)) {
    const raw = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    console.time('Optimized Pipeline Execution');
    const result = runOptimizedPipeline(raw);
    console.timeEnd('Optimized Pipeline Execution');
    console.log('Result Summary:', result.summary);
  }
}

module.exports = {
  LogFlowEngine,
  runOptimizedPipeline
};

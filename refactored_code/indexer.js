/**
 * High-performance single-pass log indexer.
 * Replaces O(N^2) quadratic nested scans with O(1) Set and Map indexing.
 */

const { CONFIG } = require('./config');
const { LogParser } = require('./parser');

class LogIndexer {
  constructor() {
    this.seenRequestIds = new Set();
    this.validLogs = [];
    this.duplicateCount = 0;
    
    // Hash maps for O(1) lookups and single-pass aggregations
    this.ipAggregations = new Map();
    this.endpointAggregations = new Map();
    
    // Global metrics counters
    this.totalErrors = 0;
    this.totalBytes = 0;
    this.totalResponseTime = 0;
  }

  /**
   * Processes an array of raw log records in a single O(N) pass.
   * @param {Array<Object>} records - Raw logs
   */
  index(records) {
    if (!Array.isArray(records)) return;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record || !record.requestId) continue;

      // O(1) Deduplication via Set
      if (this.seenRequestIds.has(record.requestId)) {
        this.duplicateCount++;
        continue;
      }
      this.seenRequestIds.add(record.requestId);

      // Validation
      if (!LogParser.isValid(record)) {
        continue;
      }

      const enriched = LogParser.enrich(record);
      this.validLogs.push(enriched);

      // 1. Single-pass IP Aggregation
      this._aggregateIp(enriched);

      // 2. Single-pass Endpoint Aggregation
      this._aggregateEndpoint(enriched);

      // 3. Global Counters
      if (enriched.statusCode >= CONFIG.HTTP_STATUS.CLIENT_ERROR_MIN) {
        this.totalErrors++;
      }
      this.totalBytes += enriched.bytesSent || 0;
      this.totalResponseTime += enriched.responseTime || 0;
    }
  }

  _aggregateIp(log) {
    const ip = log.ip;
    let ipStats = this.ipAggregations.get(ip);
    if (!ipStats) {
      ipStats = {
        serverErrorCount: 0,
        hasSlowResponse: false
      };
      this.ipAggregations.set(ip, ipStats);
    }

    if (log.statusCode >= CONFIG.HTTP_STATUS.SERVER_ERROR_MIN) {
      ipStats.serverErrorCount++;
    }
    if (log.responseTime > CONFIG.ANOMALY_THRESHOLDS.LATENCY_SPIKE_THRESHOLD_MS) {
      ipStats.hasSlowResponse = true;
    }
  }

  _aggregateEndpoint(log) {
    const ep = log.endpoint;
    let epStats = this.endpointAggregations.get(ep);
    if (!epStats) {
      epStats = {
        count: 0,
        sumTime: 0,
        maxTime: 0,
        errorCount: 0,
        responseTimes: []
      };
      this.endpointAggregations.set(ep, epStats);
    }

    epStats.count++;
    epStats.sumTime += log.responseTime;
    if (log.responseTime > epStats.maxTime) {
      epStats.maxTime = log.responseTime;
    }
    if (log.statusCode >= CONFIG.HTTP_STATUS.CLIENT_ERROR_MIN) {
      epStats.errorCount++;
    }
    epStats.responseTimes.push(log.responseTime);
  }
}

module.exports = { LogIndexer };

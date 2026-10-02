// ============================================================================
// LEGACY LOG PROCESSING PIPELINE (Open-Source v0.1.2 Legacy Release)
// NOTE: Un-refactored baseline implementation with known architectural smells
// and algorithmic bottlenecks.
// ============================================================================

const fs = require('fs');

// Global mutable state
var g_counter = 0;
var g_tmp = [];

function runLegacyPipeline(inputData) {
  var d = inputData;
  var out = {};
  
  if (!d || d.length === 0) {
    return { err: "no data" };
  }

  // 1. Ingestion and deep cloning (Unnecessary memory duplication)
  var arr = JSON.parse(JSON.stringify(d));

  // 2. Quadratic Deduplication: O(N^2)
  // Iterating through all records and performing a linear lookup for every entry
  var u = [];
  for (var i = 0; i < arr.length; i++) {
    var found = false;
    for (var j = 0; j < u.length; j++) {
      if (u[j].requestId === arr[i].requestId) {
        found = true;
        break;
      }
    }
    if (!found) {
      u.push(arr[i]);
    }
  }

  // 3. Filtering & Transformation with regex recompilation inside loops
  var validLogs = [];
  for (var k = 0; k < u.length; k++) {
    var item = u[k];
    
    // Code smell: Re-instantiating RegExp inside tight loop
    var botRegex = new RegExp("(bot|crawler|spider|curl|urllib)", "i");
    var isBot = botRegex.test(item.userAgent);
    
    // Code smell: Deep nested conditionals & magic numbers
    if (item.statusCode) {
      if (item.statusCode >= 200) {
        if (item.statusCode < 600) {
          if (item.responseTime >= 0) {
            item.isBot = isBot;
            validLogs.push(item);
          }
        }
      }
    }
  }

  // 4. IP Clustering & Anomaly Detection: O(N^2)
  // For every single record, scan the entire dataset to compute per-IP error stats
  var flaggedIPs = [];
  for (var m = 0; m < validLogs.length; m++) {
    var curIp = validLogs[m].ip;
    
    // Inefficient filter scan: O(N) inside loop
    var allFromThisIp = validLogs.filter(function(x) {
      return x.ip === curIp;
    });

    var errorCount = 0;
    for (var n = 0; n < allFromThisIp.length; n++) {
      // Magic number 500
      if (allFromThisIp[n].statusCode >= 500) {
        errorCount++;
      }
    }

    // Magic numbers 3 and 1000
    var hasSlowResponse = false;
    for (var p = 0; p < allFromThisIp.length; p++) {
      if (allFromThisIp[p].responseTime > 1000) {
        hasSlowResponse = true;
        break;
      }
    }

    if (errorCount >= 3 && hasSlowResponse) {
      if (flaggedIPs.indexOf(curIp) === -1) {
        flaggedIPs.push(curIp);
      }
    }
  }

  // 5. Endpoint Performance Aggregations (Multiple redundant scans)
  var endpoints = [];
  for (var e = 0; e < validLogs.length; e++) {
    if (endpoints.indexOf(validLogs[e].endpoint) === -1) {
      endpoints.push(validLogs[e].endpoint);
    }
  }

  var endpointStats = {};
  for (var epIdx = 0; epIdx < endpoints.length; epIdx++) {
    var ep = endpoints[epIdx];
    var matchedLogs = validLogs.filter(function(log) {
      return log.endpoint === ep;
    });

    var sumTime = 0;
    var maxTime = 0;
    var errorEpCount = 0;

    for (var mi = 0; mi < matchedLogs.length; mi++) {
      sumTime += matchedLogs[mi].responseTime;
      if (matchedLogs[mi].responseTime > maxTime) {
        maxTime = matchedLogs[mi].responseTime;
      }
      if (matchedLogs[mi].statusCode >= 400) {
        errorEpCount++;
      }
    }

    // Inefficient percentile calculation: re-cloning & re-sorting
    var times = matchedLogs.map(function(l) { return l.responseTime; });
    times.sort(function(a, b) { return a - b; });

    var p95Index = Math.floor(times.length * 0.95);
    var p95 = times[p95Index] || 0;

    endpointStats[ep] = {
      count: matchedLogs.length,
      avgResponseTime: parseFloat((sumTime / matchedLogs.length).toFixed(2)),
      maxResponseTime: maxTime,
      p95ResponseTime: p95,
      errorRate: parseFloat(((errorEpCount / matchedLogs.length) * 100).toFixed(2))
    };
  }

  // 6. Global Summary Calculation
  var totalErrors = 0;
  var totalBytes = 0;
  var totalTime = 0;

  for (var s = 0; s < validLogs.length; s++) {
    if (validLogs[s].statusCode >= 400) {
      totalErrors++;
    }
    totalBytes += validLogs[s].bytesSent;
    totalTime += validLogs[s].responseTime;
  }

  out.summary = {
    totalProcessed: validLogs.length,
    rawRecordsCount: d.length,
    duplicatesRemoved: d.length - u.length,
    errorCount: totalErrors,
    errorRate: parseFloat(((totalErrors / validLogs.length) * 100).toFixed(2)),
    avgLatency: parseFloat((totalTime / validLogs.length).toFixed(2)),
    totalMegabytesTransferred: parseFloat((totalBytes / (1024 * 1024)).toFixed(3)),
    flaggedSuspiciousIPsCount: flaggedIPs.length
  };

  out.flaggedSuspiciousIPs = flaggedIPs.sort();
  out.endpointMetrics = endpointStats;

  return out;
}

if (require.main === module) {
  const samplePath = require('path').join(__dirname, '../data/logs_small.json');
  if (fs.existsSync(samplePath)) {
    const raw = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    console.time('Legacy Pipeline Execution');
    const result = runLegacyPipeline(raw);
    console.timeEnd('Legacy Pipeline Execution');
    console.log('Result Summary:', result.summary);
  }
}

module.exports = { runLegacyPipeline };

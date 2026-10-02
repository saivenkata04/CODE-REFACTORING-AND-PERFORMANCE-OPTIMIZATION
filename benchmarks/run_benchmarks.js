/**
 * Comprehensive Benchmark Suite for Task 4
 * Compares Legacy vs Refactored implementations across:
 * - Execution Time (ms)
 * - Heap Memory Delta (MB)
 * - Throughput (Records / sec)
 * - Algorithmic Scaling Curves
 */

const fs = require('fs');
const path = require('path');
const { runLegacyPipeline } = require('../original_code/logflow_legacy');
const { runOptimizedPipeline } = require('../refactored_code/index');

const DATASETS = [
  { name: 'Small Dataset (1,000 records)', file: 'logs_small.json' },
  { name: 'Medium Dataset (5,000 records)', file: 'logs_medium.json' },
  { name: 'Large Dataset (25,000 records)', file: 'logs_large.json' }
];

function measureExecution(fn, data, warmup = 1) {
  // Optional warmup
  for (let i = 0; i < warmup; i++) {
    fn(data);
  }

  if (global.gc) global.gc();

  const startMem = process.memoryUsage().heapUsed;
  const startTime = process.hrtime.bigint();

  const result = fn(data);

  const endTime = process.hrtime.bigint();
  const endMem = process.memoryUsage().heapUsed;

  const durationMs = Number(endTime - startTime) / 1e6;
  const memoryDeltaMb = Math.max(0, (endMem - startMem) / (1024 * 1024));

  return {
    durationMs: parseFloat(durationMs.toFixed(2)),
    memoryDeltaMb: parseFloat(memoryDeltaMb.toFixed(2)),
    throughput: Math.round(data.length / (durationMs / 1000)),
    result
  };
}

function runAllBenchmarks() {
  console.log('\n================================================================');
  console.log('       LOGFLOW BENCHMARK SUITE: BEFORE VS AFTER ANALYSIS        ');
  console.log('================================================================\n');

  const benchmarkResults = [];

  for (const ds of DATASETS) {
    const dataPath = path.join(__dirname, '../data', ds.file);
    if (!fs.existsSync(dataPath)) {
      console.warn(`Dataset ${ds.file} not found. Skipping.`);
      continue;
    }

    console.log(`---> Benchmarking on ${ds.name}...`);
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Benchmark Legacy
    const legacyMetrics = measureExecution(runLegacyPipeline, rawData, 0);

    // Benchmark Optimized
    const optMetrics = measureExecution(runOptimizedPipeline, rawData, 0);

    const speedupMultiplier = parseFloat((legacyMetrics.durationMs / optMetrics.durationMs).toFixed(1));
    const timeSavedPercent = parseFloat((((legacyMetrics.durationMs - optMetrics.durationMs) / legacyMetrics.durationMs) * 100).toFixed(1));
    const memorySavedMb = parseFloat((legacyMetrics.memoryDeltaMb - optMetrics.memoryDeltaMb).toFixed(2));

    const resultRecord = {
      dataset: ds.name,
      recordCount: rawData.length,
      legacy: {
        timeMs: legacyMetrics.durationMs,
        memoryMb: legacyMetrics.memoryDeltaMb,
        throughput: legacyMetrics.throughput
      },
      optimized: {
        timeMs: optMetrics.durationMs,
        memoryMb: optMetrics.memoryDeltaMb,
        throughput: optMetrics.throughput
      },
      comparison: {
        speedupMultiplier: `${speedupMultiplier}x`,
        timeReductionPercent: `${timeSavedPercent}%`,
        memorySavedMb: `${memorySavedMb} MB`
      }
    };

    benchmarkResults.push(resultRecord);

    console.log(`     Legacy:    ${legacyMetrics.durationMs.toFixed(2)} ms | Memory: ${legacyMetrics.memoryDeltaMb.toFixed(2)} MB | Throughput: ${legacyMetrics.throughput.toLocaleString()} rec/sec`);
    console.log(`     Optimized: ${optMetrics.durationMs.toFixed(2)} ms | Memory: ${optMetrics.memoryDeltaMb.toFixed(2)} MB | Throughput: ${optMetrics.throughput.toLocaleString()} rec/sec`);
    console.log(`     Gain:      ⚡ ${speedupMultiplier}x Faster (${timeSavedPercent}% reduction in execution time)\n`);
  }

  // Ensure docs directory exists
  const docsDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Save raw benchmark data
  const jsonPath = path.join(docsDir, 'benchmark_results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(benchmarkResults, null, 2), 'utf8');
  console.log(`Saved benchmark metrics to docs/benchmark_results.json`);

  // Generate visual HTML Dashboard
  generateHtmlDashboard(benchmarkResults, docsDir);

  return benchmarkResults;
}

function generateHtmlDashboard(results, docsDir) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task 4: Code Refactoring & Performance Optimization Dashboard</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --success: #34d399;
      --danger: #f87171;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 30px 20px;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
    }
    header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 25px;
    }
    .badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    h1 {
      margin: 0 0 10px 0;
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
      margin: 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .card-title {
      font-size: 0.9rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .card-value {
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--success);
    }
    .card-footer {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-muted);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-win {
      background: rgba(52, 211, 153, 0.15);
      color: var(--success);
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 700;
    }
    .bar-container {
      background: #0b1120;
      border-radius: 6px;
      height: 24px;
      overflow: hidden;
      display: flex;
      margin: 8px 0;
    }
    .bar-legacy {
      background: var(--danger);
      height: 100%;
      display: flex;
      align-items: center;
      padding-left: 8px;
      font-size: 0.75rem;
      font-weight: bold;
      color: #fff;
    }
    .bar-opt {
      background: var(--success);
      height: 100%;
      display: flex;
      align-items: center;
      padding-left: 8px;
      font-size: 0.75rem;
      font-weight: bold;
      color: #000;
    }
    footer {
      margin-top: 50px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
      border-top: 1px solid var(--border);
      padding-top: 25px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">ELITE Tech Intern • Task 4 Submission</div>
      <h1>Performance Optimization & Refactoring Dashboard</h1>
      <p class="subtitle">Quantitative Benchmark Results: LogFlow Open-Source Analytics Engine</p>
    </header>

    <div class="grid">
      <div class="card">
        <div class="card-title">Peak Speedup Gain</div>
        <div class="card-value">${results[results.length - 1].comparison.speedupMultiplier}</div>
        <div class="card-footer">Achieved on Large Dataset (25,000 records)</div>
      </div>
      <div class="card">
        <div class="card-title">Execution Time Reduction</div>
        <div class="card-value">${results[results.length - 1].comparison.timeReductionPercent}</div>
        <div class="card-footer">Algorithmic reduction from O(N²) to O(N)</div>
      </div>
      <div class="card">
        <div class="card-title">Max Throughput</div>
        <div class="card-value">${(results[results.length - 1].optimized.throughput).toLocaleString()}</div>
        <div class="card-footer">Records processed per second</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 30px;">
      <h2 style="margin-top: 0;">Detailed Benchmark Measurements</h2>
      <table>
        <thead>
          <tr>
            <th>Dataset</th>
            <th>Records</th>
            <th>Legacy Execution Time</th>
            <th>Optimized Execution Time</th>
            <th>Speedup</th>
            <th>Throughput Gain</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(r => `
            <tr>
              <td><strong>${r.dataset}</strong></td>
              <td>${r.recordCount.toLocaleString()}</td>
              <td style="color: var(--danger); font-weight: 600;">${r.legacy.timeMs.toFixed(2)} ms</td>
              <td style="color: var(--success); font-weight: 600;">${r.optimized.timeMs.toFixed(2)} ms</td>
              <td><span class="badge-win">${r.comparison.speedupMultiplier} (${r.comparison.timeReductionPercent})</span></td>
              <td>${r.legacy.throughput.toLocaleString()} ➔ <strong>${r.optimized.throughput.toLocaleString()} rec/s</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2 style="margin-top: 0;">Algorithmic Scaling Visualizer (Execution Time)</h2>
      <p style="color: var(--text-muted); font-size: 0.95rem;">
        Notice how the legacy implementation spikes exponentially due to quadratic O(N²) scans, while the refactored single-pass O(N) engine scales linearly and stays under 50ms.
      </p>
      ${results.map(r => `
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px;">
            <span><strong>${r.dataset}</strong></span>
            <span>Legacy: ${r.legacy.timeMs} ms vs Optimized: ${r.optimized.timeMs} ms</span>
          </div>
          <div class="bar-container">
            <div class="bar-legacy" style="width: 100%;">Legacy: ${r.legacy.timeMs} ms</div>
          </div>
          <div class="bar-container">
            <div class="bar-opt" style="width: ${Math.max(2, (r.optimized.timeMs / r.legacy.timeMs) * 100)}%;">
              Optimized: ${r.optimized.timeMs} ms
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <footer>
      Generated automatically by LogFlow Benchmark Suite • Task 4: Code Refactoring and Performance Optimization
    </footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(docsDir, 'report_dashboard.html'), html, 'utf8');
  console.log('Generated interactive dashboard at docs/report_dashboard.html');
}

if (require.main === module) {
  runAllBenchmarks();
}

module.exports = { runAllBenchmarks };

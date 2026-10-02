/**
 * Functional Parity & Correctness Test Suite.
 * Validates that refactored_code and original_code produce 100% identical outputs.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const { runLegacyPipeline } = require('../original_code/logflow_legacy');
const { runOptimizedPipeline, LogFlowEngine } = require('../refactored_code/index');

let passedTests = 0;
let totalTests = 0;

function it(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✓ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n======================================================');
console.log(' RUNNING FUNCTIONAL PARITY & REGRESSION TESTS');
console.log('======================================================\n');

// Test 1: Empty and invalid inputs
it('Handles empty or undefined data gracefully', () => {
  const resLegacy = runLegacyPipeline([]);
  const resOptimized = runOptimizedPipeline([]);
  assert.deepStrictEqual(resLegacy, { err: "no data" });
  assert.deepStrictEqual(resOptimized, { err: "no data" });

  const nullLegacy = runLegacyPipeline(null);
  const nullOptimized = runOptimizedPipeline(null);
  assert.deepStrictEqual(nullLegacy, { err: "no data" });
  assert.deepStrictEqual(nullOptimized, { err: "no data" });
});

// Test 2: Parity on small dataset
it('Produces identical summary results on logs_small.json', () => {
  const smallData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/logs_small.json'), 'utf8'));
  const legacy = runLegacyPipeline(smallData);
  const optimized = runOptimizedPipeline(smallData);

  assert.strictEqual(legacy.summary.totalProcessed, optimized.summary.totalProcessed);
  assert.strictEqual(legacy.summary.rawRecordsCount, optimized.summary.rawRecordsCount);
  assert.strictEqual(legacy.summary.duplicatesRemoved, optimized.summary.duplicatesRemoved);
  assert.strictEqual(legacy.summary.errorCount, optimized.summary.errorCount);
  assert.strictEqual(legacy.summary.errorRate, optimized.summary.errorRate);
  assert.strictEqual(legacy.summary.avgLatency, optimized.summary.avgLatency);
  assert.strictEqual(legacy.summary.totalMegabytesTransferred, optimized.summary.totalMegabytesTransferred);
  assert.strictEqual(legacy.summary.flaggedSuspiciousIPsCount, optimized.summary.flaggedSuspiciousIPsCount);
});

it('Identifies identical flagged suspicious IPs on logs_medium.json', () => {
  const medData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/logs_medium.json'), 'utf8'));
  const legacy = runLegacyPipeline(medData);
  const optimized = runOptimizedPipeline(medData);

  assert.deepStrictEqual(legacy.flaggedSuspiciousIPs, optimized.flaggedSuspiciousIPs);
  assert.strictEqual(legacy.summary.flaggedSuspiciousIPsCount, optimized.summary.flaggedSuspiciousIPsCount);
});

it('Produces identical endpoint metrics across all endpoints on logs_medium.json', () => {
  const medData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/logs_medium.json'), 'utf8'));
  const legacy = runLegacyPipeline(medData);
  const optimized = runOptimizedPipeline(medData);

  const legacyEndpoints = Object.keys(legacy.endpointMetrics).sort();
  const optimizedEndpoints = Object.keys(optimized.endpointMetrics).sort();

  assert.deepStrictEqual(legacyEndpoints, optimizedEndpoints);

  for (const ep of legacyEndpoints) {
    const lMetrics = legacy.endpointMetrics[ep];
    const oMetrics = optimized.endpointMetrics[ep];

    assert.strictEqual(lMetrics.count, oMetrics.count, `Count mismatch on ${ep}`);
    assert.strictEqual(lMetrics.avgResponseTime, oMetrics.avgResponseTime, `Avg response time mismatch on ${ep}`);
    assert.strictEqual(lMetrics.maxResponseTime, oMetrics.maxResponseTime, `Max response time mismatch on ${ep}`);
    assert.strictEqual(lMetrics.p95ResponseTime, oMetrics.p95ResponseTime, `P95 mismatch on ${ep}`);
    assert.strictEqual(lMetrics.errorRate, oMetrics.errorRate, `Error rate mismatch on ${ep}`);
  }
});

it('Supports OOP invocation via LogFlowEngine.process()', () => {
  const smallData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/logs_small.json'), 'utf8'));
  const result = LogFlowEngine.process(smallData);
  assert.ok(result.summary);
  assert.ok(Array.isArray(result.flaggedSuspiciousIPs));
  assert.ok(result.endpointMetrics);
});

console.log('\n------------------------------------------------------');
console.log(`Test Execution Finished: ${passedTests}/${totalTests} Passed`);
console.log('------------------------------------------------------\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

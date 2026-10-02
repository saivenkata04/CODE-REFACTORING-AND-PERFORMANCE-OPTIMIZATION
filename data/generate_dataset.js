const fs = require('fs');
const path = require('path');

const DATA_DIR = __dirname;

const ENDPOINTS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/users/profile',
  '/api/v1/products',
  '/api/v1/products/search',
  '/api/v1/cart/checkout',
  '/api/v1/orders/history',
  '/api/v1/payments/process',
  '/health',
  '/metrics'
];

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
const STATUS_CODES = [200, 200, 200, 200, 201, 400, 401, 403, 404, 500, 502];
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
  'curl/7.68.0',
  'Googlebot/2.1 (+http://www.google.com/bot.html)',
  'Python-urllib/3.8'
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLogEntry(index, baseTime) {
  const isAnomaly = Math.random() < 0.05; // 5% anomalies
  const statusCode = isAnomaly ? (Math.random() < 0.7 ? 500 : 504) : getRandomElement(STATUS_CODES);
  const responseTime = isAnomaly ? getRandomInt(1200, 4500) : getRandomInt(15, 350);
  const ipGroup = getRandomInt(1, 150); // duplicate IPs exist for clustering
  const ip = `192.168.${ipGroup}.${getRandomInt(1, 20)}`;
  const timestamp = new Date(baseTime + index * 50).toISOString();

  // Create intentionally duplicated logs (e.g. retry storms) to test deduplication
  const requestId = `req_${Math.floor(index / 1.15)}`;

  return {
    requestId,
    timestamp,
    ip,
    method: getRandomElement(METHODS),
    endpoint: getRandomElement(ENDPOINTS),
    statusCode,
    responseTime,
    bytesSent: getRandomInt(200, 8500),
    userAgent: getRandomElement(USER_AGENTS)
  };
}

function generateDataset(size, filename) {
  console.log(`Generating ${size.toLocaleString()} log entries for ${filename}...`);
  const logs = [];
  const startTime = Date.now() - (size * 50);

  for (let i = 0; i < size; i++) {
    logs.push(generateLogEntry(i, startTime));
  }

  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), 'utf-8');
  const sizeMb = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
  console.log(`Saved ${filename} (${sizeMb} MB)`);
}

function main() {
  generateDataset(1000, 'logs_small.json');
  generateDataset(5000, 'logs_medium.json');
  generateDataset(25000, 'logs_large.json');
  console.log('Datasets generated successfully!');
}

if (require.main === module) {
  main();
}

module.exports = { generateLogEntry };

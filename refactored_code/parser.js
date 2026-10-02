/**
 * Log entry parsing, sanitization, and enrichment.
 */

const { CONFIG } = require('./config');

class LogParser {
  /**
   * Validates whether a raw log record conforms to expected boundaries.
   * @param {Object} record - Raw log entry
   * @returns {boolean}
   */
  static isValid(record) {
    if (!record || typeof record !== 'object') return false;
    
    const statusCode = record.statusCode;
    const responseTime = record.responseTime;

    return (
      typeof statusCode === 'number' &&
      statusCode >= CONFIG.HTTP_STATUS.VALID_MIN &&
      statusCode <= CONFIG.HTTP_STATUS.VALID_MAX &&
      typeof responseTime === 'number' &&
      responseTime >= 0
    );
  }

  /**
   * Enriches a valid log record with pre-computed metadata.
   * Uses a pre-compiled regular expression to prevent GC pressure.
   * @param {Object} record - Validated log entry
   * @returns {Object} Enriched record (non-mutating)
   */
  static enrich(record) {
    const isBot = CONFIG.BOT_USER_AGENT_REGEX.test(record.userAgent || '');
    return {
      ...record,
      isBot
    };
  }
}

module.exports = { LogParser };

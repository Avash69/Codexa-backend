export const logger = {
  info: (message) => console.log(`ℹ️ INFO: ${message}`),
  error: (message) => console.error(`❌ ERROR: ${message}`),
  warn: (message) => console.warn(`⚠️ WARNING: ${message}`),
  debug: (message) => console.debug(`🔍 DEBUG: ${message}`),
};

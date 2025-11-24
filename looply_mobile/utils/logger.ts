/**
 * Logger utility - chỉ log trong development mode
 * Giúp tối ưu performance và giảm noise trong production
 */

const isDevelopment = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Luôn log errors, kể cả trong production
    console.error(...args);
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  debug: (...args: any[]) => {
    // Chỉ log trong development và khi cần debug
    if (isDevelopment && process.env.EXPO_PUBLIC_DEBUG === 'true') {
      console.log('[DEBUG]', ...args);
    }
  }
};


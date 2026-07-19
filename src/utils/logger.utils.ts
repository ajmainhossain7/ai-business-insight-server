import { isDevelopment } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const COLORS = {
  info: '\x1b[36m',    // Cyan
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  debug: '\x1b[35m',   // Magenta
  reset: '\x1b[0m',
};

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const color = COLORS[level];
  const prefix = `${color}[${timestamp}] [${level.toUpperCase()}]${COLORS.reset}`;
  const extra = args.length > 0 ? ' ' + args.map(a => JSON.stringify(a)).join(' ') : '';
  return `${prefix} ${message}${extra}`;
}

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(formatMessage('info', message, ...args));
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(formatMessage('warn', message, ...args));
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(formatMessage('error', message, ...args));
  },
  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(formatMessage('debug', message, ...args));
    }
  },
};

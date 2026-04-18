/**
 * Structured logger
 * - Production: JSON lines to stdout { level, msg, ts, ...meta }
 * - Development: colorized prefix output
 * - Test: suppressed
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type Meta = Record<string, unknown>;

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m', // gray
  info:  '\x1b[36m', // cyan
  warn:  '\x1b[33m', // yellow
  error: '\x1b[31m', // red
};
const RESET = '\x1b[0m';

function log(level: LogLevel, msg: string, meta?: Meta): void {
  if (isTest) return;

  if (isProd) {
    const entry: Record<string, unknown> = {
      level,
      msg,
      ts: new Date().toISOString(),
    };
    if (meta) {
      for (const [k, v] of Object.entries(meta)) {
        if (v !== undefined && v !== null) entry[k] = v;
      }
    }
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    const color = COLORS[level];
    const prefix = `${color}[ ${level.toUpperCase().padEnd(5)} ]${RESET}`;
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
    const out = `${prefix} ${msg}${metaStr}`;
    if (level === 'error') {
      console.error(out);
    } else if (level === 'warn') {
      console.warn(out);
    } else {
      console.log(out);
    }
  }
}

export const logger = {
  debug: (msg: string, meta?: Meta) => log('debug', msg, meta),
  info:  (msg: string, meta?: Meta) => log('info',  msg, meta),
  warn:  (msg: string, meta?: Meta) => log('warn',  msg, meta),
  error: (msg: string, meta?: Meta) => log('error', msg, meta),
};

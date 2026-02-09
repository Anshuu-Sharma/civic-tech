// ============================================================
// apps/api/src/lib/logger.ts
// Lightweight colored console logger with scoped modules,
// request/response middleware, and timing helpers.
// Zero external dependencies.
// ============================================================

// ── ANSI color codes ────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgCyan: '\x1b[46m',
};

// ── Log levels ──────────────────────────────────────────────
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'debug';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}

// ── Timestamp ───────────────────────────────────────────────
function timestamp(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${C.gray}${h}:${m}:${s}.${ms}${C.reset}`;
}

// ── Format helpers ──────────────────────────────────────────
function formatScope(scope: string): string {
  return `${C.bold}${C.cyan}[${scope}]${C.reset}`;
}

function truncate(str: string, max: number = 200): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '...';
}

function formatBody(body: unknown): string {
  if (!body || (typeof body === 'object' && Object.keys(body as object).length === 0)) {
    return '';
  }
  try {
    const str = JSON.stringify(body);
    return `${C.gray}${truncate(str, 300)}${C.reset}`;
  } catch {
    return `${C.gray}[unserializable]${C.reset}`;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${C.gray}(${ms}ms)${C.reset}`;
  const s = (ms / 1000).toFixed(1);
  if (ms < 3000) return `${C.yellow}(${s}s)${C.reset}`;
  return `${C.red}${C.bold}(${s}s SLOW)${C.reset}`;
}

function formatStatusCode(code: number): string {
  if (code < 300) return `${C.green}${code}${C.reset}`;
  if (code < 400) return `${C.cyan}${code}${C.reset}`;
  if (code < 500) return `${C.yellow}${code}${C.reset}`;
  return `${C.red}${C.bold}${code}${C.reset}`;
}

function formatMethod(method: string): string {
  const colors: Record<string, string> = {
    GET: C.green,
    POST: C.yellow,
    PUT: C.blue,
    PATCH: C.magenta,
    DELETE: C.red,
  };
  const color = colors[method] || C.white;
  return `${color}${C.bold}${method.padEnd(6)}${C.reset}`;
}

// ── Scoped Logger ───────────────────────────────────────────
export interface ScopedLogger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  success: (...args: unknown[]) => void;
  time: (label: string) => () => void;
}

function createScopedLogger(scope: string): ScopedLogger {
  const tag = formatScope(scope);

  return {
    debug(...args: unknown[]) {
      if (!shouldLog('debug')) return;
      console.log(timestamp(), `${C.gray}[DEBUG]${C.reset}`, tag, ...args);
    },

    info(...args: unknown[]) {
      if (!shouldLog('info')) return;
      console.log(timestamp(), `${C.cyan}[INFO] ${C.reset}`, tag, ...args);
    },

    warn(...args: unknown[]) {
      if (!shouldLog('warn')) return;
      console.warn(timestamp(), `${C.yellow}[WARN] ${C.reset}`, tag, ...args);
    },

    error(...args: unknown[]) {
      if (!shouldLog('error')) return;
      // Print error objects with full stack
      const formatted = args.map((a) => {
        if (a instanceof Error) {
          return `${C.red}${a.message}${C.reset}\n${C.gray}${a.stack?.split('\n').slice(1, 6).join('\n')}${C.reset}`;
        }
        return a;
      });
      console.error(timestamp(), `${C.red}${C.bold}[ERROR]${C.reset}`, tag, ...formatted);
    },

    success(...args: unknown[]) {
      if (!shouldLog('info')) return;
      console.log(timestamp(), `${C.green}[OK]   ${C.reset}`, tag, ...args);
    },

    time(label: string) {
      const start = Date.now();
      return () => {
        const ms = Date.now() - start;
        this.info(`${label} ${formatDuration(ms)}`);
      };
    },
  };
}

// ── Request/Response Middleware ──────────────────────────────
import type { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl, body, query } = req;

  // Log incoming request
  const parts = [
    timestamp(),
    `${C.bgCyan}${C.bold} REQ ${C.reset}`,
    formatMethod(method),
    `${C.white}${originalUrl}${C.reset}`,
  ];

  // Show query params if present
  if (Object.keys(query).length > 0) {
    parts.push(`${C.gray}?${JSON.stringify(query)}${C.reset}`);
  }

  console.log(...parts);

  // Show request body for POST/PATCH/PUT (skip file uploads)
  if (['POST', 'PATCH', 'PUT'].includes(method) && body && Object.keys(body).length > 0) {
    // Redact sensitive fields
    const sanitized = { ...body };
    if (sanitized.password) sanitized.password = '***';
    if (sanitized.token) sanitized.token = sanitized.token.slice(0, 8) + '...';
    console.log(
      timestamp(),
      `${C.gray}       Body:${C.reset}`,
      formatBody(sanitized),
    );
  }

  // Capture response
  const originalJson = res.json.bind(res);
  res.json = function (data: unknown) {
    const ms = Date.now() - start;
    const code = res.statusCode;

    // Log response
    console.log(
      timestamp(),
      `${C.bgGreen}${C.bold} RES ${C.reset}`,
      formatMethod(method),
      `${C.white}${originalUrl}${C.reset}`,
      `${C.gray}->${C.reset}`,
      formatStatusCode(code),
      formatDuration(ms),
    );

    // On error responses, show error message
    if (code >= 400 && data && typeof data === 'object') {
      const errData = data as Record<string, unknown>;
      if (errData.error || errData.message) {
        console.log(
          timestamp(),
          `${C.red}       Error:${C.reset}`,
          `${C.red}${errData.error || errData.message}${C.reset}`,
        );
      }
    }

    return originalJson(data);
  };

  next();
}

// ── Startup banner ──────────────────────────────────────────
export function logStartupBanner(opts: {
  port: number;
  env: string;
  corsOrigin: string;
}) {
  const line = (label: string, value: string) =>
    `  ${C.gray}${label.padEnd(14)}${C.reset} ${C.white}${value}${C.reset}`;

  console.log();
  console.log(`  ${C.bold}${C.cyan}JanSunwai AI${C.reset} ${C.gray}API Server${C.reset}`);
  console.log(`  ${C.gray}${'─'.repeat(36)}${C.reset}`);
  console.log(line('Environment', opts.env));
  console.log(line('Port', String(opts.port)));
  console.log(line('CORS Origin', opts.corsOrigin));
  console.log(line('Log Level', currentLevel));
  console.log(line('Health', `http://localhost:${opts.port}/api/v1/health`));
  console.log(`  ${C.gray}${'─'.repeat(36)}${C.reset}`);
  console.log();
}

// ── Exports ─────────────────────────────────────────────────
export const logger = {
  ...createScopedLogger('App'),
  scope: createScopedLogger,
  formatDuration,
  formatBody,
};

export default logger;

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: unknown;
}

export type LogTransport = (level: string, message: string, context?: LogContext) => void;

function redactSensitive(context?: LogContext): LogContext | undefined {
  if (!context) return context;
  const redacted = { ...context };
  if (redacted.apiKey) redacted.apiKey = '[REDACTED]';
  if (redacted.url && typeof redacted.url === 'string') {
    redacted.url = redacted.url.replace(/api_key=[^&]+/, 'api_key=[REDACTED]');
  }
  return redacted;
}

export class Logger {
  private level: LogLevel;
  private transport: LogTransport;

  constructor(level: string = 'info', transport?: LogTransport) {
    this.level = LogLevel[level.toUpperCase() as keyof typeof LogLevel] ?? LogLevel.INFO;
    this.transport = transport || ((level, message, context) => {
      console.error(this.formatMessage(level, message, context));
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(redactSensitive(context))}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.transport('debug', message, redactSensitive(context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.transport('info', message, redactSensitive(context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.transport('warn', message, redactSensitive(context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const fullContext = {
        ...redactSensitive(context),
        error: error?.message,
        stack: error?.stack,
      };
      this.transport('error', message, fullContext);
    }
  }
}

export const logger = new Logger(process.env.LOG_LEVEL); 
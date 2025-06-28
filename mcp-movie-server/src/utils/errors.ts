export class TmdbApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'TmdbApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof TmdbApiError) {
    // Retry on 5xx errors and rate limiting
    return (error.statusCode && error.statusCode >= 500) || error.statusCode === 429;
  }
  return false;
}

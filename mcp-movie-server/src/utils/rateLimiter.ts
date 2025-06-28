// Simple in-memory rate limiter placeholder
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  allow(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const reqs = (this.requests.get(key) || []).filter((ts) => ts > windowStart);
    if (reqs.length >= this.maxRequests) return false;
    reqs.push(now);
    this.requests.set(key, reqs);
    return true;
  }

  clear(): void {
    this.requests.clear();
  }
}

// Usage example:
// const limiter = new RateLimiter(100, 60_000); // 100 requests per minute
// if (!limiter.allow('user-or-ip')) { /* reject request */ }

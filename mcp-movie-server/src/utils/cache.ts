import { logger } from './logger.js';
import { setInterval, clearInterval } from 'node:timers';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  estimatedSize: number;
}

export interface CacheStats {
  entries: number;
  hits: number;
  misses: number;
  evictions: number;
  memoryUsage: {
    current: number;
    max: number;
    percentage: number;
  };
  hitRatio: number;
}

export interface CacheConfig {
  maxEntries?: number;
  maxMemoryMB?: number;
  defaultTtlMs?: number;
  cleanupIntervalMs?: number;
  enableStats?: boolean;
}

export class Cache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private config: Required<CacheConfig>;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  private cleanupTimer?: ReturnType<typeof setInterval>;
  private currentMemoryUsage = 0;

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 1000,
      maxMemoryMB: config.maxMemoryMB ?? 50,
      defaultTtlMs: config.defaultTtlMs ?? 5 * 60 * 1000,
      cleanupIntervalMs: config.cleanupIntervalMs ?? 60 * 1000,
      enableStats: config.enableStats ?? true
    };

    // Start periodic cleanup
    this.startCleanupTimer();
    
    logger.debug('Cache initialized', {
      maxEntries: this.config.maxEntries,
      maxMemoryMB: this.config.maxMemoryMB,
      defaultTtlMs: this.config.defaultTtlMs
    });
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    const entryTtl = ttlMs ?? this.config.defaultTtlMs;
    const estimatedSize = this.estimateSize(data);
    const now = Date.now();

    // Check if adding this entry would exceed memory limit
    if (this.currentMemoryUsage + estimatedSize > this.config.maxMemoryMB * 1024 * 1024) {
      this.evictLeastRecentlyUsed();
    }

    // Check if we need to evict due to entry count limit
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLeastRecentlyUsed();
    }

    // Remove existing entry if updating
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.currentMemoryUsage -= existingEntry.estimatedSize;
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTtl,
      accessCount: 1,
      lastAccessed: now,
      estimatedSize
    };

    this.cache.set(key, entry);
    this.currentMemoryUsage += estimatedSize;

    logger.debug('Cache entry set', {
      key,
      ttlMs: entryTtl,
      estimatedSizeBytes: estimatedSize,
      totalEntries: this.cache.size,
      memoryUsageMB: Math.round(this.currentMemoryUsage / (1024 * 1024) * 100) / 100
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      this.currentMemoryUsage -= entry.estimatedSize;
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    return entry.data as T;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentMemoryUsage -= entry.estimatedSize;
      return this.cache.delete(key);
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.currentMemoryUsage = 0;
    logger.debug('Cache cleared');
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRatio = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const maxMemoryBytes = this.config.maxMemoryMB * 1024 * 1024;
    
    return {
      entries: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      memoryUsage: {
        current: this.currentMemoryUsage,
        max: maxMemoryBytes,
        percentage: Math.round((this.currentMemoryUsage / maxMemoryBytes) * 100 * 100) / 100
      },
      hitRatio: Math.round(hitRatio * 100 * 100) / 100
    };
  }

  resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Estimate the memory size of a data object
   */
  private estimateSize(data: unknown): number {
    if (data === null || data === undefined) return 8;
    
    if (typeof data === 'string') {
      return data.length * 2; // Assuming UTF-16
    }
    
    if (typeof data === 'number') {
      return 8;
    }
    
    if (typeof data === 'boolean') {
      return 4;
    }
    
    if (Array.isArray(data)) {
      return data.reduce((sum, item) => sum + this.estimateSize(item), 0) + 24;
    }
    
    if (typeof data === 'object') {
      const json = JSON.stringify(data);
      return json.length * 2 + 24; // JSON size + object overhead
    }
    
    return 24; // Default object overhead
  }

  /**
   * Evict the least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.cache.delete(oldestKey);
        this.currentMemoryUsage -= entry.estimatedSize;
        this.stats.evictions++;
        
        logger.debug('Cache entry evicted (LRU)', {
          key: oldestKey,
          lastAccessed: new Date(oldestTime).toISOString(),
          freedBytes: entry.estimatedSize
        });
      }
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    let freedMemory = 0;

    for (const [key, entry] of this.cache.entries()) {
      const isExpired = now - entry.timestamp > entry.ttl;
      if (isExpired) {
        this.cache.delete(key);
        this.currentMemoryUsage -= entry.estimatedSize;
        expiredCount++;
        freedMemory += entry.estimatedSize;
      }
    }

    if (expiredCount > 0) {
      logger.debug('Cache cleanup completed', {
        expiredEntries: expiredCount,
        freedMemoryBytes: freedMemory,
        remainingEntries: this.cache.size
      });
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);
    
    // Don't keep the process alive just for cleanup
    this.cleanupTimer.unref();
  }

  /**
   * Stop the cleanup timer and free resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
    logger.debug('Cache destroyed');
  }
}

// Create cache instance with production-ready defaults
export const cache = new Cache({
  maxEntries: 1000,
  maxMemoryMB: 50,
  defaultTtlMs: 5 * 60 * 1000, // 5 minutes
  cleanupIntervalMs: 60 * 1000, // 1 minute
  enableStats: true
}); 
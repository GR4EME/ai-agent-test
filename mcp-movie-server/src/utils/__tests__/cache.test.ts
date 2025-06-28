import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Cache } from '../cache.js';

describe('Cache', () => {
  let testCache: Cache;

  beforeEach(() => {
    jest.useFakeTimers();
    testCache = new Cache();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should store and retrieve values', () => {
    testCache.set('foo', 123, 1000);
    expect(testCache.get('foo')).toBe(123);
  });

  it('should return null for expired values', () => {
    testCache.set('bar', 456, 1);
    jest.advanceTimersByTime(2);
    expect(testCache.get('bar')).toBeNull();
  });

  it('should clear all values', () => {
    testCache.set('baz', 789, 1000);
    testCache.clear();
    expect(testCache.get('baz')).toBeNull();
  });

  it('should report the correct size', () => {
    testCache.set('a', 1, 1000);
    testCache.set('b', 2, 1000);
    expect(testCache.size()).toBe(2);
    testCache.clear();
    expect(testCache.size()).toBe(0);
  });
});


import { logger } from './logger.js';

// Defines a function that can be retried
type RetryableFunction<T> = (attempt: number) => Promise<T>;

// Defines a function to check if an error is retryable
type IsRetryable = (error: unknown) => boolean;

/**
 * Executes a function with a retry mechanism.
 *
 * @param fn The async function to execute.
 * @param isRetryable A function to determine if an error is retryable.
 * @param retries The maximum number of retries.
 * @param delayMs The initial delay between retries, which will be exponentially backed off.
 * @returns The result of the function if successful.
 * @throws The last error if all retries fail.
 */
export async function retry<T>(
  fn: RetryableFunction<T>,
  isRetryable: IsRetryable,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error occurred');

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error as Error;

      if (attempt < retries && isRetryable(error)) {
        const delay = Math.pow(2, attempt - 1) * delayMs;
        logger.warn('Retrying operation', {
          attempt,
          delay: `${delay}ms`,
          error: error instanceof Error ? error.message : String(error),
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // If it's not a retryable error or we've run out of retries, break the loop.
        break;
      }
    }
  }

  // If the loop completes without returning, throw the last captured error.
  throw lastError;
}

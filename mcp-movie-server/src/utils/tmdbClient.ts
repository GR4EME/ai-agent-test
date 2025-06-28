import { logger } from './logger.js';
import { TmdbApiError, ValidationError } from './errors.js';
import { isRetryableError } from './errors.js';
import { retry } from './retry.js';
import { cache } from './cache.js';

export interface TmdbClient {
  <T>(endpoint: string, params: Record<string, string>): Promise<T>;
}

export async function tmdbFetch<T>(
  endpoint: string, 
  params: Record<string, string>, 
  apiKey: string, 
  baseUrl: string,
  retries: number = 3,
  cacheTtlMs: number = 5 * 60 * 1000 // Default to 5 minutes
): Promise<T> {
  if (!apiKey) {
    throw new ValidationError('TMDb API key is not set. Please add TMDB_API_KEY to your .env file.');
  }

  if (!endpoint.startsWith('/')) {
    throw new ValidationError('Endpoint must start with /');
  }

  const url = new URL(`${baseUrl}${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  const cacheKey = url.toString();
  const cachedData = cache.get<T>(cacheKey);
  if (cachedData) {
    logger.debug('Returning cached TMDb API response', { cacheKey });
    return cachedData;
  }

  const requestId = Math.random().toString(36).substring(7);
  logger.debug('Making TMDb API request', { 
    requestId, 
    endpoint, 
    params: Object.keys(params),
    url: url.toString().replace(apiKey, '[REDACTED]')
  });

  try {
    const data = await retry(async () => {
      const startTime = Date.now();
      const response = await fetch(url.toString());
      const duration = Date.now() - startTime;

      logger.debug('TMDb API response received', { 
        requestId, 
        status: response.status, 
        duration: `${duration}ms` 
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TmdbApiError(
          `TMDb API error: ${response.statusText} - ${errorText}`,
          response.status,
          endpoint
        );
      }

      const responseData = await response.json() as T;
      
      logger.debug('TMDb API request successful', { 
        requestId, 
        dataKeys: Object.keys(responseData as Record<string, unknown>) 
      });
      
      return responseData;
    }, isRetryableError, retries);

    cache.set(cacheKey, data, cacheTtlMs);
    return data;
  } catch (error) {
    logger.error('TMDb API request failed after retries', error instanceof Error ? error : new Error(String(error)), { 
      requestId, 
      endpoint, 
      attempts: retries 
    });
    throw error;
  }
}

export function createTmdbClient(apiKey: string, baseUrl: string, retries: number, cacheTtlMs: number): TmdbClient {
  return async function boundTmdbFetch<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    return tmdbFetch<T>(endpoint, params, apiKey, baseUrl, retries, cacheTtlMs);
  };
} 
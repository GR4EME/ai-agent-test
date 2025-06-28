import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const ConfigSchema = z.object({
  tmdb: z.object({
    apiKey: z.string().min(1, 'TMDb API key is required'),
    baseUrl: z
      .string()
      .url('TMDb base URL must be a valid URL')
      .default('https://api.themoviedb.org/3'),
    retries: z.number().min(0).max(10).optional().default(3),
    cacheTtlMs: z
      .number()
      .min(0)
      .optional()
      .default(5 * 60 * 1000), // Default to 5 minutes
  }),
  server: z.object({
    name: z.string().default('movie-mcp-server'),
    version: z.string().default('1.0.0'),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    enableRequestLogging: z.boolean().default(true),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const config = {
    tmdb: {
      apiKey: process.env.TMDB_API_KEY,
      baseUrl: process.env.TMDB_BASE_URL,
      retries: process.env.TMDB_API_RETRIES
        ? parseInt(process.env.TMDB_API_RETRIES, 10)
        : undefined,
      cacheTtlMs: process.env.TMDB_CACHE_TTL_MS
        ? parseInt(process.env.TMDB_CACHE_TTL_MS, 10)
        : undefined,
    },
    server: {
      name: process.env.SERVER_NAME || 'movie-mcp-server',
      version: process.env.SERVER_VERSION || '1.0.0',
    },
    logging: {
      level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
      enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    },
  };

  return ConfigSchema.parse(config);
}

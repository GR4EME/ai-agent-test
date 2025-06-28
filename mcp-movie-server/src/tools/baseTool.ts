import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { TmdbClient } from '../utils/tmdbClient.js';
import { ValidationError } from '../utils/errors.js';

export interface ToolConfig {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, z.ZodTypeAny>;
}

export interface Tool {
  register(server: McpServer): void;
}

export abstract class BaseTool {
  protected tmdbFetch: TmdbClient;
  protected config: ToolConfig;

  constructor(tmdbFetch: TmdbClient, config: ToolConfig) {
    this.tmdbFetch = tmdbFetch;
    this.config = config;
  }

  protected validateInput<T>(input: unknown): T {
    try {
      // Create a Zod object from the input schema
      const schema = z.object(this.config.inputSchema);
      return schema.parse(input) as T;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new ValidationError(`Invalid input: ${fieldErrors}`);
      }
      throw error;
    }
  }

  protected formatError(error: unknown): { content: Array<{ type: 'text'; text: string }>; isError: boolean; errorCode: string; errorType: string } {
    let errorCode = 'UNKNOWN_ERROR';
    let errorType = 'UnknownError';
    let errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof Error) {
      errorType = error.name;
      if ('code' in error && typeof (error as { code?: string }).code === 'string') {
        errorCode = (error as { code: string }).code;
      } else if (error.name === 'ValidationError') {
        errorCode = 'VALIDATION_ERROR';
      } else if (error.name === 'TmdbApiError') {
        errorCode = 'TMDB_API_ERROR';
      } else if (error.name === 'ConfigurationError') {
        errorCode = 'CONFIG_ERROR';
      }
    }
    logger.error(`Tool execution failed: ${this.config.name}`, error instanceof Error ? error : undefined, {
      tool: this.config.name,
      error: errorMessage,
      errorCode,
      errorType,
    });
    return {
      content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
      isError: true,
      errorCode,
      errorType,
    };
  }

  protected formatSuccess(text: string): { content: Array<{ type: 'text'; text: string }> } {
    logger.debug(`Tool execution successful: ${this.config.name}`, { tool: this.config.name });
    return {
      content: [{ type: 'text' as const, text }],
    };
  }

  abstract execute(input: unknown): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }>;

  register(server: McpServer): void {
    server.registerTool(
      this.config.name,
      {
        title: this.config.title,
        description: this.config.description,
        inputSchema: this.config.inputSchema,
      },
      async (input) => {
        try {
          return await this.execute(input);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
} 
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
  execute(
    input: unknown
  ): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean; data?: unknown }>;
}

export type ToolDefinition = {
  config: ToolConfig;
  execute: (tmdbClient: TmdbClient) => (input: unknown) => Promise<{
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
    data?: unknown;
  }>;
};

export const validateInput =
  <T>(inputSchema: Record<string, z.ZodTypeAny>) =>
  (input: unknown): T => {
    try {
      const schema = z.object(inputSchema);
      return schema.parse(input) as T;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new ValidationError(`Invalid input: ${fieldErrors}`);
      }
      throw error;
    }
  };

export const formatError =
  (toolName: string) =>
  (
    error: unknown
  ): {
    content: Array<{ type: 'text'; text: string }>;
    isError: boolean;
    errorCode: string;
    errorType: string;
  } => {
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
    logger.error(`Tool execution failed: ${toolName}`, error instanceof Error ? error : undefined, {
      tool: toolName,
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
  };

export const formatSuccess =
  (toolName: string) =>
  (text: string): { content: Array<{ type: 'text'; text: string }> } => {
    logger.debug(`Tool execution successful: ${toolName}`, { tool: toolName });
    return {
      content: [{ type: 'text' as const, text }],
    };
  };

export const createTool = (definition: ToolDefinition, tmdbClient: TmdbClient): Tool => {
  const executeWithClient = definition.execute(tmdbClient);
  const errorFormatter = formatError(definition.config.name);

  return {
    execute: executeWithClient,
    register: (server: McpServer) => {
      server.registerTool(
        definition.config.name,
        {
          title: definition.config.title,
          description: definition.config.description,
          inputSchema: definition.config.inputSchema,
        },
        async (input) => {
          try {
            return await executeWithClient(input);
          } catch (error) {
            return errorFormatter(error);
          }
        }
      );
    },
  };
};

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config/index.js';
import { logger } from './utils/logger.js';
import { ConfigurationError } from './utils/errors.js';
import { Tool } from './tools/baseTool.js';
import { createTmdbClient } from './utils/tmdbClient.js';
import { MovieInfoTool } from './tools/movieInfo.js';
import { ActorInfoTool } from './tools/actorInfo.js';
import { MoviesByActorTool } from './tools/moviesByActor.js';
import { TopRatedMoviesTool } from './tools/topRatedMovies.js';

// Tool registry
const toolRegistry: Array<(tmdbFetch: ReturnType<typeof createTmdbClient>) => Tool> = [
  (tmdbFetch) => new MovieInfoTool(tmdbFetch),
  (tmdbFetch) => new ActorInfoTool(tmdbFetch),
  (tmdbFetch) => new MoviesByActorTool(tmdbFetch),
  (tmdbFetch) => new TopRatedMoviesTool(tmdbFetch),
];

async function main() {
  try {
    // Load and validate configuration
    const config = loadConfig();
    logger.info('Configuration loaded successfully', { 
      serverName: config.server.name,
      serverVersion: config.server.version,
      logLevel: config.logging.level
    });

    // Create server instance
    const server = new McpServer({
      name: config.server.name,
      version: config.server.version,
    });

    // Create TMDb client
    const boundTmdbFetch = createTmdbClient(config.tmdb.apiKey, config.tmdb.baseUrl, config.tmdb.retries, config.tmdb.cacheTtlMs);
    logger.info('TMDb client initialized');

    // Register all tools from registry
    for (const createTool of toolRegistry) {
      const tool = createTool(boundTmdbFetch);
      tool.register(server);
    }
    logger.info('All tools registered successfully');

    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('Movie MCP server running on stdio');
  } catch (error) {
    if (error instanceof ConfigurationError) {
      logger.error('Configuration error', error);
      process.exit(1);
    }
    
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Fatal error during server startup', errorObj);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('Unhandled promise rejection', error, { promise });
  process.exit(1);
});

main().catch((error) => {
  logger.error('Fatal error in main function', error);
  process.exit(1);
});

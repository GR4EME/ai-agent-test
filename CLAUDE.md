# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

The project is located in `mcp-movie-server/` directory. All commands should be run from within this directory.

```bash
cd mcp-movie-server
```

### Build and Run
- **Build TypeScript**: `npm run build`
- **Start server**: `npm start`
- **Run with MCP inspector**: `npm run inspect`

### Testing
- **Run all tests**: `npm test`
- **Run tests in watch mode**: `npm run test:watch`
- **Run tests with coverage**: `npm run test:coverage`
- **Coverage threshold**: 70% for branches, functions, lines, and statements

### Code Quality
- **Lint and fix**: `npm run lint`
- **TypeScript compilation**: `tsc` (via build command)

## Architecture Overview

This is a **Model Context Protocol (MCP) server** that provides movie and actor information using the TMDb API. The architecture follows a modular, production-ready pattern with proper error handling and configuration management.

### Core Components

**Entry Point**: `src/index.ts`
- Server initialization with MCP SDK
- Tool registration via registry pattern
- Global error handling and logging setup

**Configuration**: `src/config/index.ts`
- Zod-based schema validation
- Environment variable loading with defaults
- Type-safe configuration object

**Tool System**: `src/tools/`
- `baseTool.ts`: Abstract base class for all MCP tools
- Individual tool implementations (movieInfo, actorInfo, etc.)
- Registry pattern for dynamic tool loading

**Utilities**: `src/utils/`
- `tmdbClient.ts`: HTTP client with retry logic and caching
- `logger.ts`: Structured JSON logging with configurable levels
- `cache.ts`: Simple in-memory caching with TTL
- `errors.ts`: Custom error types for different failure modes
- `rateLimiter.ts`: API rate limiting utilities

### Key Patterns

**Error Handling**: Custom error types (TmdbApiError, ValidationError, ConfigurationError) with structured logging and retry mechanisms.

**Caching**: Request deduplication and response caching with configurable TTL.

**Tool Architecture**: All tools use functional composition with `ToolDefinition` objects and pure functions for MCP registration and error handling patterns.

**Configuration**: Environment-based configuration with runtime validation using Zod schemas.

## Environment Setup

Required environment variables:
- `TMDB_API_KEY`: TMDb API key (required)

Optional environment variables:
- `TMDB_BASE_URL`: API base URL (default: https://api.themoviedb.org/3)
- `LOG_LEVEL`: debug, info, warn, error (default: info)
- `ENABLE_REQUEST_LOGGING`: Boolean (default: true)

## Technology Stack

- **Runtime**: Node.js with ES modules
- **Language**: TypeScript with strict mode
- **Framework**: MCP SDK (@modelcontextprotocol/sdk)
- **Testing**: Jest with ts-jest preset
- **Validation**: Zod for runtime schema validation
- **Linting**: ESLint with TypeScript plugin and Prettier
- **Module System**: ES2022 target with Node16 module resolution
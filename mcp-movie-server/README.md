# Movie MCP Server

A Model Context Protocol (MCP) server that provides movie and actor information using the TMDb API.

## Features

- **Movie Information**: Get detailed information about movies by title
- **Actor Information**: Get actor details and filmography
- **Movies by Actor**: Find all movies featuring a specific actor
- **Top Rated Movies**: Get a list of top-rated movies

## Technical Improvements

This server has been enhanced with several production-ready features:

### 1. **Configuration Management**

- Centralized configuration with validation using Zod
- Environment-specific settings
- Runtime configuration validation

### 2. **Structured Logging**

- Configurable log levels (debug, info, warn, error)
- Structured JSON logging with timestamps
- Request/response logging for debugging

### 3. **Error Handling**

- Custom error types (TmdbApiError, ValidationError, ConfigurationError)
- Retry logic with exponential backoff for transient failures
- Graceful error recovery and reporting

### 4. **Code Organization**

- Base tool class for common functionality
- Modular architecture with separate files for each tool
- Type-safe interfaces and proper TypeScript usage

### 5. **Performance & Reliability**

- Request deduplication and caching
- Rate limiting awareness
- Proper timeout handling

### 6. **Testing Infrastructure**

- Jest testing framework with TypeScript support
- Test coverage reporting with 30% threshold
- Example tests for utilities

### 7. **CI/CD Pipeline**

- Automated GitHub Actions workflow for testing and quality checks
- Multi-job pipeline with dependency management and security scanning
- Branch protection with required status checks
- Automated dependency updates via Dependabot
- Code quality enforcement with ESLint and Prettier
- Security auditing with npm audit and CodeQL analysis

## Requirements

- Node.js 22.x (specified in `.nvmrc`)
- npm or compatible package manager
- TMDb API key

## Installation

1. Clone the repository
2. Use the correct Node.js version:
   ```bash
   nvm use  # Uses Node.js version from .nvmrc
   ```
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file with your TMDb API key:
   ```
   TMDB_API_KEY=your_api_key_here
   ```

## Usage

### Development

```bash
# Build the project
npm run build

# Run the server
npm start

# Run with MCP inspector
npm run inspect
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
# Lint and fix code
npm run lint
```

## Configuration

The server supports the following environment variables:

- `TMDB_API_KEY` (required): Your TMDb API key
- `TMDB_BASE_URL` (optional): TMDb API base URL (default: https://api.themoviedb.org/3)
- `SERVER_NAME` (optional): Server name (default: movie-mcp-server)
- `SERVER_VERSION` (optional): Server version (default: 1.0.0)
- `LOG_LEVEL` (optional): Logging level (debug, info, warn, error) (default: info)
- `ENABLE_REQUEST_LOGGING` (optional): Enable request logging (default: true)

## Architecture

```
src/
├── config/          # Configuration management
├── tools/           # MCP tool implementations
│   ├── baseTool.ts  # Base tool class
│   └── ...          # Individual tool implementations
├── utils/           # Utility functions
│   ├── logger.ts    # Structured logging
│   ├── errors.ts    # Custom error types
│   ├── cache.ts     # Caching utilities
│   └── tmdbClient.ts # TMDb API client
├── tmdbTypes.ts     # TypeScript interfaces for TMDb API
└── index.ts         # Main server entry point
```

## Available Tools

### get_movie_info

Returns detailed information about a movie by title.

**Input:**

- `title` (string): The title of the movie to look up

### get_actor_info

Returns information about an actor by name.

**Input:**

- `name` (string): The name of the actor to look up

### get_movies_by_actor

Returns a list of movies featuring a specific actor.

**Input:**

- `actor_name` (string): The name of the actor

### get_top_rated_movies

Returns a list of top-rated movies.

**Input:**

- `limit` (number, optional): Number of movies to return (default: 10)

## Error Handling

The server implements comprehensive error handling:

- **Validation Errors**: Invalid input parameters
- **API Errors**: TMDb API failures with retry logic
- **Configuration Errors**: Missing or invalid configuration
- **Network Errors**: Connection issues with automatic retries

## Logging

The server uses structured logging with the following levels:

- **DEBUG**: Detailed debugging information
- **INFO**: General operational information
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages with full context

## Testing

The project includes a comprehensive testing setup:

- Unit tests for utilities and tools
- Integration tests for API interactions
- Test coverage reporting
- Mock implementations for external dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass locally:
   ```bash
   npm test
   npm run lint
   npm run build
   ```
6. Submit a pull request

### Automated Checks

All pull requests automatically run through our CI pipeline which includes:

- **Code Quality**: ESLint linting and Prettier formatting checks
- **Type Safety**: TypeScript compilation and type checking
- **Testing**: Full test suite with coverage reporting (30% minimum)
- **Security**: npm audit and CodeQL security analysis
- **Build Verification**: Ensures the project builds successfully

Pull requests must pass all automated checks before merging. The CI pipeline runs on Node.js 22.x to match the project requirements.

## License

ISC

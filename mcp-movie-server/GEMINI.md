# Project Overview
This is the `mcp-movie-server` project, likely a backend server for movie-related functionalities.

# Key Technologies
- **Language:** TypeScript
- **Runtime:** Node.js
- **Testing Framework:** Jest
- **Linting:** ESLint
- **Formatting:** Prettier
- **Schema Validation:** Zod
- **Environment Variables:** dotenv
- **MCP SDK:** @modelcontextprotocol/sdk

# Build/Test/Lint Commands
- **Build:** `tsc`
- **Test:** `jest`
- **Lint:** `npx eslint --fix src`
- **Start:** `node build/index.js`

# Important File Paths/Directories
- `src/`: Source code directory.
- `build/`: Compiled JavaScript output directory.
- `src/tools/`: Contains various tools/modules for specific functionalities (e.g., `actorInfo`, `movieInfo`).
- `src/utils/`: Contains utility functions (e.g., `cache`, `logger`, `rateLimiter`).
- `src/__tests__/`: Contains unit tests for the source code.

# Coding Style/Conventions
- The project uses TypeScript.
- Code style and formatting are enforced by ESLint and Prettier, as configured in `eslint.config.js` and `.prettierrc`.

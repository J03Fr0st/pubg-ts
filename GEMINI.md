# Project Overview

This project is a comprehensive TypeScript wrapper for the official PUBG API. It provides full type safety, built-in rate limiting, caching, and robust error handling, making it easy for developers to interact with the PUBG API in their TypeScript projects.

The project is structured as a library and published to npm as `@j03fr0st/pubg-ts`. It also includes a command-line interface (CLI) for managing assets.

## Key Technologies

*   **TypeScript**: The entire codebase is written in TypeScript, providing strong typing and improved developer experience.
*   **Node.js**: The project is designed to run in a Node.js environment.
*   **Axios**: Used as the HTTP client for making requests to the PUBG API.
*   **Jest**: The testing framework used for unit and integration tests.
*   **Biome**: Used for code formatting and linting.
*   **Husky**: Used for pre-commit hooks to ensure code quality.
*   **Typedoc**: Used to generate API documentation.

## Architecture

The project follows a service-based architecture. The main `PubgClient` class acts as a facade, providing access to various services, each responsible for a specific area of the PUBG API (e.g., players, matches, seasons).

The `HttpClient` class is the core of the library, handling all the complexities of interacting with the PUBG API, including:

*   **Rate Limiting**: Implements a token bucket algorithm to avoid exceeding the API rate limits.
*   **Caching**: Caches API responses to improve performance and reduce the number of requests.
*   **Error Handling**: Provides custom error types for different API errors.
*   **Retries**: Automatically retries failed requests with exponential backoff.

# Building and Running

## Installation

```bash
npm install
```

## Building

To build the project, run the following command:

```bash
npm run build
```

This will compile the TypeScript code and output the JavaScript files to the `dist` directory.

## Running Tests

To run the test suite, use the following command:

```bash
npm test
```

This will run all unit and integration tests.

## Running the CLI

The project includes a CLI for managing assets. To use the CLI, run the following command:

```bash
npx pubg-ts --help
```

# Development Conventions

## Code Style

The project uses Biome for code formatting and linting. The configuration is defined in the `biome.json` file.

## Testing

The project uses Jest for testing. Test files are located in the `tests` directory and are separated into `unit` and `integration` tests.

## Committing

The project uses Husky to run pre-commit hooks. These hooks format the code, run the linter, and run tests to ensure code quality before committing.

## Asset Management

The project includes a system for synchronizing and managing assets from the PUBG API. The `npm run sync-assets` command is used to update the local asset cache.

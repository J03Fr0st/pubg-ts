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

Each `PubgClient` owns an internal `ClientRuntime`, which implements the `EndpointTransport` used by services. The runtime owns client-local request state and delegates transaction mechanics to `HttpTransactionRunner`, including:

*   **Rate Limiting**: Implements a token bucket algorithm to avoid exceeding the API rate limits.
*   **Caching**: Caches eligible API responses within that client instance.
*   **Error Handling**: Maps transaction failures to the library's domain error types.
*   **Retries**: Automatically retries failed requests with exponential backoff.
*   **Health State**: Reduces real request outcomes into synchronous, redacted `PubgClient.getHealth()` snapshots.

Match telemetry is fetched through `Matches.getTelemetry()` using the runtime's external transport path without authenticated headers or response caching.

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

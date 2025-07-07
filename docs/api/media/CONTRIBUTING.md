# Contributing to PUBG TypeScript API Wrapper

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/pubg-ts.git
   cd pubg-ts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Add your PUBG API key for testing
   ```

## Development Workflow

### Code Style

This project uses [Biome](https://biomejs.dev/) for formatting and linting:

```bash
# Check code style
npm run check

# Auto-fix issues
npm run check:fix

# Format code
npm run format
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit
```

### Building

```bash
# Build TypeScript
npm run build

# Build and watch for changes
npm run dev
```

## Pre-commit Hooks

This project uses Husky for pre-commit hooks that will:
- Run Biome formatting and linting
- Run tests for changed files
- Ensure code quality before commits

## Debugging

Enable debug logging by setting the `DEBUG` environment variable:

```bash
# Enable all debug logs
DEBUG=pubg-ts:* npm test

# Enable specific component logs
DEBUG=pubg-ts:http,pubg-ts:cache npm test
```

## Pull Request Guidelines

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write tests for new functionality
   - Update documentation if needed
   - Follow existing code patterns

3. **Test your changes**
   ```bash
   npm test
   npm run build
   npm run check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Message Convention

We use conventional commits for clear commit history:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

Examples:
- `feat: add caching support to HTTP client`
- `fix: handle rate limit errors properly`
- `docs: update API documentation`

## Code Guidelines

### TypeScript

- Use strict TypeScript settings
- Prefer `type` imports when importing only types
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Testing

- Write unit tests for all new functionality
- Use descriptive test names
- Mock external dependencies
- Aim for good test coverage

### API Design

- Follow existing patterns in the codebase
- Use TypeScript interfaces for all data structures
- Implement proper error handling
- Add debug logging for important operations

## Adding New Features

### New API Endpoints

1. Add TypeScript interfaces in `src/types/`
2. Create service class in `src/api/services/`
3. Add comprehensive tests
4. Update examples and documentation

### New Utilities

1. Add utility in `src/utils/`
2. Export from main index file
3. Add unit tests
4. Document usage in README

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Create examples for new features
- Update TypeScript interfaces

## Bug Reports

When reporting bugs, please include:

1. **Description** - Clear description of the issue
2. **Reproduction** - Steps to reproduce the bug
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happens
5. **Environment** - Node.js version, OS, etc.
6. **Code sample** - Minimal code that reproduces the issue

## Feature Requests

For feature requests, please:

1. **Check existing issues** - Avoid duplicates
2. **Describe the use case** - Why is this needed?
3. **Provide examples** - How would the API look?
4. **Consider alternatives** - Are there other solutions?

## Getting Help

- **Documentation** - Check the README and examples
- **Issues** - Search existing issues first
- **Discussions** - Use GitHub Discussions for questions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

Thank you for contributing! 🎉
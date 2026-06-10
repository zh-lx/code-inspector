# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Code Inspector** is a development productivity tool that enables developers to click on DOM elements in their browser and automatically open their IDE at the exact source code location. It supports multiple bundlers, frameworks, and code editors.

## Key Commands

### Development
```bash
# Install dependencies (uses pnpm workspaces)
pnpm install

# Build all packages
pnpm run build

# Build specific package
pnpm run build --filter @code-inspector/core

# Watch mode for development
pnpm run dev

# Run tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Run a single test file
pnpm run test path/to/test.spec.ts

# Lint code
pnpm run lint

# Type checking
pnpm run typecheck
```

### Version Management
```bash
# Update version for all packages
pnpm run version

# Publish to npm
pnpm run publish
```

## Architecture

### Monorepo Structure
- **packages/core**: Core functionality for code transformation, source mapping, and client-server communication
- **packages/code-inspector-plugin**: Unified plugin entry that dispatches to bundler-specific implementations
- **packages/vite-plugin**: Vite-specific plugin implementation
- **packages/webpack-plugin**: Webpack 4/5 plugin implementation
- **packages/rspack-plugin**: Rspack plugin implementation
- **packages/turbopack-plugin**: Turbopack plugin implementation
- **packages/esbuild-plugin**: ESBuild plugin implementation
- **packages/mako-plugin**: Mako bundler plugin implementation

### Core Components

#### Transform System (packages/core/src/transform/)
- **transform.ts**: Main transformation engine that processes source files
- **ast.ts**: AST manipulation for accurate code location tracking
- **vue.ts, jsx.ts, svelte.ts**: Framework-specific transformations
- Preserves accurate mapping between original and compiled code

#### Client-Server Communication
- **server.ts**: WebSocket server for browser-IDE communication
- **client.ts**: Browser injection script for element interaction
- Protocol: Browser → Server (element location) → IDE (file opening)

#### Source Mapping
- Tracks transformations through bundler pipelines
- Maintains accurate line/column mappings
- Handles complex scenarios like JSX, Vue templates, and Svelte components

### Plugin Architecture
1. **Unified Entry**: `code-inspector-plugin` provides single import
2. **Auto-detection**: Detects bundler type and loads appropriate implementation
3. **Consistent API**: All plugins share common interface despite bundler differences

## Supported Ecosystems

### Bundlers
- Webpack 4/5 (via loader and plugin)
- Vite 2/3/4/5
- Rspack
- Turbopack
- ESBuild
- Mako

### Frameworks
- Vue 2/3 (SFC, JSX, TSX)
- React (JSX, TSX)
- Next.js (App Router, Pages Router)
- Svelte
- Qwik
- Solid
- Preact
- Nuxt
- Remix
- Astro

### Editors
- VSCode (including WSL, remote SSH)
- WebStorm
- Cursor
- HBuilderX
- VSCode Insiders
- Custom editor support via configuration

## Key Technical Patterns

### Transform Pipeline
1. Source file enters bundler
2. Plugin intercepts and transforms code
3. Injects tracking attributes (data-inspector-*)
4. Preserves source maps throughout
5. Client script detects clicks and sends location
6. Server maps back to original file location

### Configuration Handling
- Auto-detects framework and bundler
- Minimal configuration required
- Supports advanced customization via config object
- Environment-aware (dev only by default)

### Cross-Platform Considerations
- Path normalization for Windows/Unix
- Editor detection across operating systems
- URL handling for various development servers

## Testing Approach

Tests use Vitest and are located alongside source files as `*.spec.ts`. Key areas:
- Transform accuracy for each framework
- Source map preservation
- Server-client communication
- Editor integration
- Bundle compatibility

## Common Development Tasks

### Adding New Bundler Support
1. Create new package in `packages/[bundler]-plugin`
2. Implement core plugin interface
3. Add to unified plugin dispatcher
4. Add demo project in `demos/`
5. Update documentation

### Debugging Transform Issues
1. Check `packages/core/src/transform/[framework].ts`
2. Verify AST manipulation preserves locations
3. Test with corresponding demo project
4. Use `DEBUG=code-inspector:*` for verbose logging

### Fixing Source Map Issues
1. Trace through transform pipeline
2. Check line/column offset calculations
3. Verify bundler-specific source map handling
4. Test with real-world project structures

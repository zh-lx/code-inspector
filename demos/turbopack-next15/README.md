# Turbopack Next.js 15 Demo

This demo showcases code-inspector-plugin with Next.js 15 using Turbopack bundler.

## Features

- Next.js 15.4+ with Turbopack
- Zero-config setup using `instrumentation-client.js`
- Click-to-source functionality with Option+Click (Mac) or Alt+Click (Windows)

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Run the development server with Turbopack:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000)

4. Hold Option/Alt + Click on any element to jump to its source code in your editor

## How it Works

The code inspector plugin automatically:
- Creates an `instrumentation-client.js` file that runs before your app
- Adds data attributes to elements during development
- Starts a local server to handle editor opening requests

No manual setup required for Next.js 15.3+ with Turbopack!
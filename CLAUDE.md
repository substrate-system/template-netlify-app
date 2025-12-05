# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

A Netlify-hosted application template using Preact, HTM, and TypeScript.
The frontend is built with Vite, and serverless functions are deployed to
Netlify. Tests run in a browser environment using tape-run.

## Development Commands

### Local Development

```bash
npm start
```
Starts both:
- Vite dev server on port 8888 (with HMR)
- Netlify functions server on port 9999

The Vite dev server proxies `/api/*` requests to `/.netlify/functions/*` on
port 9999.

### Build
```bash
npm run build
```
Builds the frontend to `./public` directory. Clears the directory before
building.

### Linting
```bash
npm run lint
```
Runs ESLint with TypeScript support. Uses Standard style with 4-space
indentation.

### Testing
```bash
npm test                  # Run unit tests (tapzero)
npm run build-tests       # Build test bundle only
npm run test-tape-run     # Run tests in browser only

npm run test-a11y         # Run accessibility tests (Playwright + axe-core)
npm run test-a11y-ui      # Run a11y tests in UI mode (interactive)
npm run test-a11y-headed  # Run a11y tests with visible browser
npm run test-a11y-debug   # Run a11y tests in debug mode

npm run test-all          # Run both unit and accessibility tests
```

Tests use two frameworks:
- Unit tests: `@substrate-system/tapzero` (tape-compatible) running in browser
  via tape-run
- Accessibility tests: Playwright with `@axe-core/playwright` for WCAG 2.1
  Level AA compliance

See `test/a11y/README.md` for detailed accessibility testing documentation.

## Architecture

### State Management (Preact Signals)
State is centralized in `src/state.ts`:
- Exports a `State()` factory function that returns a state object with
  signals
- State logic is exposed as static methods on `State` (e.g.,
  `State.Increase()`, `State.Decrease()`)
- Components call these methods and pass the state instance
- Uses `@preact/signals` for reactive state

Example pattern:
```typescript
// In state.ts
export function State() {
  return { count: signal(0) }
}
State.Increase = function(state) { state.count.value++ }

// In component
State.Increase(state)  // Modify state via static methods
```

### Routing
- URL routing handled by `route-event` (browser history management)
- Component routing handled by `@substrate-system/routes`
- Routes defined in `src/routes/index.ts` using
  `router.addRoute(path, action)`
- Actions return component functions
- State tracks current route via `state.route` signal

### Component Pattern (HTM)
Uses HTM (JSX-like syntax in template literals) with Preact:
```javascript
import { html } from 'htm/preact'
return html`<div>${value}</div>`
```

### Netlify Functions
- Located in `netlify/functions/`
- Use `@netlify/functions` v2 format (new Request/Response API)
- Export default async function and optional `config` object with `path`
  array
- Accessed from frontend via `/api/*` paths
- Functions use esbuild bundler (configured in netlify.toml)

Example function structure:
```typescript
import type { Context, Config } from '@netlify/functions'

export default async (req: Request, context: Context) => {
  return Response.json({ data })
}

export const config: Config = {
  path: ['/api/example/:param?']
}
```

### Vite Configuration
- Dev server: port 8888 with hot reload
- Proxies `/api` → `http://localhost:9999/.netlify/functions`
- Public assets: `_public/` (not `public/`, which is the build output)
- Build output: `./public` with inline sourcemaps
- PostCSS: Uses postcss-nesting and cssnano
- Target: esnext with minify disabled

## Code Style

- 4-space indentation (enforced by ESLint)
- Standard JavaScript style with TypeScript extensions
- Unused variables prefixed with `_` are ignored
- Template literal children ignore indentation rules

## Project Structure

```
src/
  index.ts          # Entry point, renders root component
  state.ts          # State factory and business logic
  routes/
    index.ts        # Route definitions
    home.ts         # Individual route components
  style.css         # Global styles

netlify/functions/  # Serverless functions
  example/
    example.ts

test/
  index.ts          # Unit test definitions (tapzero)
  index.html        # HTML harness for browser tests
  test-bundle.js    # Built test bundle (generated)
  a11y/             # Accessibility tests (Playwright + axe-core)
    README.md       # Detailed a11y testing documentation
    helpers.ts      # Reusable a11y testing utilities
    app.test.ts     # Main application accessibility tests
    forms-and-inputs.test.ts  # Example form/widget tests (skipped)

_public/            # Static assets (served as-is)
public/             # Build output directory (generated)
```

## Deployment

Project is configured for Netlify deployment:
- Build command: `npm run build`
- Publish directory: `public`
- Functions directory: `netlify/functions`
- Node version: 18
- SPA routing configured (all paths → index.html)

## Version Management

- `preversion`: Runs lint
- `version`: Generates changelog using auto-changelog with keepachangelog
  template
- `postversion`: Pushes commits and tags to remote

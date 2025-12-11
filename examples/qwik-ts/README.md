# Zag.js + Qwik Examples

This example app demonstrates how to use Zag.js state machines with Qwik, with particular focus on handling Qwik's preventDefault limitations.

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

The app will be available at http://localhost:3004

## Examples Included

### 1. Toggle Group - Basic Strategy
- Uses `normalizePropsBasic`
- Manual control over preventDefault
- Good for learning and explicit control

### 2. Toggle Group - Auto-detect Strategy
- Uses `normalizeProps` (default)
- Automatically detects preventDefault usage
- Recommended for most use cases

### 3. Toggle Group - Manual Strategy
- Uses `normalizePropsManual`
- Explicit metadata-driven approach
- Good for libraries and predictable behavior

### 4. Checkbox
- Demonstrates accessible checkbox component
- Uses auto-detect strategy
- Shows keyboard navigation and ARIA attributes

## Key Concepts

### The preventDefault Challenge

Qwik's event handlers are lazy-loaded and asynchronous, which means `event.preventDefault()` called inside handlers won't work as expected. The browser has already processed the default action by the time your handler runs.

### Solution Strategies

1. **Declarative Prevention**: Use `preventdefault:eventname` attributes
2. **sync$() Handlers**: Use synchronous handlers with limitations
3. **Auto-detection**: Let the adapter detect and handle automatically

See the `@zag-js/qwik` package README for detailed documentation.

## Project Structure

```
src/
├── components/         # Shared components
├── routes/            # Qwik City routes (pages)
│   ├── index.tsx     # Home page
│   ├── layout.tsx    # Layout wrapper
│   ├── toggle-*.tsx  # Toggle examples
│   └── checkbox.tsx  # Checkbox example
├── root.tsx          # Root component
├── entry.ssr.tsx     # SSR entry point
└── global.css        # Global styles
```

## Learn More

- [Zag.js Documentation](https://zagjs.com/)
- [Qwik Documentation](https://qwik.dev/)
- [@zag-js/qwik Package README](../../packages/frameworks/qwik/README.md)

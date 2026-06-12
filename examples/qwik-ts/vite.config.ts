import { qwikVite } from "@qwik.dev/core/optimizer"
import { qwikRouter } from "@qwik.dev/router/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(() => {
  return {
    plugins: [qwikRouter(), qwikVite(), tsconfigPaths({ root: "." })],
    optimizeDeps: {
      // the adapter ships TypeScript source and must go through the qwik
      // optimizer, never esbuild pre-bundling
      exclude: ["@zag-js/qwik"],
    },
    server: {
      headers: {
        "Cache-Control": "public, max-age=0",
      },
    },
  }
})

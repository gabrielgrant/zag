import { defineConfig } from "vitest/config"

export default defineConfig({
  define: {
    __EXPERIMENTAL__: "false",
    __INLINE__: "false",
    __QWIK_MANIFEST__: "undefined",
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
})

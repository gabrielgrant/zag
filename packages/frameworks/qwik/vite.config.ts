import { qwikVite } from "@qwik.dev/core/optimizer"
import { defineConfig } from "vitest/config"

import pkg from "./package.json"

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const externalize = (deps: Record<string, string> = {}) =>
  Object.keys(deps).map((dep) => new RegExp(`^${escapeRegex(dep)}(/.*)?$`))

const external = [/^node:.*/, ...externalize(pkg.dependencies), ...externalize(pkg.peerDependencies)]

export default defineConfig({
  build: {
    target: "es2020",
    outDir: "dist",
    lib: {
      entry: "./src/index.ts",
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.qwik.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      external,
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
  },
  plugins: [qwikVite()],
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

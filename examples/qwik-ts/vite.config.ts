import { qwikVite } from "@qwik.dev/core/optimizer"
import { qwikRouter } from "@qwik.dev/router/vite"
import { defineConfig, type UserConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import pkg from "./package.json"

type PkgDep = Record<string, string>
const { dependencies = {}, devDependencies = {} } = pkg as any as {
  dependencies: PkgDep
  devDependencies: PkgDep
  [key: string]: unknown
}
errorOnDuplicatesPkgDeps(devDependencies, dependencies)

export default defineConfig(
  (): UserConfig => ({
    plugins: [qwikRouter(), qwikVite(), tsconfigPaths({ root: "." })],
    optimizeDeps: {
      exclude: [],
    },
    server: {
      headers: {
        "Cache-Control": "public, max-age=0",
      },
    },
    preview: {
      headers: {
        "Cache-Control": "public, max-age=600",
      },
    },
  }),
)

function errorOnDuplicatesPkgDeps(devDependencies: PkgDep, dependencies: PkgDep) {
  const qwikPkg = Object.keys(dependencies).filter((value) => value.startsWith("@qwik.dev/"))
  if (qwikPkg.length > 0) {
    throw new Error(`Move qwik packages ${qwikPkg.join(", ")} to devDependencies`)
  }

  const duplicateDeps = Object.keys(devDependencies).filter((dep) => dependencies[dep])
  if (duplicateDeps.length > 0) {
    throw new Error(`Move duplicated dependencies to devDependencies only: ${duplicateDeps.join(", ")}`)
  }
}

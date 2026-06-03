# Qwik Playwright Investigation

## Goal

Make the Qwik v2/Qwik Router example behave like a normal scaffolded Qwik app under Playwright, without adapter users needing startup polling or Qwik runtime internals.

## Assumptions

- Most Qwik apps can be tested with Playwright using Qwik's normal build/preview flow.
- Qwik Router SSR can expose inert paused HTML if client resume fails, but the fix should usually be app/tooling configuration rather than a test workaround.
- The old raw Qwik example did not prove SSR resume worked; it avoided the race by rendering client-only.

## Hypotheses

1. The Playwright failure is caused by a real client runtime/build error, not merely Playwright clicking too early.
2. The current example's Vite 8 / TypeScript 6 setup differs from the generated Qwik v2 scaffold and may be producing invalid Qwik client chunks.
3. Aligning the example with the generated Qwik v2 scaffold should remove the need for adapter runtime-symbol registration or menu startup polling.

## Experiments

### Browser probe before scaffold alignment

- Result: previewed SSR page served paused HTML, then client resume failed with `__VITE_PRELOAD__ is not defined`.
- Decision: treat the Playwright failure as a build/runtime problem first, not as a test waiting problem.

### Adapter runtime-symbol workaround

- Result: replacing missing runtime symbols caused Qwik to request `/build/_`, because internal symbols mapped to `_` instead of real chunk names.
- Decision: remove this path. It leaked Qwik implementation details into the adapter and did not match normal Qwik apps.

### Generated Qwik v2 scaffold comparison

- Result: generated app uses `@qwik.dev/core`/`router` beta with Vite 7.3.1, TypeScript 5.9.3, `vite-tsconfig-paths` 4.x, and the standard `qwik build preview` flow.
- Decision: align the example's app-level tooling/config with the scaffold before investigating adapter internals.

## Current Experiment

Change only the Qwik example setup to match generated Qwik v2 scaffolding where it matters:

- Use Vite 7.3.1 instead of Vite 8.0.14.
- Use TypeScript 5.9.3 instead of TypeScript 6.0.3.
- Use the scaffold's Qwik/Vite config shape.
- Use a standalone scaffold-like `tsconfig.json` instead of extending the workspace TS 6 config.

Expected result: `qwik build preview` emits resumable client chunks without `__VITE_PRELOAD__` errors, and Playwright can click the menu without custom waits.

### Typecheck after dependency alignment

- Result: the adapter package built, but the Qwik example typecheck failed because the workspace root `tsconfig.json` contains `ignoreDeprecations: "6.0"`, which TypeScript 5.9 rejects.
- Decision: keep the example on a generated-app style TypeScript config. This avoids mixing a TS 5.9 Qwik scaffold with the workspace's TS 6 root settings.

### Preview build after scaffold config

- Result: the generated scaffold dependency guard rejected `@zag-js/qwik` because it matched any package name containing "qwik".
- Decision: keep the guard, but narrow it to `@qwik.dev/*` packages. `@zag-js/qwik` is the adapter under test and belongs in example dependencies.

### Browser probe after scaffold alignment

- Result: `qwik build preview` succeeded with Vite 7.3.1, and generated output no longer contained `__VITE_PRELOAD__` or `/build/_`.
- Result: Playwright loaded `/menu/basic/`, observed `q:container="resumed"`, clicked the menu trigger, and saw the menu content change from closed/hidden to open/visible with no browser errors.
- Decision: the clean fix is app-level scaffold alignment, not Playwright polling or adapter runtime-symbol registration.

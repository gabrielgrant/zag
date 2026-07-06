# Pre-commit / Pre-PR Checklist

Run through this checklist before declaring any branch "ready for review" or
"ready to merge". Every item exists because skipping it has caused a real
miss. Do not trust conclusions from earlier in a session — re-verify against
the current HEAD and the current upstream base.

## 1. Rebase & base freshness

- [ ] Fetch the real upstream (`chakra-ui/zag` `main`), not a stale local ref,
      and rebase. Verify `ahead N / behind 0` afterwards.
- [ ] After ANY rebase, treat all prior verification as void: upstream may have
      added tests, routes, machines, or CI steps your branch has never been
      validated against. Typecheck + build is NOT sufficient validation of a
      rebase — run the test suites.
- [ ] Regenerate `pnpm-lock.yaml` once after the rebase
      (`pnpm install --lockfile-only`) and confirm `git status` is clean after
      a plain `pnpm install` (CI uses a frozen lockfile).

## 2. Run the EXACT CI jobs locally (`.github/workflows/quality.yml`)

Do not approximate these with narrower commands; run what CI runs:

- [ ] `pnpm lint` — full repo, not just your package. (Catches, e.g.,
      eslint-disable comments referencing plugins this repo doesn't have —
      unknown-rule disables are themselves errors.)
- [ ] `pnpm typecheck` — all packages.
- [ ] `pnpm test` — all unit-test suites.
- [ ] `pnpm check-type-exports`.
- [ ] E2E: CI runs the full Playwright suite under `FRAMEWORK=react`. If you
      touched ANY shared file (`e2e/**`, `packages/machines/**`,
      `packages/utilities/**`, `shared/**`), run the affected specs under
      `FRAMEWORK=react` too, not only your framework.

## 3. Test-coverage parity audit (after every rebase)

- [ ] Extract every route the e2e suite targets and verify your example app
      has them all:
      `grep -rhoE 'goto\("(/[^"]+)"' e2e/ | sort -u` → check each path exists.
      Include template-literal gotos (``goto(`...`)``) manually.
- [ ] Check for NEW spec files upstream added (`git diff --stat <old-base>
      <new-base> -- e2e/`) and understand what they require (e.g.
      `examples-smoke.e2e.ts` enumerates `exampleRoutes` from `@zag-js/shared`).
- [ ] Run the FULL e2e suite for your framework against the final HEAD build,
      not an earlier one. Then re-run just-failed specs once to separate
      persistent failures from environment flake before triaging.

## 4. Release-pipeline safety (easy to miss, breaks after merge, not in CI)

- [ ] New package? Check `.changeset/config.json`:
      - `fixed: [["@zag-js/**"]]` means ANY matching non-private package gets
        version-bumped and PUBLISHED with every release. A package with
        `files: ["dist"]` and no working `build` script will publish EMPTY.
        Either give it a real build or mark it `private: true`.
      - Example apps must be in the `ignore` list (changesets errors when a
        non-ignored package depends on an ignored one, e.g. `@zag-js/shared`).
- [ ] Changed a published package's public API? Add a changeset
      (see `changelog-guide.md` for wording).
- [ ] New tooling that emits `package.json` files into the tree (e.g. Qwik's
      SSR build emits `server/package.json`)? Ensure build output can never be
      picked up by the `pnpm-workspace.yaml` globs, and is gitignored.
- [ ] Version fields of new packages should match the fixed-group version of
      their siblings.

## 5. Dependency hygiene

- [ ] Any dependency also used by workspace packages (e.g.
      `@internationalized/date`) must be pinned to the SAME version the
      packages use. Two installed copies silently break `instanceof` checks
      and produce nominal type clashes (`#private` member errors).
- [ ] Example tsconfig `lib`/`target` should match the other examples
      (machines use recent ES features like `findLast`).

## 6. Verify by probing, not by reading

- [ ] For any behavioral claim ("X works", "Y positions correctly"), verify in
      a real browser run, not by code inspection. Small Playwright probe
      scripts (element identity markers, `elementFromPoint`, style-attribute
      dumps, focus/mutation event logs) settle in minutes what speculation
      cannot.
- [ ] When a test fails only in one framework, run the SAME flow in the
      reference framework (react) and diff the observable state (geometry,
      attributes, timing). Playwright traces (`--trace on`) contain action
      logs and screenshots — read them instead of guessing.
- [ ] Before filing an upstream bug, reproduce it in ISOLATION (pure framework
      primitives, no adapter/library code) in both dev and production builds.

## 7. Shared-code change policy

- [ ] Changes to `e2e/` specs/models, machines, or utilities affect every
      framework. Each such change needs: an explicit justification, a run of
      the affected specs on react, and a callout in the PR body.
- [ ] Never weaken or skip an existing test to make a branch green. Additive
      regression tests are encouraged.

## 8. Repo & artifact hygiene

- [ ] `git status` clean; no scratch routes, probe scripts, debug
      `console.log`s (compare against the react example — some logs are
      intentional parity), or commented-out code in the diff.
- [ ] Docs that describe code (README/DESIGN) re-checked against the code
      after any refactor they describe.
- [ ] Auto-generated files touched by local servers (e.g.
      `examples/next-ts/next-env.d.ts`) reverted before committing.

## 9. Final gate

- [ ] Full-suite results reported honestly: passed / flaky / failed / skipped,
      with every persistent failure either fixed or root-caused and disclosed
      in the PR body as a known issue. "Green except X, because Y, tracked in
      Z" is acceptable; silent failure is not.

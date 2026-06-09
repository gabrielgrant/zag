# Qwik Conversion Notes

## Original Prompt

> using the pattern established by the existing qwik examples, implement each of the additional machine examples that
> exist in the other framework example dirs one-by-one, being sure to also match the patterns of those other framework's
> examples as much as is possible in qwik. try to do as much work in fresh subagents as possible, and commit (or have
> them commit) after each machine example is implemented correctly. add each qwik machine example to the test suite as
> you go, using the existing test suite to as a red/green TDD to guide your implementation. ensure you are following the
> existing repo patterns precisely

## Non-Negotiables

- The overarching goal is a high-quality Qwik adapter for Zag machines, not merely passing the current example tests.
  Example ports should expose adapter gaps, and fixes should preferentially improve the adapter or shared Qwik example
  infrastructure so they apply to existing machines and future machines defined by users.
- Implement missing Qwik examples one-by-one.
- Continue through the entire backlog in one uninterrupted run; do not pause after partial progress, and do not stop for
  a status update unless all backlog work is done or a real blocker requires user input.
- Match existing Qwik example patterns first, then mirror the peer framework example as closely as Qwik allows.
- Match the peer frameworks' abstraction level, not just their behavior. If React/Solid/Svelte/Nuxt use a shared helper
  such as `useControls`, `Toolbar`, shared data, or subcomponents, do not replace that with verbose route-local Qwik
  state unless Qwik constraints make the abstraction fail and the failure is documented.
- Do not change `packages/machines/**`.
- Do not change the shared e2e tests themselves.
- Use the existing tests as the source of truth and add each new Qwik route to the Qwik Playwright allowlist as needed.
- Commit after each example is implemented and verified correctly.
- Keep generated-file cleanup separate from example commits when it is unrelated to the example itself.
- If an example exposes behavior that appears to require Qwik adapter fixes or timing workarounds, record it in
  [ADAPTER_GAPS.md](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/ADAPTER_GAPS.md:1) with the
  specific example route, symptom, and why it appears adapter-related.
- Still complete the example route with a local workaround when feasible; the adapter gap should be tracked for later
  simplification/refactor, not treated as permission to leave the example unfinished.
- Do not add route-local workarounds that encode the current test data shape, fixed tree depth, specific labels, or
  other assumptions that would not generalize to arbitrary user-defined Zag machines. If the only working approach is
  test-shaped, stop and solve or document the adapter-level problem instead.
- Do not duplicate or partially reimplement a Zag machine in Qwik route code. The route should consume the machine API
  through the adapter; any local code should be ordinary presentation, framework wiring, or a clearly documented bridge
  that reveals an adapter gap.

## Repo-Specific Learnings

- Qwik examples are manually opted into Playwright via `qwikTestMatch` in
  [playwright.config.ts](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/playwright.config.ts:55).
- New machine examples usually need:
  - a new workspace dependency in
    [package.json](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/package.json:1)
  - the matching `pnpm-lock.yaml` update
  - root index wiring in
    [index.tsx](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/src/routes/index.tsx:1)
  - sidebar wiring in
    [layout.tsx](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/src/routes/layout.tsx:1)
  - a machine section index route plus one or more example routes under `src/routes/<machine>/...`
- Prefer targeted validation:
  - `pnpm --filter "./examples/qwik-ts" build.types`
  - `CI=1 PORT=<fresh-port> pnpm e2e-qwik -- e2e/<spec>.e2e.ts`
- `CI=1` is important for Qwik Playwright because otherwise the config may reuse an existing preview server and hit
  stale output.
- Adding a new Qwik machine dependency can cause Playwright runs to fail early with a frozen lockfile error. If that
  happens, refresh with:
  - `pnpm install --no-frozen-lockfile`
- Running monorepo install/build commands can regenerate committed artifacts outside Qwik example code.
- Per user policy, if those generated committed-file changes are caused by upstream drift rather than Qwik example
  edits, they may be committed separately without asking first.
- Many peer examples use `@zag-js/shared` control configs plus framework-local `useControls`/`Controls`/`Toolbar`
  helpers. Qwik now has the same abstraction in
  [use-controls.tsx](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/src/hooks/use-controls.tsx:1)
  and [toolbar.tsx](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/src/components/toolbar.tsx:1).
  Prefer this for examples backed by shared `*Controls` configs instead of creating local `useSignal` controls and
  hand-written `updateProps` blocks.
- Red flag: route-local parsing like `value === "" ? undefined : Number(value)`, repeated `formatOptions` rebuilding, or
  one signal per shared control usually means the Qwik route is below the abstraction level of the peer examples. Check
  whether `getTransformedControlValues`, shared `*Controls`, or an existing helper already handles it.
- Some Qwik-specific behavior can still require local state or workarounds. For example, `editable/basic` remains local
  because refactoring its controls through the generic store regressed its focus workaround. When this happens, keep the
  local code as narrow as possible and record the reason in
  [ADAPTER_GAPS.md](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/ADAPTER_GAPS.md:1).
- Recent cascade-select investigation showed a clear failure mode: bound Zag props can update existing DOM attributes
  while Qwik JSX derived from connected API state does not reliably rerender recursively after context-only machine
  changes. Avoid "fixes" such as pre-rendering a hard-coded tree depth or matching only the e2e data shape. The right
  direction is a reusable adapter/shared rendering strategy that lets Qwik components consume machine-derived state
  reliably for arbitrary machine examples.

## Example Patterns That Worked

- For examples with shared controls, use `const controls = useControls(fooControls)`, pass `...controls.context.value`
  into machine props, and pass `controls={controls}` plus
  `onControlsChange$={(context) => machine.controller.value.updateProps(context)}` to `Toolbar`. This mirrors the
  Solid/Svelte abstraction while accepting Qwik's need for an explicit prop update callback.
- For composite Qwik examples, connecting from the `machine` signal inside subcomponents has been more reliable than
  threading a shared `parts` object everywhere.
- The `navigation-menu/basic` route only passed the full suite after refactoring to use machine-driven `usePart$`
  bindings per subcomponent.
- For recursive/composite examples, first mirror the peer framework's recursive structure. If Qwik fails to rerender
  child branches that depend on connected API state, treat that as an adapter/runtime integration gap. Do not hide it by
  pre-rendering all possible branches or by baking in data-specific depth limits.
- Keep labels, item text, structure, and visible copy aligned with the peer examples whenever possible so the shared
  tests and expected behavior line up naturally.

## Already Implemented In This Worktree

- `menu/nested`
- `context-menu/multiple-trigger`
- `navigation-menu/basic`
- `avatar/basic`
- `clipboard/basic`

## Current Workflow

- Use [TODO.md](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/TODO.md:1) as the backlog.
- Check items off as each example lands.
- Keep unrelated leftover work out of the current example commit.
- Treat this as a single-turn end-to-end task: keep implementing examples until the backlog is complete or a critical
  blocker is encountered.
- Keep [ADAPTER_GAPS.md](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/ADAPTER_GAPS.md:1) updated
  whenever a route needs suspicious Qwik-specific behavior fixes.

## Per-Example Checklist

- [ ] Read the peer example route(s) in `next-ts`, `solid-ts`, and `svelte-ts` and note the shared structure, labels,
      text, and behavioral intent.
- [ ] Check whether the peer examples use shared `@zag-js/shared` controls or framework
      `useControls`/`Controls`/`Toolbar` abstractions. If they do, start from the Qwik `useControls`/`Toolbar`
      abstraction instead of writing route-local signals for every control.
- [ ] Read the existing e2e spec for that machine or route and treat it as the required behavior contract.
- [ ] Confirm the Qwik app already has the needed machine dependency in
      [package.json](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/package.json:1); add it if
      missing.
- [ ] Create the Qwik route files under `examples/qwik-ts/src/routes/<machine>/...` using the established Qwik example
      patterns.
- [ ] Mirror the peer framework example structure as closely as possible in Qwik without changing machine code.
- [ ] Confirm any local workaround is adapter-goal aligned: it must be reusable or at least illustrative of a general
      adapter issue, not tailored to the current e2e assertions, sample data, labels, or fixed tree depth.
- [ ] Before adding verbose local parsing, formatting, prop reconstruction, or one-off state synchronization, verify
      that the same complexity exists in the peer examples. If the peer examples are simpler, find the shared helper or
      abstraction that owns that behavior and use the Qwik equivalent where feasible.
- [ ] Add or update the machine section index route if the machine now has multiple Qwik examples.
- [ ] Wire the machine into the Qwik home index and sidebar if the machine is new to Qwik.
- [ ] Add the relevant e2e spec to `qwikTestMatch` in
      [playwright.config.ts](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/playwright.config.ts:55) if it is not
      already enabled for Qwik.
- [ ] Run `pnpm --filter "./examples/qwik-ts" build.types`.
- [ ] If a new dependency was added and Playwright hits a frozen-lockfile error, run `pnpm install --no-frozen-lockfile`
      and include the resulting `pnpm-lock.yaml` change with that example.
- [ ] Run the smallest relevant Qwik browser test on a fresh port with
      `CI=1 PORT=<fresh-port> pnpm e2e-qwik -- e2e/<spec>.e2e.ts`.
- [ ] If the example has no existing dedicated e2e route coverage, do at least a browser smoke check with Playwright
      against the new Qwik route and be explicit about the coverage gap.
- [ ] Compare the final Qwik route against the peer examples one last time for copy, structure, and visible behavior
      drift.
- [ ] Compare abstraction level one last time: the Qwik route should not have substantially more local control plumbing
      than the peer examples unless the extra Qwik-specific code is necessary, minimal, tested, and documented in
      [ADAPTER_GAPS.md](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/ADAPTER_GAPS.md:1).
- [ ] Sanity-check adapter direction before committing: if the change would not help a future user-defined Zag machine
      with similar interaction/rendering needs, reconsider whether it belongs in the adapter/example.
- [ ] Check the example off in [TODO.md](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/TODO.md:1).
- [ ] Commit only the files for that example plus its required dependency/allowlist updates.
- [ ] If unrelated generated committed-file drift appears for upstream reasons, keep it out of the example commit and
      handle it in a separate cleanup commit.
- [ ] If the example reveals behavior that only fails in Qwik or seems to need workaround code because of the adapter,
      add an entry to
      [ADAPTER_GAPS.md](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/ADAPTER_GAPS.md:1) before
      moving on.
- [ ] If you add a workaround to finish the example, note in
      [ADAPTER_GAPS.md](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/ADAPTER_GAPS.md:1) how an
      adapter change could make that example significantly simpler later.

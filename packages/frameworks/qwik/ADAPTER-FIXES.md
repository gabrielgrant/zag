# @zag-js/qwik adapter — fix workplan (issues found by @ark-ui/qwik port)

Base branch: the adapter branch this was cut from (see `git merge-base`).
Each issue below was discovered while porting all ~60 Ark UI components; the
full evidence trail (bisections, skipped-test files with repro notes) lives in
the ark repo: `packages/qwik/PLAN.md` Part 5 items #0–#0d on branch
`claude/busy-noether-lu8dvd`, and in the referenced `*.browser.test.tsx`
files' skip comments.

## Verification harness

- Unit-ish: ark's browser suite (`packages/qwik`, `vitest run --config
  vitest.browser.config.ts`) — re-enable the skipped tests listed per issue.
- Zag-native: `pnpm e2e-qwik` (playwright project `qwik` exists in
  `playwright.config.ts`, serving `examples/qwik-ts`). Before claiming a fix,
  add/confirm an e2e that exercises the failing path (see "why tests missed
  it" per issue).

## Issue 1 — root-level machine effects on idle machines (ark #0)

Symptom: a machine that starts and STAYS in its initial state never gets its
root-level effects wired. Concrete: tooltip's `trackFocusVisible` root effect
never runs, so keyboard-focus can never open a tooltip (Tab, `userEvent.tab()`
and programmatic `.focus()` all inert). Repro: ark
`packages/qwik/src/components/tooltip/tests/tooltip.browser.test.tsx` (skip
comment) + the standalone focus-visible repro described there. Also compounds
nested-menu reliability (`menu-root.tsx` comment).

Where to look: `src/machine.ts` — `self.start()` invokes
`state.invoke(state.get(), INIT_STATE)`, whose `onChange` path is expected to
run `machine.entry` + `machine.effects` when `prevState === INIT_STATE`.
Determine why the tooltip's root effect (registered via `machine.effects`? or
`watch`/`track`?) does not take effect for a closed-at-start machine: candidate
causes: (a) `start()` deferred to post-commit tick never firing until first
interaction on CSR-mounted-but-dormant components; (b) effects keyed by state
path so root effects attach but the *effect implementation* reads bindables
before hydration of `focus-visible` global listeners; (c) the effect runs in a
turn where `getRootNode` context isn't ready. Instrument with `machine.debug`.

Why zag tests missed it: check whether `e2e/tooltip.e2e.ts` asserts
focus-opens-tooltip for the qwik project, and whether `e2e-qwik` ran in the
branch's CI at all (`.github/workflows/quality.yml`).

## Issue 2 — capture-phase re-dispatch swallows clicks (ark #0b)

Symptom: real pointer click on an element whose ANCESTOR has `tabIndex` + an
`onFocus` handler calling `event.stopPropagation()` (tree-view items) is lost.
Bisected: raw div fine; zag-wired fine minus onFocus; with onFocus the click
never reaches the item handler. Repro: ark
`packages/qwik/src/components/tree-view/tests/*` comments (tests use native
`element.click()` as workaround). Related: contentEditable segments swallow
`.click()`-driven focus (`date-input` tests), and Playwright pointer clicks
stall entirely on drag-capable machines (drawer/floating-panel — ark #0d).

Where to look: `src/normalize-props.ts` `wrapHandler` — the
capture-phase→element re-attach (`addEventListener(..., {once:true})` + the
disarm `setTimeout`). Hypothesis: the intermediate focus event dispatched
between capture and target phases (focus fires synchronously on
pointerdown→focus sequence) causes the once-listener to be disarmed or the
event sequence to re-enter `wrapHandler` in a way that eats the click's
element-phase replay. Write a minimal two-element repro inside
`examples/qwik-ts` first.

## Issue 3 — rAF render-gate livelocks (ark #0c)

Symptom A: any toast Timer/`setRafTimeout` scheduling (auto-dismiss
`duration`, `removeDelay`) hangs the browser harness after an interaction.
Symptom B: tour livelocks as soon as any part subscribes to the shared api
store — bisected to tour's `trackBoundarySize` root effect
(resize-listener→context-write→re-render feedback).

Where to look: `src/machine.ts` `installRafRenderGate` — every rAF callback is
deferred behind `waitUntilRendered(container)`; a machine whose rAF callback
itself causes a render (context write) can create render→rAF→render cycles
that never drain, and rAF-based timers inherit the gate's latency/livelock.
Candidate fixes: gate only the FIRST rAF after a machine-initiated state
change instead of globally patching; or exempt callbacks scheduled via zag's
timer utilities; or replace the global patch with a per-machine post-commit
queue (the adapter already has a tick task).

Repros: ark `toast/tests/*.browser.test.tsx` + `tour/tests/tour.browser.test.tsx`
skip comments (each carries exact re-enable instructions).

## Suggested order

3 (rAF gate) → 1 (root effects) → 2 (dispatch) — issue 3 unblocks the most
skipped coverage and likely also explains part of the rotating
`insertBefore`-teardown flake noted in ark PLAN Part 5 #0d.

## Ground rules

- Every fix lands with (a) a zag-side test (e2e-qwik or adapter unit) and
  (b) the corresponding ark skipped-test re-enabled and green.
- Keep changes adapter-local (`packages/frameworks/qwik/src/*`); no machine
  (packages/machines/*) edits without a separate discussion.

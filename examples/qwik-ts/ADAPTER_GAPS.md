# Qwik Adapter Gaps

Track cases where a Qwik example exposes behavior that appears it would benefit from adapter improvements rather than
just example-level wiring.

## Open

- `cascade-select/basic`
  - Symptom: existing DOM parts bound by the Qwik adapter can update after a cascade item event, but recursive JSX that
    derives child-list rendering from `cascadeSelect.connect(...).getItemState(...)` does not reliably rerender for the
    newly highlighted branch.
  - Finding: temporary browser instrumentation showed root, first-level, and second-level items all shared the same
    `QwikMachine` runtime and that the machine snapshot advanced from `["africa"]` to `["africa", "algeria"]`.
    Additional counters showed bound event completion requested and executed revision commits after the second-level
    pointer update, while the recursive JSX and visualizer still rendered the previous highlighted value.
  - Finding: later instrumentation showed `useApi$((api) => api.highlightedValue, parts)` computed the fresh
    `["africa", "algeria"]` value after the second-level click, while the `<pre>` and recursive JSX still displayed
    `["africa"]`. This means the adapter can read fresh connected API state and can refresh bound DOM attributes, but
    Qwik is not repainting JSX consumers from this external machine-update path.
  - Tried and rejected: delaying the second click after the first branch rendered, moving the Qwik commit work from
    `requestAnimationFrame` to `setTimeout`, routing commits through a Qwik `useOnDocument` custom-event bridge,
    returning store-backed `useApi$` signal shapes, moving recursive `getItemState(...)` into component-local `useApi$`,
    and deriving `useApi$` from `useComputed$`. These either did not repaint the second branch or regressed first-branch
    rendering.
  - Finding: during investigation, approaches that pre-rendered a fixed tree depth or encoded the sample data shape could
    make specific tests progress, but those approaches are not acceptable because they do not help arbitrary future Zag
    machines or user-defined cascade data.
  - Adapter direction: the adapter needs a general way for machine events handled through bound DOM props to invalidate
    Qwik component consumers of connected API state, including recursive/composite components that render new parts from
    context-only machine changes. This should be solved in adapter/runtime integration or shared Qwik example
    infrastructure, not by route-local tree-depth assumptions.
  - Status: open adapter investigation. Keep the Qwik route close to the peer recursive example while this is being
    resolved.

- `cascade-select/basic`
  - Symptom: when `allowParentSelection` is enabled, selecting a branch item keeps the cascade popup open by design.
    Because the Qwik example currently renders the positioner inline instead of through a Portal like the React/Solid
    examples, the open popup can overlap the clear trigger and intercept pointer clicks.
  - Finding: the machine intentionally does not close on branch selection; `closeOnSelect` only closes when the selected
    node is not a branch. The Qwik route now keeps the clear trigger stacked above the inline positioner so it remains
    clickable while the popup is open.
  - Why this looks adapter/example-infrastructure related: React and Solid use framework Portal helpers for the popup
    layer. Qwik examples do not currently have a shared Portal/layer helper, so popup examples may need local stacking
    compensation until that abstraction exists.
  - Current example workaround:
    [cascade-select/basic/index.tsx](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/src/routes/cascade-select/basic/index.tsx:1)
    adds a minimal `position: relative; z-index: 1` merge to the clear trigger.
  - Status: open Qwik example infrastructure follow-up; a shared Portal/layer helper would make this example closer to
    the peer framework implementations.

- `cascade-select/basic`
  - Symptom: clicking the clear trigger after selecting a branch item calls the Zag handler and `onValueChange` reports
    an empty value, but Qwik does not rerender JSX that reads the connected API value.
  - Finding: temporary instrumentation showed the Qwik adapter's event callback requested and executed render commits
    after clear, and a Qwik `useOnDocument` listener for a custom adapter event also ran, but the rendered route stayed
    subscribed to the pre-clear revision. This appears specific to the native Zag clear event path, not to the machine
    state update itself.
  - Status: open adapter follow-up. Do not patch this with a route-local render tick unless the adapter-level path has
    been exhausted and the workaround is explicitly documented as temporary.

- `editable/basic`
  - Symptom: focusing the preview should enter edit mode and move focus into the input.
  - Finding: in the initial Qwik render, the preview was not focusable because it lacked the expected `tabindex`, so
    Playwright `.focus()` left `document.activeElement` on `BODY` and the edit flow never started.
  - Why this looks adapter-related: the machine’s `getPreviewProps()` includes `tabIndex: interactive ? 0 : undefined`,
    and the same machine behavior works in the other framework examples without route-level compensation.
  - Current example workaround:
    [editable/basic/index.tsx](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/src/routes/editable/basic/index.tsx:1)
    explicitly reinforces preview `tabIndex` and uses a narrow Qwik `onFocus$` bridge for focus activation. The previous
    rAF polling watcher and repeated click/double-click/edit-button focus assists were removed after adding a generic
    Qwik/Zag settled navigation helper for Playwright.
  - Shared controls follow-up: unlike most existing controlled examples, `editable/basic` still keeps its controls
    local. A direct refactor to the generic Qwik `useControls` store made the preview enter edit mode without reliably
    transferring focus into the input in the shared Playwright suite, so this example needs either a cleaner
    adapter-level focusability fix or a more robust Qwik controls-store pattern before it should be converted.
  - Status: open adapter follow-up; the Qwik adapter should preserve this initial focusability without requiring
    example-level reinforcement.

## Addressed During Conversion

- `number-input/basic`
  - Symptom: the shared number input suite expects native editable input behavior for typing, invalid-character
    filtering, selection replacement, keyboard stepping, blur formatting, and long-press spinning.
  - Finding: the initial route-level workaround duplicated too much machine behavior. The underlying Qwik adapter issue
    was that `normalizeProps` mapped `defaultValue` to `value`, making the machine's uncontrolled input props behave as
    controlled props during typing. Preserving `defaultValue` exposed a second sync edge: non-input machine updates
    still need to write the current DOM value, while input events should not immediately clobber the user's active text.
  - Adapter cleanup: `normalizeProps` now preserves `defaultValue`, and `bindProps` keeps stable event wrappers when a
    part is rebound. Bound inputs preserve the user's active value through machine-driven rAF syncs, clear that
    preservation on blur/pointer interactions, and replay only the first genuinely missed active input event. The part
    hooks also render bound inputs as read-only until client binding attaches, drop `defaultValue` from live JSX props
    after binding, and perform a post-commit binding refresh so sibling parts don't stay stale.
  - Current example status:
    [number-input/basic/index.tsx](/home/gabriel/repos/zag.worktrees/qwik-adapter-v2/examples/qwik-ts/src/routes/number-input/basic/index.tsx:1)
    is a normal connected Zag implementation and no longer reimplements filtering, formatting, stepping, or long-press
    logic locally.

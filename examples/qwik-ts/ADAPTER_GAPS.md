# Qwik Adapter Gaps

Track cases where a Qwik example exposes behavior that appears it would benefit from adapter improvements rather than
just example-level wiring.

## Open

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

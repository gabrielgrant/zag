# Qwik QRL Dispatcher Refactor Notes

This note captures a future adapter refactor idea explored while debugging Qwik example timing and focus workarounds. It
is written for someone with no prior context. The current recommendation is **do not change the adapter as part of
example conversion work**. Treat this as a dedicated adapter investigation if the current native-listener model keeps
creating Qwik-only timing/focus workarounds.

## Current Adapter Model

The Qwik adapter intentionally does not spread Zag event handlers into JSX.

Zag `connect()` functions return plain DOM-style prop objects. A part prop object can contain static attributes like
`id`, `role`, `aria-*`, `data-*`, `hidden`, `tabIndex`, and event handlers like `onClick`, `onFocus`, `onPointerDown`,
or `onKeyDown`. Those handlers are plain runtime functions that close over the live Zag service/controller. They are not
Qwik QRLs.

Current Qwik adapter flow:

1. `useMachine$()` creates a serializer-backed `QwikMachine`.
2. `useConnectedParts$()` reconnects a live Zag API from a QRL after Qwik resumes.
3. `bindPart$()` evaluates the part props and returns JSX-safe static props plus a `ref`.
4. `bindProps()` attaches generated function props with native `node.addEventListener(...)` in a `useVisibleTask$`.
5. `QwikMachine.refreshBindings()` mirrors current static attributes and DOM properties onto bound nodes before and
   after machine-driven rAF commits.

The current design is documented in `packages/frameworks/qwik/README.md`. The key sentence is:

> Function props are removed from the JSX spread because Qwik would otherwise attach them through its asynchronous event
> QRL edge.

This is deliberate. Some Zag handlers must be able to call `event.preventDefault()`, move focus, select text, measure
DOM, or update state in the same browser event turn. Letting those handlers fall through Qwik's lazy async event edge
can be too late.

## Why This Became Relevant

While porting Qwik examples, `editable/basic` required route-level focus workarounds. The machine's `getPreviewProps()`
supplies `tabIndex` and focus/click/double-click handlers. Other framework examples can use those props directly. In
Qwik, the preview can exist in the DOM before adapter binding has completed, so Playwright can focus or click during a
narrow first-interaction window where the bound Zag behavior is not ready yet.

This is not classic Qwik hydration. Qwik's own model serializes QRL event listener references into HTML so the
Qwikloader can catch events immediately and lazy-load handlers. The problem is that the Zag adapter is not currently
using Qwik's serialized event path for Zag machine handlers. It attaches native handlers later, after client-side
`document-ready` work.

The near-term plan is to keep the current adapter and add a generic Zag/Qwik settledness helper for Playwright. This
note records a possible longer-term adapter refactor that may reduce the need for such test waiting and route-level
workarounds.

## The Proposed QRL Dispatcher Idea

The idea is **not** to make each dynamic Zag handler itself a QRL. Zag handlers are generated at runtime by `connect()`,
so they are not individually known to the Qwik optimizer.

Instead, use Qwik-compiled dispatcher QRLs. The dispatcher would be a small stable QRL created by the adapter. It would
rebuild or read current Zag part props, find the relevant generated handler, and invoke that handler.

Conceptually:

```tsx
const clickDispatcher = $((event: MouseEvent, element: HTMLElement) => {
  const apiFactory = getApi.resolved
  const propsFactory = getProps.resolved
  if (!apiFactory || !propsFactory) return

  const api = apiFactory()
  const props = propsFactory(api)
  const handler = props.onClick
  handler?.(event)
})

useVisibleTask$(async () => {
  await Promise.all([getApi.resolve(), getProps.resolve(), clickDispatcher.resolve()])
})

return <button ref={ref} {...staticProps} onClick$={clickDispatcher} />
```

The real implementation would need to preserve the current adapter's event name normalization, input preservation, DOM
prop refresh, cleanup semantics, and support for many event names.

## Design Hierarchy

The ideal adapter model, without major Zag core refactoring, would be to bind the generated Zag handlers directly into
the DOM through Qwik's own synchronous event path. In other words, the adapter would keep Zag's existing `connect()`
API, take the plain runtime handler returned by a part prop getter, and attach it with the same synchronous semantics
Qwik's `sync$()` helper is designed to provide.

That ideal is currently blocked by Qwik's serialization model. `sync$()` cannot freely close over live non-serializable
runtime objects such as the Zag controller/service/API. Those live references are exactly what generated Zag handlers
need in order to perform synchronous machine transitions, focus movement, selection, `preventDefault()`, and DOM
measurement.

The options therefore rank roughly like this:

1. Ideal, but not currently available: Qwik-supported sync DOM binding for runtime handlers that can close over live
   non-serializable Zag controller state.
2. Possible, but more complex: pre-resolved QRL dispatchers that recreate or reach the current Zag handler and call it
   synchronously after preload.
3. Current pragmatic model: adapter-managed native `addEventListener` bindings plus explicit static prop refresh.
4. Larger architectural option: add a Qwik-oriented Zag core API that separates serializable event descriptors from
   runtime effects. This may be cleaner long-term, but it is a much larger cross-framework/core design change.

This hierarchy is why the QRL dispatcher is only a future experiment, not the current recommendation. It is a possible
way to move closer to Qwik's event model, but it is not as simple or direct as the unavailable ideal sync-binding model.

## Why It Might Work

Qwik QRLs support eager resolution:

- Calling `qrl.resolve()` loads the referenced function.
- Once resolved, Qwik stores the function on `qrl.resolved`.
- Future event calls can use the resolved value synchronously.

This exact pattern was suggested in a Qwik/Zag discussion comment:

- `https://github.com/chakra-ui/zag/discussions/392#discussioncomment-10624219`

Relevant idea from that comment, paraphrased:

- If handlers need to be synchronous, preload their QRLs in a visible task with `handler.resolve()`.
- After that, Qwikloader can call those handlers synchronously on events.
- The cost is waking the Qwik container early.

This matches Qwik's public QRL model. Qwik documents that `QRL.resolve()` returns the underlying value and that
`QRL.resolved` provides synchronous access after loading.

## Potential Advantages

- Events would flow through Qwik's intended event system instead of per-element native `addEventListener`.
- Qwikloader would know about the event handlers from rendered Qwik event props.
- A preloaded dispatcher could run synchronously after page load while still being Qwik-serializable.
- Initial test/user timing might improve because event ownership moves closer to Qwik's resumability model.
- The adapter might need less custom native event listener bookkeeping.
- Playwright could interact with Qwik examples more like a real page after the generic adapter-settled point.

These advantages are real but targeted. This refactor would not eliminate the need for bound refs, static DOM prop
syncing, post-machine-update refreshes, input value preservation, or careful focus/measurement ordering.

## Major Risks

- `preventDefault()` timing can regress if a dispatcher event fires before its QRLs are pre-resolved.
- Focus-sensitive machines can regress if static prop syncing does not happen before machine actions like `focusInput`.
- Input-heavy machines can regress if the current active-input preservation behavior in `bindProps()` is not preserved.
- Qwik event names differ from Zag's normalized DOM handler names. The dispatcher layer must be exact for events like
  `focusin`, `focusout`, `dblclick`, `pointerdown`, `keydown`, `input`, and `beforeinput`.
- Rebuilding current props inside the dispatcher could be expensive or could accidentally capture stale controller/api
  state if the QRL boundaries are wrong.
- A dispatcher fallback that silently no-ops before preload could hide real bugs. A fallback that awaits preload could
  reintroduce the original async-event problem.
- This wakes the Qwik container early, reducing some resumability/lazy-loading benefits.

## What Not To Repeat

Do not revive the old runtime symbol registration approach.

Historical commits:

- `84a8eca99 build(qwik): use qwik optimizer output`
- `4968df2e7 refactor(qwik): remove runtime symbol registration`

The removed file registered Qwik internal symbols such as `_run`, `_task`, `_res`, and `_val` via
`@qwik.dev/core/internal` / `_regSymbol`. That was a brittle internal-runtime workaround and was later deleted. A future
dispatcher experiment should use normal Qwik `$()` / QRL compilation so the Qwik optimizer owns symbols and chunks.

## Likely Implementation Shape

Start with an additive prototype, not a full rewrite.

Possible shape:

1. Add an experimental helper behind a private/internal export or branch-only code path.
2. Keep the existing `bindPart$()` public API so examples do not change.
3. Continue returning static props from `bindPart$()`.
4. Add Qwik event QRL props for events detected in the initial/bound prop set.
5. Pre-resolve `getApi`, `getProps`, and dispatcher QRLs in the same `document-ready` visible task that currently binds
   native listeners.
6. In the dispatcher, synchronously call `getApi.resolved`, `getProps.resolved`, then the current Zag handler.
7. Preserve the current `bindProps()` static sync path at first. Do not try to solve static DOM prop sync and event
   dispatch in the same change.
8. Keep native listener binding available as a fallback until the dispatcher passes the interaction-heavy tests.

The first useful prototype could target one or two events (`click` and `focusin`) and one route (`editable/basic`) to
prove whether route-level focus workarounds can be reduced without regressing other machines.

## Required Validation

Before adopting this refactor, run adapter unit tests and Qwik browser tests that exercise sync event semantics.

Minimum adapter/unit coverage to add or preserve:

- Dispatchers invoke handlers synchronously after `resolve()`.
- Dispatchers fail loudly or fall back deliberately when invoked before preload.
- `preventDefault()` is observable by the browser event in the same event turn.
- Static props still refresh before machine-scheduled focus/measurement work.
- Active input text and selection preservation still works through `input`, `beforeinput`, `keydown`, blur/focusout, and
  non-input events.
- Event cleanup does not leak old handlers after rerenders or part changes.

Minimum Qwik e2e coverage:

- `editable.e2e.ts`, especially focus-to-edit and input focus transfer.
- `number-input.e2e.ts`, especially typing, selection replacement, invalid character filtering, blur formatting, and
  long-press stepping.
- `menu.e2e.ts`, especially first open, keyboard navigation, outside interaction, and focus restoration.
- `context-menu.e2e.ts`, because pointer/default-prevention semantics matter.
- `password-input.e2e.ts`, `pin-input.e2e.ts`, and `tabs.e2e.ts` if the prototype touches input/key/focus event paths.

## Current Recommendation

Do not pursue this refactor while porting examples. The current native-listener model is explicit and has already been
hardened through several fixes:

- `176359a3a fix(qwik): restore focus after machine updates`
- `7486aeb8c fix(qwik): refresh bound props after machine updates`
- `b4c0f640c fix(qwik): refresh bindings before frame effects`
- `30d6b4d20 fix(qwik): stabilize bound input updates`

For now, keep the current adapter model and add a generic Zag/Qwik settledness helper for Playwright. Revisit the QRL
dispatcher only as a dedicated adapter experiment if the native-listener model continues to require broad Qwik-only
example workarounds.

## References

- Current Qwik adapter README: `packages/frameworks/qwik/README.md`
- Current adapter implementation: `packages/frameworks/qwik/src/machine.ts`
- Native binding implementation: `packages/frameworks/qwik/src/bind-props.ts`
- Event normalization: `packages/frameworks/qwik/src/normalize-props.ts`
- Qwik adapter gaps discovered during example conversion: `examples/qwik-ts/ADAPTER_GAPS.md`
- Editable workaround route: `examples/qwik-ts/src/routes/editable/basic/index.tsx`
- Qwik QRL API docs: `https://qwik.dev/docs/advanced/qrl/`
- Qwikloader docs: `https://qwik.dev/docs/advanced/qwikloader/`
- Qwik containers/resumability docs: `https://qwik.dev/docs/advanced/containers/`
- Qwik visible task docs: `https://qwik.dev/docs/core/tasks/`
- Qwik Playwright docs: `https://qwik.dev/docs/integrations/playwright/`
- Qwik/Zag discussion comment about pre-resolving QRL handlers:
  `https://github.com/chakra-ui/zag/discussions/392#discussioncomment-10624219`

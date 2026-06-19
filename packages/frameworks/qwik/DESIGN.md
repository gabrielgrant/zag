# `@zag-js/qwik` — design & internals

This document describes how the adapter works for people maintaining it. It is
descriptive: it explains what the code does and why each mechanism exists, not
what alternatives were considered.

## The problem it solves

Zag's machine runtime is written for frameworks whose component bodies
re-execute on update (React/Solid/Svelte/Vue all have an adapter built on that
assumption). Qwik is different in two ways that matter here:

1. **Resumability, not hydration.** After SSR, a `component$` body does **not**
   re-execute on the client until something it subscribes to changes. Event
   handlers are not serialized into the HTML, so a freshly-resumed machine has no
   live handlers and has not "started".
2. **No synchronous `flushSync`.** Qwik commits renders on its own async
   scheduler. There is no public API to force a synchronous DOM commit.

The adapter bridges these while keeping the public API identical to the other
adapters (`useMachine(machine, props)` → `Service`, plus `normalizeProps` /
`mergeProps`).

## Three persistence tiers

`useMachine` keeps its state in three places with different lifetimes:

| Tier                       | Primitive                                  | Survives SSR→resume? | Holds                                                                 |
| -------------------------- | ------------------------------------------ | -------------------- | -------------------------------------------------------------------- |
| Reactive data              | `useSignal` (per bindable, + 3 control sigs)| **Yes** (Qwik serializes signals) | machine state value, context values, `activated`/`tick` flags |
| Non-serializable internals | `useSignal<NoSerialize<MachineInternals>>` | No — rebuilt on first client execution | effects map, event/transition refs, status, slot storage, queues, `start`/`stop` |
| Per-render closures        | plain `const`s each execution              | n/a                  | `send`, `action`, `guard`, `effect`, `choose`, `computed`, returned `Service` |

`MachineInternals` (see `machine.ts`) is held in a `NoSerialize` signal: it
persists across client re-renders, is dropped during SSR serialization, and is
lazily recreated the first time the body runs on the client. All *data* lives in
plain signals so it resumes natively.

## Hook discipline

Every `use*` call runs **unconditionally and in the same order** on every
execution (SSR, resume, re-render): the three machine-level signals
(`internalsSig`, `activatedSig`, `tickSig`), the two `useVisibleTask$`s, and one
`useSignal` per bindable created inside `machine.context()`. Machines declare a
fixed set of bindables, so Qwik's sequential-scope indices stay aligned across
SSR/resume/re-render. The `activatedSig.value` read near the top of the body is
deliberately unconditional — it subscribes the component to that signal so that
flipping it on the client re-executes the body.

## SSR → resume → wake lifecycle

1. **SSR.** The body executes. `normalizeProps` sees `isServer` and, instead of
   serializing the (non-serializable) machine handlers, emits a single shared
   **wake QRL** as the handler for every Zag event prop. The wake QRL is
   published for that render frame through the module-level slot in
   `wake-context.ts` (`useMachine` and the JSX that calls `connect()` run in the
   same synchronous render frame, so the slot is safe even under interleaved
   streaming SSR). qwikloader records which event types exist so it can capture
   them later.
2. **Resume.** No client code runs yet. Signals (state, context) are restored.
3. **Wake.** The first `useVisibleTask$` (strategy `document-ready`) is the eager
   wake:
   - **CSR mount** (e.g. SPA navigation): the body already ran this client
     session, `internalsSig.value` exists, so it calls `start()` directly.
   - **Resumed SSR**: internals do not exist yet, so it flips `activatedSig`.
     That re-executes the body, which rebuilds internals, attaches live handlers
     (client branch of `normalizeProps`), and schedules `start()` post-commit.
   - `cleanup()` stops the machine.

### Pre-wake interactions

If the user interacts before the wake task runs, qwikloader invokes the
serialized wake QRL. Each invocation enqueues the captured event into the FIFO in
`wake-replay.ts` (`enqueueReplay`). The drain:

- activates the component (flips `activatedSig`),
- waits for the activation render to commit (`waitUntilRendered`, retried until
  the live internals/handlers exist),
- calls `start()`,
- dispatches the captured event into the live handler registered on the element
  (`element._qDispatch[e:<type>]`).

Independent wake-QRL invocations would otherwise race (a `keydown` could reach
the machine before the `focus` that must precede it). The single FIFO guarantees
strict DOM order: each task fully completes before the next begins. A second race
— the "overtake", where the eager wake finishes mid-sequence and a now-live
handler runs inline ahead of a still-queued earlier event — is closed by
`isReplayDraining()`: while the queue is draining, live handlers in
`normalizeProps` defer themselves through `enqueueDeferred` instead of running
inline.

The first pre-wake event cannot call `preventDefault()` synchronously because the
QRL chunk loads asynchronously; this is the documented wake-gap limitation.

## `send` — synchronous with a re-entrancy queue

`send` (in `machine.ts`) processes transitions **synchronously** so that state
changes reach Qwik's scheduler inside the DOM event handler and conditional
`preventDefault()` works. Two guards wrap it:

- **Re-entrancy queue (`processing` / `sendQueue`).** A transition's action may
  move DOM focus, which fires a synchronous `focusin` whose handler calls `send`
  again. Running that inline would overwrite `eventRef`/`transitionRef`
  mid-sequence, so a re-entrant `send` is queued and drained after the current
  one finishes.
- **Pending-events buffer (`pendingEvents`).** Live handlers attach when the
  client render commits, but the machine `start()`s one task later. Events that
  arrive in that gap are buffered (capped at 64) and replayed by `start()`.

`processEvent` re-resolves `propsRef` at the event boundary (`computeProps()`),
so when `userProps` is a function it reads live values rather than the last
render's snapshot — important because Qwik may not have re-rendered yet after a
prop-source change.

## Post-commit scheduling (`track` / `watch` / start)

There is no synchronous flush, so anything that needs the committed DOM goes
through `internals.postRenderQueue`, drained by the second `useVisibleTask$`
(the "tick task"), which tracks `tickSig`. Visible tasks run after Qwik's DOM
journal flush, so the queue runs against committed DOM. Producers:

- machine `start()` on resume (pushed during the body, bumps `tickSig`),
- `machine.watch`'s `track(deps, fn)`: render-phase slot-index diffing of deps;
  changed callbacks are pushed to the queue and `tickSig` is bumped.

## `normalizeProps`

`createNormalizer` produces the prop map:

- **Server:** function-valued event props are replaced by the shared wake QRL;
  all non-event attributes (aria/data/id/style) are emitted so SSR HTML is
  correct.
- **Client:** event props become Qwik `$`-suffixed props holding the wrapped
  plain function. Qwik registers plain functions on `element._qDispatch` and
  invokes them synchronously, preserving same-turn `preventDefault()`.
- **Event names** (Qwik has no synthetic events): `onChange→onInput`,
  `onFocus→onFocusIn`, `onBlur→onFocusOut`, `onDoubleClick→onDblClick`.
- **Attribute names:** `className→class`, `htmlFor` kept, `defaultValue→value`,
  `defaultChecked→checked`; everything else is lowercased (except an
  SVG/React-ism allowlist), because Qwik diffs against attribute keys read back
  from the SSR DOM, which are lowercase.
- **`style`** is emitted as a stable string, not an object: Zag's popper writes
  CSS custom properties (`--x`, `--y`) straight onto the node, and a fresh style
  object each render would diff as changed and wipe them. An identical string
  diffs as unchanged.

### Handler wrapping (`wrapHandler`)

Qwik dispatches events from a **document-level capture listener**, so
`event.currentTarget` is the document, not the element, and handlers would run
before Zag's own document-capture utilities (escape trackers, dismissable
layers). The wrapper:

1. If a replay is draining, defers via `enqueueDeferred` (see overtake above).
2. If the event is in the capturing phase on a bubbling event and
   `currentTarget` ≠ the element, re-attaches a one-shot listener on the element
   so the handler runs in its native target/bubble slot (still synchronous, so
   `preventDefault` works and a handler's `stopPropagation` no longer starves
   Zag's document-capture listeners). The disarm uses `setTimeout` (a macrotask)
   because microtask checkpoints run between listener invocations of the same
   dispatch.
3. Otherwise invokes directly (non-bubbling events, at-target/bubble dispatches,
   and finished wake-replayed events), pointing `currentTarget` at the element.

## `useBindable`

Each bindable is backed by one `useSignal` (plus a never-written `initialSig`),
so its value serializes on SSR and resumes for free, and render-phase reads
register Qwik's fine-grained subscriptions. Controlled mode reads `props().value`
directly; uncontrolled mode reads/writes the signal. Writes fire `onChange`
guarded by `isEqual`. Values pass through the value-serializer registry on write
(`encodeValue`) and decode on read (`decodeValue`). The `sync` flag is a no-op
(no public `flushSync`; signals are synchronously consistent).

## Value-serializer registry (`value-serializer.ts`)

A module-level registry of `{ id, match, encode, decode }` codecs. `encodeValue`
walks arrays and replaces any matched value with `{ __zag_encoded__: id, d }`;
`decodeValue` reverses it. Registration is global because the registry is
consulted by every machine on the page; app code registers codecs (as a
side-effecting import) before rendering. A decode with no matching id warns and
returns the value unchanged.

## rAF render gate (`installRafRenderGate`)

Zag machines do post-render DOM work (focus, measurement) inside
`requestAnimationFrame`, assuming the framework committed the current render by
the next frame (React guarantees this via `flushSync`). Qwik commits on its async
scheduler, so a machine's rAF can fire ~1 frame before the DOM reflects the
latest state. Qwik does **not** use rAF to render, so the adapter patches the
global `requestAnimationFrame` once: while a container render is in flight
(`$renderPromise$` set) the callback waits it out (`waitUntilRendered`);
otherwise it runs inline, adding no overhead to the common case.

## Internal Qwik APIs

`qwik-internal.ts` imports two symbols that `@qwik.dev/core` exports at runtime
but omits from its public type surface:

- `getDomContainer(el)` — resolves the Qwik container for an element.
- `_waitUntilRendered(container)` — resolves the container's render promise.

Both are used only by the wake/replay and rAF-gate machinery, never exposed to
users.

## File map

| File                  | Responsibility                                                        |
| --------------------- | --------------------------------------------------------------------- |
| `machine.ts`          | `useMachine`, internals, send/process, lifecycle tasks, rAF gate.     |
| `bindable.ts`         | `useBindable` — signal-backed `Bindable` with serializer encode/decode.|
| `normalize-props.ts`  | `normalizeProps` — name/event mapping, SSR strip, handler wrapping.    |
| `wake-context.ts`     | Module slot publishing the SSR wake QRL to `normalizeProps`.           |
| `wake-replay.ts`      | FIFO drain ordering pre-wake event replay + live-handler deferral.     |
| `value-serializer.ts` | Registry + encode/decode for non-serializable context values.         |
| `refs.ts`             | Plain-object `BindableRefs`.                                           |
| `qwik-internal.ts`    | Typed wrappers over the runtime-only Qwik internals.                   |
| `index.ts`            | Public exports.                                                        |

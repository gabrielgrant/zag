# `@zag-js/qwik` — design & internals

This document describes how the adapter works for people maintaining it. It is descriptive: it explains what the code
does and why each mechanism exists, not what alternatives were considered.

## The problem it solves

Zag's machine runtime is written for frameworks whose component bodies re-execute on update (React/Solid/Svelte/Vue all
have an adapter built on that assumption). Qwik is different in two ways that matter here:

1. **Resumability, not hydration.** After SSR, a `component$` body does **not** re-execute on the client until something
   it subscribes to changes. Event handlers are not serialized into the HTML, so a freshly-resumed machine has no live
   handlers and has not "started".
2. **No synchronous `flushSync`.** Qwik commits renders on its own async scheduler. There is no public API to force a
   synchronous DOM commit.

The adapter bridges these while keeping the public API identical to the other adapters (`useMachine(machine, props)` →
`Service`, plus `normalizeProps` / `mergeProps`).

## Three persistence tiers

`useMachine` keeps its state in three places with different lifetimes:

| Tier                       | Primitive                                    | Survives SSR→resume?                   | Holds                                                                            |
| -------------------------- | -------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| Reactive data              | `useSignal` (per bindable, + 3 control sigs) | **Yes** (Qwik serializes signals)      | machine state value, context values, `activated`/`tick` flags                    |
| Non-serializable internals | `useSignal<NoSerialize<MachineInternals>>`   | No — rebuilt on first client execution | effects map, event/transition refs, status, slot storage, queues, `start`/`stop` |
| Per-render closures        | plain `const`s each execution                | n/a                                    | `send`, `action`, `guard`, `effect`, `choose`, `computed`, returned `Service`    |

`MachineInternals` (see `machine.ts`) is held in a `NoSerialize` signal: it persists across client re-renders, is
dropped during SSR serialization, and is lazily recreated the first time the body runs on the client. All _data_ lives
in plain signals so it resumes natively.

## Hook discipline

Every `use*` call runs **unconditionally and in the same order** on every execution (SSR, resume, re-render): the three
machine-level signals (`internalsSig`, `activatedSig`, `tickSig`), the two `useVisibleTask$`s, and one `useSignal` per
bindable created inside `machine.context()`. Machines declare a fixed set of bindables, so Qwik's sequential-scope
indices stay aligned across SSR/resume/re-render. The `activatedSig.value` read near the top of the body is deliberately
unconditional — it subscribes the component to that signal so that flipping it on the client re-executes the body.

## SSR → resume → wake lifecycle

1. **SSR.** The body executes. `normalizeProps` sees `isServer` and, instead of serializing the (non-serializable)
   machine handlers, emits a single shared **wake QRL** as the handler for every Zag event prop. The wake QRL is
   published for that render frame through the module-level slot in `wake-context.ts` (`useMachine` and the JSX that
   calls `connect()` run in the same synchronous render frame, so the slot is safe even under interleaved streaming
   SSR). qwikloader records which event types exist so it can capture them later.
2. **Resume.** No client code runs yet. Signals (state, context) are restored.
3. **Wake.** The first `useVisibleTask$` (strategy `document-ready`) is the eager wake:
   - **CSR mount** (e.g. SPA navigation): the body already ran this client session, `internalsSig.value` exists, so it
     calls `start()` directly.
   - **Resumed SSR**: internals do not exist yet, so it flips `activatedSig`. That re-executes the body, which rebuilds
     internals, attaches live handlers (client branch of `normalizeProps`), and schedules `start()` post-commit.
   - `cleanup()` stops the machine.

### Pre-wake interactions

If the user interacts before the wake task runs, qwikloader invokes the serialized wake QRL. Each invocation enqueues
the captured event into the FIFO in `wake-replay.ts` (`enqueueReplay`). The drain:

- activates the component (flips `activatedSig`),
- waits for the activation render to commit (`waitUntilRendered`, retried until the live internals/handlers exist),
- calls `start()`,
- dispatches the captured event into the live handler registered on the element (`element._qDispatch[e:<type>]`).

Independent wake-QRL invocations would otherwise race (a `keydown` could reach the machine before the `focus` that must
precede it). The single FIFO guarantees strict DOM order: each task fully completes before the next begins. A second
race — the "overtake", where the eager wake finishes mid-sequence and a now-live handler runs inline ahead of a
still-queued earlier event — is closed by `isReplayDraining()`: while the queue is draining, live handlers in
`normalizeProps` defer themselves through `enqueueDeferred` instead of running inline.

The first pre-wake event cannot call `preventDefault()` synchronously because the QRL chunk loads asynchronously; this
is the documented wake-gap limitation. A visible consequence: Enter on a `<button>` trigger fires the browser's `click`
too, which zag's keydown handler would normally cancel, so a pre-wake Enter can toggle a select open and shut. A second
known gap: a pre-wake event whose wake QRL is still loading can be overtaken by a later event that reaches a live
handler (which buffers it until `start()`).

`ready.ts` counts wakes in flight (activation requested or start scheduled, until `start()` or `stop()`), and
`whenMachinesStarted()` resolves once all have started. The example calls it from its layout before setting
`html[data-ready]`, which the e2e fixture waits for — matching the other examples, where effects (and so machine start)
have run by the time the ready marker is set.

## `send` — synchronous with a re-entrancy queue

`send` (in `machine.ts`) processes transitions **synchronously** so that state changes reach Qwik's scheduler inside the
DOM event handler and conditional `preventDefault()` works. These guards wrap it:

- **Handler batching (`event-batch.ts`).** zag's handlers are written against React's deferred `send`: code after a
  `send` in the same handler still sees the pre-send state (combobox's Enter handler sends `INPUT.ENTER`, then decides
  whether to cancel the form submit from that state). Sends made while a wrapped zag handler runs are queued and
  processed in order when the outermost handler returns — still inside the same event dispatch.
- **Replaced commands (`event.replaces`).** Like the other adapters, a command that a later one with the same key
  supersedes in the same tick (two `api.setOpen` calls) is dropped. Only these events are deferred, to a microtask;
  DOM-driven events stay synchronous.

- **Re-entrancy queue (`processing` / `sendQueue`).** A transition's action may move DOM focus, which fires a
  synchronous `focusin` whose handler calls `send` again. Running that inline would overwrite `eventRef`/`transitionRef`
  mid-sequence, so a re-entrant `send` is queued and drained after the current one finishes.
- **Pending-events buffer (`pendingEvents`).** Live handlers attach when the client render commits, but the machine
  `start()`s one task later. Events that arrive in that gap are buffered (capped at 64) and replayed by `start()`.

`processEvent` re-resolves `propsRef` at the event boundary (`computeProps()`), so when `userProps` is a function it
reads live values rather than the last render's snapshot — important because Qwik may not have re-rendered yet after a
prop-source change.

## Post-commit scheduling (`track` / `watch` / start)

There is no synchronous flush, so anything that needs the committed DOM goes through `internals.postRenderQueue`,
drained by the second `useVisibleTask$` (the "tick task"), which tracks `tickSig`. Visible tasks run after Qwik's DOM
journal flush, so the queue runs against committed DOM. Producers:

- machine `start()` on resume (pushed during the body, bumps `tickSig`),
- `machine.watch`'s `track(deps, fn)`: render-phase slot-index diffing of deps; changed callbacks are pushed to the
  queue and `tickSig` is bumped.

## `normalizeProps`

`createNormalizer` produces the prop map:

- **Server:** function-valued event props are replaced by the shared wake QRL; all non-event attributes
  (aria/data/id/style) are emitted so SSR HTML is correct.
- **Client:** event props become Qwik `$`-suffixed props holding the wrapped plain function. Qwik registers plain
  functions on `element._qDispatch` and invokes them synchronously, preserving same-turn `preventDefault()`.
- **Event names** (Qwik has no synthetic events): `onChange→onInput`, `onFocus→onFocusIn`, `onBlur→onFocusOut`,
  `onDoubleClick→onDblClick`. A part that passes both `onChange` and `onInput` (the select's hidden `<select>`, which
  must react to autofill's `change`) keeps `onChange` as the native change event.
- **`defaultValue` / `defaultChecked`** are initial values: zag writes later changes to the element itself, and React
  applies them on mount only. Mapped to `value`/`checked`, each change would be written back on the next render and
  could overwrite what the user is typing. On the client the normalizer keeps emitting the value each element was
  created with (identified by its `id`; a server-rendered element keeps its rendered attribute), so Qwik never
  re-applies it.
- **Attribute names:** `className→class`, `htmlFor` kept, `defaultValue→value`, `defaultChecked→checked`; everything
  else is lowercased (except an SVG/React-ism allowlist), because Qwik diffs against attribute keys read back from the
  SSR DOM, which are lowercase.
- **`style`** is emitted as a compact `name:value;` string (see `style.ts`). Machines write some styles straight onto
  the node (popper's `--x`, `--y`, `--z-index`, measured sizes). The other frameworks apply a style prop one property at
  a time, so those writes survive re-renders; Qwik re-serializes the whole attribute whenever the value changes, which
  drops them (and popper skips re-writing values it believes are set, leaving a menu at the top-left). A single
  document-level `MutationObserver`, started on the client the first time a part has a style, watches the `style`
  attribute of zag parts (`[data-scope]`): it records properties written by anything other than the framework and puts
  them back right after a framework write — the same per-property semantics as the other adapters, applied before the
  next paint. Framework writes are told apart by their compact form (CSSOM serializes as `name: value`). `ref` is not
  used for this: Qwik runs it while diffing, before DOM writes are applied, and it would collide with a consumer's own
  `ref`.

### Handler wrapping (`wrapHandler`)

Qwik dispatches events from a **document-level capture listener**, so `event.currentTarget` is the document, not the
element, and handlers would run before Zag's own document-capture utilities (escape trackers, dismissable layers). The
wrapper:

1. If a replay is draining, defers via `enqueueDeferred` (see overtake above).
2. If the event is in the capturing phase on a bubbling event and `currentTarget` ≠ the element, re-attaches a one-shot
   listener on the element so the handler runs in its native target/bubble slot (still synchronous, so `preventDefault`
   works and a handler's `stopPropagation` no longer starves Zag's document-capture listeners). The disarm uses
   `setTimeout` (a macrotask) because microtask checkpoints run between listener invocations of the same dispatch.
3. Otherwise invokes directly (non-bubbling events, at-target/bubble dispatches, and finished wake-replayed events),
   pointing `currentTarget` at the element.

## `useBindable`

Each bindable is backed by one `useSignal` (plus a never-written `initialSig`), so its value serializes on SSR and
resumes for free, and render-phase reads register Qwik's fine-grained subscriptions. Controlled mode reads
`props().value` directly; uncontrolled mode reads/writes the signal. Writes fire `onChange` guarded by `isEqual`. Values
pass through the value-serializer registry on write (`encodeValue`) and decode on read (`decodeValue`). The `sync` flag
is a no-op (no public `flushSync`; signals are synchronously consistent).

## Value-serializer registry (`value-serializer.ts`)

A module-level registry of `{ id, match, serialize?, deserialize }` codecs. `encodeValue` walks arrays and replaces any
matched value with `{ __zag_encoded__: id, d }`; `decodeValue` reverses it via the codec found by `id`. If a matched
codec has no `serialize`, the value's `[SerializerSymbol]` method is used (mirroring Qwik's `SerializerArgObject`).
Registration is global because the registry is consulted by every machine on the page; app code registers codecs (as a
side-effecting import) before rendering. A decode with no matching id warns and returns the value unchanged.

### Relationship to Qwik's custom serializers

Qwik v2 ships its own custom-serialization API — `useSerializer$` / `createSerializer$` (which produce a
`SerializerSignal`, a computed-style signal with `{ deserialize, initial?, serialize? }`) and `SerializerSymbol` (a
method a class attaches to serialize itself). This adapter deliberately does **not** build `useBindable` on them, for
reasons specific to being a generic adapter:

- **The type is known by the machine/app, not the call site.** `useSerializer$` is designed for a call site that
  statically knows the concrete type (`deserialize: (d) => new Color(d)`). `useBindable` is generic — it cannot
  statically reference the reconstruction logic for whatever a given machine keeps in context. The registry pushes that
  knowledge to app-level registration instead, dispatched by a runtime `match` predicate.
- **QRL capture.** `useSerializer$`'s argument is QRL-extracted and may only capture serializable values, so it cannot
  close over a runtime-provided codec or the machine.
- **Third-party classes.** `SerializerSymbol` requires owning the class; we cannot add it to `@internationalized/date`'s
  `CalendarDate` or zag's `Color`.
- **Read/write vs. computed.** A bindable is the source of truth and needs imperative `set()`; a `SerializerSignal` is a
  `ComputedSignal` (derived).

To stay close where it is cheap, the codec shape mirrors Qwik's `SerializerArgObject` (`serialize` / `deserialize`,
`serialize` optional with a `[SerializerSymbol]` fallback). Whether `useBindable` could be re-expressed on top of
`useSerializer$` (its `serialize`/`deserialize` delegating to the module-level registry functions, which a QRL _can_
capture) is tracked as an open investigation — see `investigations/useBindable-on-useSerializer.md`.

## rAF render gate (`installRafRenderGate`)

Zag machines do post-render DOM work (focus, measurement) inside `requestAnimationFrame`, assuming the framework
committed the current render by the next frame (React guarantees this via `flushSync`). Qwik commits on its async
scheduler, so a machine's rAF can fire ~1 frame before the DOM reflects the latest state. Qwik does **not** use rAF to
render, so the adapter patches the global `requestAnimationFrame` once: while a container render is in flight
(`$renderPromise$` set) the callback waits it out (`waitUntilRendered`); otherwise it runs inline, adding no overhead to
the common case.

## Internal Qwik APIs

`qwik-internal.ts` imports two symbols that `@qwik.dev/core` exports at runtime but omits from its public type surface:

- `getDomContainer(el)` — resolves the Qwik container for an element.
- `_waitUntilRendered(container)` — resolves the container's render promise.

Both are used only by the wake/replay and rAF-gate machinery, never exposed to users.

## File map

| File                  | Responsibility                                                                        |
| --------------------- | ------------------------------------------------------------------------------------- |
| `machine.ts`          | `useMachine`, internals, send/process, lifecycle tasks, rAF gate.                     |
| `bindable.ts`         | `useBindable` — signal-backed `Bindable` with serializer encode/decode on write/read. |
| `normalize-props.ts`  | `normalizeProps` — name/event mapping, SSR strip, handler wrapping.                   |
| `wake-context.ts`     | Module slot publishing the SSR wake QRL to `normalizeProps`.                          |
| `wake-replay.ts`      | FIFO drain ordering pre-wake event replay + live-handler deferral.                    |
| `value-serializer.ts` | Registry + encode/decode for non-serializable context values.                         |
| `refs.ts`             | Plain-object `BindableRefs`.                                                          |
| `qwik-internal.ts`    | Typed wrappers over the runtime-only Qwik internals.                                  |
| `index.ts`            | Public exports.                                                                       |

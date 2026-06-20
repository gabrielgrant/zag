# Investigation: build `useBindable` on Qwik's `useSerializer$`

Status: **planned, not started.** This document is the experiment plan. The goal
is to arrive at the Qwik team with *concrete evidence and a recommendation they
only need to sanity-check*, not open questions of fact we could have answered
ourselves.

## Background

`useBindable` (see `../src/bindable.ts`) currently backs each Zag bindable with a
plain `useSignal`, and runs values through our own module-level codec registry
(`../src/value-serializer.ts`) — `encodeValue` on write, `decodeValue` on read —
so machines holding class instances in context (DateValue, Color) stay
SSR-resumable.

Qwik v2 ships a native equivalent, `useSerializer$` / `createSerializer$`
(verified present in `@qwik.dev/core@2.0.0-beta.36`):

```ts
const sig = useSerializer$<T, S>({
  deserialize: (data: Awaited<S>) => T,   // reconstruct (must not return a Promise)
  initial?: S,
  serialize?: (obj: T) => S,              // optional; may be async; falls back to [SerializerSymbol]
})
// -> SerializerSignal<T> extends ComputedSignal<T>
// function form also supports update?(current: T): T | void  // reactive recompute
```

Because our `encodeValue` / `decodeValue` are **module-level functions**, a QRL
*can* legally capture them, so in principle each bindable could be:

```ts
const sig = useSerializer$(() => ({
  initial: encodeValue(initialValue),
  deserialize: (d) => decodeValue(d),
  serialize: (v) => encodeValue(v),
}))
```

The open question is whether that actually works as a **read/write source of
truth** (bindables need imperative `set()`), and whether it's better than what we
have. The known tension: `SerializerSignal extends ComputedSignal` (derived),
while a bindable is the source of truth.

## Hypothesis

`useSerializer$` can replace the manual encode/decode plumbing in `useBindable`
**only if** a `SerializerSignal` supports being written to as a normal signal
(its `value`/`untrackedValue` setters persist and trigger subscribers). If it is
effectively read-only/derived, we keep the current design.

## Questions to answer empirically (not by asking)

E1. **Is a `SerializerSignal` writable as a source of truth?**
E2. **Does the QRL arg legally capture our module-level `encode/decodeValue`** (no
    optimizer capture error, SSR serializes cleanly)?
E3. **Does it round-trip SSR → resume** for our encoded shape, with no extra
    network/QRL cost on first paint?
E4. **Does one `useSerializer$` per bindable preserve sequential-scope alignment**
    across SSR / resume / re-render (same guarantee `useSignal` gives us today)?
E5. **Controlled mode:** can we bypass/ignore the serializer signal when
    `props().value !== undefined` without breaking hook order?
E6. **`update()` semantics:** does `deserialize` re-run unexpectedly (e.g. on
    unrelated reactive reads), and do we need `update` at all?
E7. **Cost:** chunks/bytes and runtime overhead vs. the plain-signal approach.

## Experiments

Run each in a scratch route in `examples/qwik-ts` (e.g.
`src/routes/_scratch-serializer/`), measuring concretely. Keep the route out of
the e2e globs.

### Exp 1 — writability probe (answers E1)
Create `const s = useSerializer$(() => ({ initial: 0, deserialize: (d) => d, serialize: (v) => v }))`.
In a button handler do `s.value = s.value + 1` and also try `s.untrackedValue = …`
and `s.trigger()`. Render `s.value`.
- **Confirm** (writable): the rendered value increments and persists across
  re-renders.
- **Refute** (derived-only): the write is ignored / throws / is recomputed away.
- Record exact behaviour (including any console warning) — this is the pivotal
  result.

### Exp 2 — registry-delegating bindable (answers E2, E3)
Implement `useBindableV2` identical to `useBindable` but with the signal replaced
by `useSerializer$(() => ({ initial: encodeValue(initial), deserialize: decodeValue, serialize: encodeValue }))`.
Wire one serializer-using machine (date-input or color-picker) to it.
- Build (`pnpm build`) and inspect: does the optimizer extract the QRL without a
  capture error? Does SSR HTML contain the encoded form? Does it resume (value
  visible, no `no value serializer` warning)?
- Capture the generated chunk for the serializer arg.

### Exp 3 — set() path (depends on Exp 1)
If Exp 1 says writable: route `useBindableV2.set()` through `s.value = encodeValue(next)`
and run `date-input` + `color-picker` e2e. Compare pass/flaky against the current
implementation on the same browser.
If Exp 1 says derived-only: stop — record that `set()` cannot be expressed; the
conclusion is "keep current design".

### Exp 4 — scope alignment (answers E4, E5)
With `useBindableV2`, exercise: SSR load, resume, a controls-driven re-render, and
controlled→uncontrolled toggling. Watch for Qwik sequential-scope errors or
hook-count warnings. Confirm controlled mode (reading `props().value`) still
works when the serializer signal is present but unused.

### Exp 5 — recompute & cost (answers E6, E7)
Instrument `deserialize` with a counter; interact and confirm it is not called
on unrelated updates. Diff `dist` chunk count/bytes for a serializer page between
current and V2.

## Decision criteria

- **Adopt** `useSerializer$` for `useBindable` only if: Exp 1 = writable, Exp 2 =
  clean extract + resume, Exp 3 = e2e parity, Exp 4 = no scope regressions, Exp 5
  = no pathological recompute and acceptable cost.
- **Otherwise keep** the registry + plain-signal design, and record exactly which
  experiment blocked adoption.

## What to take to the Qwik team (only after the experiments)

Bring results + a recommendation; ask them to confirm judgment/taste, not facts:

1. "Here is how `SerializerSignal` behaves when written to as a source of truth
   (Exp 1 result). Is that the intended use, or is it strictly derived?"
2. "We can make `useSerializer$` delegate `serialize`/`deserialize` to a
   module-level registry (Exp 2). Is that a blessed pattern for a *generic*
   adapter, or an anti-pattern in your view?"
3. "Given the results, we propose to [adopt / keep current]. Does that align with
   how you expect adapters to integrate custom serialization?"

The aim: every factual claim is backed by an experiment in this repo; the Qwik
team only validates our interpretation and our taste call.

# `@zag-js/qwik`

Qwik v2 adapter for Zag machines. It keeps one live controller for native browser interactions and uses Qwik's custom
serializer signal to preserve durable machine state across resume boundaries.

## Quick start

```tsx
import { component$ } from "@qwik.dev/core"
import * as menu from "@zag-js/menu"
import { bindPart$, createMachineSerializer, normalizeProps, useConnectedParts$, useMachine$ } from "@zag-js/qwik"

export default component$(() => {
  const machine = useMachine$(() => createMachineSerializer(menu.machine, { props: { id: "actions" } }))
  const parts = useConnectedParts$(() => menu.connect(machine.controller.value.service, normalizeProps), machine)
  const { api } = parts

  const trigger = bindPart$((api) => api.getTriggerProps(), parts)
  const content = bindPart$((api) => api.getContentProps(), parts)
  const archive = bindPart$((api) => api.getItemProps({ value: "archive" }), parts)
  const positioner = bindPart$((api) => api.getPositionerProps(), parts)

  return (
    <>
      <button ref={trigger.ref} {...trigger.props}>
        Actions
      </button>
      <div ref={positioner.ref} {...positioner.props}>
        <ul ref={content.ref} {...content.props}>
          <li ref={archive.ref} {...archive.props}>
            Archive
          </li>
        </ul>
      </div>
    </>
  )
})
```

`useConnectedParts$()` connects the Zag machine once for the current render and keeps a QRL that can reconnect to the
live controller after Qwik resumes. `bindPart$()` uses that connected state to return JSX-safe static props and a
declarative ref for one DOM element. Function props are removed from the JSX spread because Qwik would otherwise attach
them through its asynchronous event QRL edge. The adapter binds those generated function props as native listeners when
the element becomes visible, refreshes them after machine publishes, and cleans them up on rerender or unmount. The same
binding pass also mirrors Zag's current static attributes and DOM properties onto the element, so native machine
handlers do not have to wait for Qwik's next render before focus, visibility, and aria state are correct.

The helper pair keeps connected Zag APIs ergonomic when several parts are derived from the same `api`. For custom
controls or isolated props, `usePart$()` can bind a single QRL factory directly:

```tsx
const closeOnSelectControl = usePart$(
  () => ({
    onInput(event: Event) {
      const checked = (event.currentTarget as HTMLInputElement).checked
      closeOnSelect.value = checked
      machine.controller.value.updateProps({ closeOnSelect: checked })
    },
  }),
  machine,
)
```

`usePart$()` synchronously evaluates that QRL for the current JSX render, then uses the same QRL inside the visible task
to rebuild handlers after resume. Keep the first argument as a function so Qwik can turn it into a QRL; do not pass an
object full of functions as ordinary runtime data.

Keep imported Zag modules inside QRL closures instead of passing them as runtime data:

```tsx
// Good: the import is referenced by QRL source.
useConnectedParts$(() => menu.connect(machine.controller.value.service, normalizeProps), machine)

// Avoid: Qwik will try to serialize the menu module namespace.
useConnectedParts$((menu) => menu.connect(machine.controller.value.service, normalizeProps), machine, menu)
```

The render-time connected API is also marked as non-serializable internally. This is intentional: connected Zag APIs
contain functions and live runtime references, so Qwik should not serialize them into HTML. The durable state is the
machine snapshot; the browser can recreate the connected API from the QRL and live controller after resume.

`useMachine$()` takes a serializer QRL. Imported Zag machine functions are recreated after resume instead of being
serialized into HTML. Pass a stable `id` in machine props when the machine uses DOM ids.

## Mental model

Qwik event QRLs are asynchronous by default. Some Zag handlers conditionally call `event.preventDefault()`, so attaching
those generated handlers at the normal Qwik event edge can run too late. A `sync$()` wrapper is also intentionally too
restrictive to close over the live Zag controller.

See [QRL_DISPATCHER_REFACTOR.md](./QRL_DISPATCHER_REFACTOR.md) for notes on a possible future QRL-dispatcher adapter
experiment. The current adapter intentionally uses native event bindings for generated Zag handlers.

The adapter handles that split internally:

1. `useMachine$()` creates a serializer-backed `QwikMachine`.
2. `useConnectedParts$()` produces current render props and a serializable reconnect QRL for one connected Zag API.
3. `bindPart$()` spreads static attributes through JSX and binds generated function props as native listeners.
4. One live controller handles the complete pointer and click gesture chain.
5. The binding pass refreshes the same static attributes on the DOM node immediately after each machine publish.
6. Qwik invalidation is coalesced with `requestAnimationFrame()` after bound DOM state has been refreshed.
7. Qwik v2 serializes the durable state and bindable context snapshot when a boundary requires it.

## Qwik City and tests

Qwik's Playwright integration runs tests against the preview server instead of the dev server. That avoids cold Vite
optimizer work during the first user gesture and keeps Qwik City tests on the same build-and-preview path users get from
`pnpm run qwik add playwright`. Apps should be testable with normal Playwright locator actions; they should not need to
poll private adapter state or retry the first gesture. The Qwik example typechecks workspace source during that preview
build, so its TypeScript lib target must include APIs used by shared packages.

## Feasibility verdict

Parity is **partially achieved**. App code does not write `addEventListener`, refresh snapshots, maintain registries, or
build sync bridges. For multi-part components, the remaining Qwik-specific ceremony is one `useConnectedParts$()`, one
`bindPart$()` per bound element, and one `ref` per bound element. Most bound elements are interactive parts, but some
static-looking parts still need binding for runtime DOM coordination.

That step cannot be hidden behind a normal prop spread: the adapter needs the DOM element, current static props for
synchronous render, and a serializable QRL factory so generated handlers can be recreated after resume. The connected
parts helpers reduce the repeated prop calculation at the app edge, but they still preserve Qwik's split between
render-time values and resumable QRLs. A future additive Zag core API that exposes attrs and events separately could
make this even smaller, but it would not remove Qwik's need for a declarative element binding.

## Troubleshooting

- Bind every part whose props contain handlers with `bindPart$()` or `usePart$()`. Static-only parts may be spread
  directly after `splitProps(props).staticProps`.
- Bind popper positioners with `bindPart$()` or `usePart$()` even though they do not contain handlers. Floating UI
  writes runtime CSS variables to those nodes, and the binding preserves them across Qwik rerenders.
- Let bound menu/content props own their visibility attrs. Do not mirror `api.open` onto `hidden` for bound positioners
  or content nodes; that can race the adapter's client-side reconnect path and leave stale visibility state behind.
- Bind menu content with `bindPart$()` or `usePart$()` so the adapter can refresh native event handlers and static DOM
  state before machine-scheduled focus or measurement work runs.
- Do not pass imported Zag module namespaces, connected APIs, or other function-heavy objects as data arguments to QRL
  helpers. Reference imports inside the QRL closure instead.
- Use `@qwik.dev/core` v2. The serializer primitive is not available from the Qwik v1 package.

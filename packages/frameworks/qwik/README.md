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
the element becomes visible, refreshes them after machine publishes, and cleans them up on rerender or unmount.

The helper pair removes the repeated "QRL factory plus current props" shape that `usePart$()` requires:

```tsx
const api = menu.connect(machine.controller.value.service, normalizeProps)
const trigger = usePart$(
  () => menu.connect(machine.controller.value.service, normalizeProps).getTriggerProps(),
  machine,
  api.getTriggerProps(),
)
```

`usePart$()` is still useful for custom controls or isolated props, but `useConnectedParts$()` plus `bindPart$()` is the
preferred shape when several parts come from the same connected Zag API.

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

When Qwik rebinds an open composite menu, the adapter also restores focus to the content node if focus is not already
inside it. This keeps menu keyboard and typeahead flows aligned with Zag's runtime focus effects without requiring app
code to schedule a Qwik-visible focus task.

`useMachine$()` takes a serializer QRL. Imported Zag machine functions are recreated after resume instead of being
serialized into HTML. Pass a stable `id` in machine props when the machine uses DOM ids.

## Mental model

Qwik event QRLs are asynchronous by default. Some Zag handlers conditionally call `event.preventDefault()`, so attaching
those generated handlers at the normal Qwik event edge can run too late. A `sync$()` wrapper is also intentionally too
restrictive to close over the live Zag controller.

The adapter handles that split internally:

1. `useMachine$()` creates a serializer-backed `QwikMachine`.
2. `useConnectedParts$()` produces current render props and a serializable reconnect QRL for one connected Zag API.
3. `bindPart$()` spreads static attributes through JSX and binds generated function props as native listeners.
4. One live controller handles the complete pointer and click gesture chain.
5. Open menu content is refocused after binding when Qwik's DOM timing races Zag's focus effects.
6. Machine publishes are coalesced with `requestAnimationFrame()` before Qwik invalidation.
7. Qwik v2 serializes the durable state and bindable context snapshot when a boundary requires it.

## Qwik City and tests

Qwik's Playwright integration runs tests against the preview server instead of the dev server. That avoids cold Vite
optimizer work during the first user gesture and keeps Qwik City tests on the same build-and-preview path users get from
`pnpm run qwik add playwright`. Apps should be testable with normal Playwright locator actions; they should not need to
poll private adapter state or retry the first gesture.

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
- Bind menu content with `bindPart$()` or `usePart$()` so the adapter can refresh native event handlers and preserve
  keyboard focus after Qwik updates.
- Do not pass imported Zag module namespaces, connected APIs, or other function-heavy objects as data arguments to QRL
  helpers. Reference imports inside the QRL closure instead.
- Use `@qwik.dev/core` v2. The serializer primitive is not available from the Qwik v1 package.

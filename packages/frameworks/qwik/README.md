# `@zag-js/qwik`

Qwik v2 adapter for Zag machines. It keeps one live controller for native browser interactions and uses Qwik's custom
serializer signal to preserve durable machine state across resume boundaries.

## Quick start

```tsx
import { component$ } from "@qwik.dev/core"
import * as menu from "@zag-js/menu"
import { createMachineSerializer, normalizeProps, useMachine$, usePart$ } from "@zag-js/qwik"

export default component$(() => {
  const machine = useMachine$(() => createMachineSerializer(menu.machine, { props: { id: "actions" } }))
  const api = menu.connect(machine.controller.value.service, normalizeProps)
  const trigger = usePart$(
    () => menu.connect(machine.controller.value.service, normalizeProps).getTriggerProps(),
    machine,
    api.getTriggerProps(),
  )
  const content = usePart$(
    () => menu.connect(machine.controller.value.service, normalizeProps).getContentProps(),
    machine,
    api.getContentProps(),
  )
  const archive = usePart$(
    () => menu.connect(machine.controller.value.service, normalizeProps).getItemProps({ value: "archive" }),
    machine,
    api.getItemProps({ value: "archive" }),
  )
  const positioner = usePart$(
    () => menu.connect(machine.controller.value.service, normalizeProps).getPositionerProps(),
    machine,
    api.getPositionerProps(),
  )

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

`usePart$()` returns JSX-safe static props and a declarative ref. Its third argument supplies the current props for
synchronous JSX rendering. The QRL factory recreates props after resume so the adapter can bind generated function props
as native listeners when the element becomes visible, refresh them after machine publishes, and clean them up on
rerender or unmount.

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
2. `usePart$()` spreads static attributes through JSX and binds function props as native listeners.
3. One live controller handles the complete pointer and click gesture chain.
4. Open menu content is refocused after binding when Qwik's DOM timing races Zag's focus effects.
5. Machine publishes are coalesced with `requestAnimationFrame()` before Qwik invalidation.
6. Qwik v2 serializes the durable state and bindable context snapshot when a boundary requires it.

## Qwik City and tests

Qwik's Playwright integration runs tests against the preview server instead of the dev server. That avoids cold Vite
optimizer work during the first user gesture and keeps Qwik City tests on the same build-and-preview path users get from
`pnpm run qwik add playwright`. Apps should be testable with normal Playwright locator actions; they should not need to
poll private adapter state or retry the first gesture.

## Feasibility verdict

Parity is **partially achieved**. App code does not write `addEventListener`, refresh snapshots, maintain registries, or
build sync bridges. The remaining Qwik-specific ceremony is one `usePart$(factory, machine, props)` call and one `ref`
per interactive part.

That step cannot be hidden behind a normal prop spread: the adapter needs the DOM element, current static props for
synchronous render, and a serializable QRL factory so generated handlers can be recreated after resume. A future
additive Zag core API that exposes attrs and events separately could remove the repeated prop calculation, but it would
not remove Qwik's need for a declarative element binding.

## Troubleshooting

- Bind every part whose props contain handlers with `usePart$()`. Static-only parts may be spread directly after
  `splitProps(props).staticProps`.
- Bind popper positioners with `usePart$()` even though they do not contain handlers. Floating UI writes runtime CSS
  variables to those nodes, and the binding preserves them across Qwik rerenders.
- Bind menu content with `usePart$()` so the adapter can refresh event handlers and preserve keyboard focus after Qwik
  updates.
- Use `@qwik.dev/core` v2. The serializer primitive is not available from the Qwik v1 package.

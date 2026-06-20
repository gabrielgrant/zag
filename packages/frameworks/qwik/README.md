# @zag-js/qwik

The Qwik adapter for [Zag.js](https://zagjs.com). Use any Zag state machine in a
Qwik (v2) application with an API that mirrors the other framework adapters.

> Status: targets Qwik 2 (`@qwik.dev/core@^2.0.0-beta`). The adapter is fully
> resumable — machines are serialized during SSR and wake on the client without
> eager hydration of the whole tree.

## Installation

```sh
pnpm add @zag-js/qwik @zag-js/<component>
# e.g. pnpm add @zag-js/qwik @zag-js/editable
```

`@qwik.dev/core` is a peer dependency (`>=2.0.0-beta.0`).

## Usage

`useMachine` wires a machine into the component, and `connect` turns the running
service into prop getters you spread onto your JSX. `normalizeProps` adapts
Zag's prop shape to Qwik's native attribute/event names.

```tsx
import { component$, useId } from "@qwik.dev/core"
import * as editable from "@zag-js/editable"
import { normalizeProps, useMachine } from "@zag-js/qwik"

export default component$(() => {
  const id = useId()
  const service = useMachine(editable.machine, { id, defaultValue: "Hello World" })
  const api = editable.connect(service, normalizeProps)

  return (
    <div {...api.getRootProps()}>
      <div {...api.getAreaProps()}>
        <input {...api.getInputProps()} />
        <span {...api.getPreviewProps()} />
      </div>
      {!api.editing && <button {...api.getEditTriggerProps()}>Edit</button>}
      {api.editing && (
        <>
          <button {...api.getSubmitTriggerProps()}>Save</button>
          <button {...api.getCancelTriggerProps()}>Cancel</button>
        </>
      )}
    </div>
  )
})
```

### Props as an object or a function

`useMachine` accepts the machine props either as a plain object or as a function
returning the props. Pass a function when props derive from reactive state (e.g.
signals or a store) so the machine reads the live values:

```tsx
const service = useMachine(editable.machine, () => ({
  id,
  defaultValue: "Hello World",
  disabled: controls.disabled.value,
}))
```

## Resumability & the first interaction

Because Qwik resumes rather than hydrates, a machine's event handlers are not
"live" the instant SSR HTML lands — the component wakes on the client when the
document is ready (or earlier, on the first user interaction with it).

- Interactions made **after** the component has woken behave exactly like the
  other adapters, including synchronous `preventDefault()`.
- Interactions made in the **brief window before wake** are captured and replayed
  in order once the machine starts, so nothing is dropped. The single exception
  is that the *very first* pre-wake interaction cannot `preventDefault()`
  synchronously (the handler code is still loading). This matches the behaviour
  of interacting with any framework's UI mid-hydration.

No setup is required for this; it is handled by the adapter.

## Machines that hold class instances in context (date/color)

Some machines keep non-plain values in their context — e.g. `date-picker` and
`date-input` store `@internationalized/date` objects, and `color-picker` stores a
`Color`. Qwik can only serialize plain data, so to keep those machines
SSR-resumable you register a codec for each type **before** the machine renders:

```ts
import { registerValueSerializer } from "@zag-js/qwik"
import { CalendarDate, parseDate } from "@internationalized/date"

registerValueSerializer({
  id: "i18n-date",
  match: (v): v is CalendarDate => v instanceof CalendarDate,
  serialize: (v) => v.toString(),
  deserialize: (s) => parseDate(s as string),
})
```

The codec shape (`serialize` / `deserialize`, with `serialize` optional and
falling back to a value's `[SerializerSymbol]`) mirrors Qwik's own
`useSerializer$`; `id` + `match` are added so the generic adapter can dispatch
the right codec at runtime. See `DESIGN.md` for the relationship to Qwik's
native serializers.

Put these registrations in a module that both the server and client import
before rendering the page (importing it for its side effects is enough). The
adapter then stores the serialized form in resumable signals and reconstructs it
on read. If a value reaches a signal with no matching serializer registered, the
adapter logs a warning and stores it as-is (it will not survive resume).

You only need this for machines whose context holds class instances; the
majority of components work with no serializers at all.

## API

| Export                              | Description                                                          |
| ----------------------------------- | -------------------------------------------------------------------- |
| `useMachine(machine, props?)`       | Runs a machine, returns its `Service`. Props may be object or fn.    |
| `normalizeProps`                    | Normalizer mapping Zag props to Qwik native attributes/events.       |
| `mergeProps`                        | Re-exported from `@zag-js/core`.                                     |
| `registerValueSerializer(codec)`    | Registers a serialize/deserialize codec for a non-serializable context type.|

## License

MIT

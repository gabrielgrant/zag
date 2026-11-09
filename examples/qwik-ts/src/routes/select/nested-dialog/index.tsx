import { component$, useId } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as select from "@zag-js/select"
import { Presence } from "~/components/select-presence"

const items = ["Apple", "Banana", "Cherry"]

const Select = component$(() => {
  const id = useId()
  const service = useMachine(select.machine, () => ({
    id,
    collection: select.collection({ items }),
  }))
  const api = select.connect(service, normalizeProps)

  return (
    <div {...api.getRootProps()}>
      <label {...api.getLabelProps()}>Fruit</label>
      <button {...api.getTriggerProps()} data-testid="select-trigger">
        {api.valueAsString || "Select fruit"}
      </button>
      <Presence
        {...api.getPositionerProps()}
        hidden={!api.open}
        lazyMount
        unmountOnExit
        data-testid="select-positioner"
      >
        <div {...api.getContentProps()} hidden={false} data-testid="select-content">
          {items.map((item) => (
            <div key={item} {...api.getItemProps({ item })}>
              <span {...api.getItemTextProps({ item })}>{item}</span>
            </div>
          ))}
        </div>
      </Presence>
    </div>
  )
})

const css = `
  [data-scope="dialog"][data-part="content"],
  [data-scope="dialog"][data-part="positioner"],
  [data-scope="dialog"][data-part="backdrop"],
  [data-scope="select"][data-part="content"] {
    z-index: calc(1300 + var(--layer-index, 0));
  }
  [data-scope="dialog"][data-testid="child-content"] {
    background: #fff4ce;
    min-height: 300px;
  }
  [data-testid="select-positioner"][data-state="closed"] {
    animation: nestedSelectExit 0.3s ease-out;
  }
  @keyframes nestedSelectExit {
    to {
      opacity: 0;
    }
  }
`

export default component$(() => {
  const parentService = useMachine(dialog.machine, { id: useId() })
  const parent = dialog.connect(parentService, normalizeProps)
  const childService = useMachine(dialog.machine, { id: useId() })
  const child = dialog.connect(childService, normalizeProps)

  return (
    <main>
      <h1>Select in nested dialogs</h1>
      <button {...parent.getTriggerProps()} data-testid="parent-trigger">
        Open parent dialog
      </button>
      {parent.open && (
        <>
          <div {...parent.getBackdropProps()} />
          <div {...parent.getPositionerProps()}>
            <div {...parent.getContentProps()} data-testid="parent-content">
              <h2 {...parent.getTitleProps()}>Parent dialog</h2>
              <p {...parent.getDescriptionProps()}>Open another dialog to choose a fruit.</p>
              <button {...child.getTriggerProps()} data-testid="child-trigger">
                Open child dialog
              </button>
              {child.open && (
                <>
                  <div {...child.getBackdropProps()} />
                  <div {...child.getPositionerProps()}>
                    <div {...child.getContentProps()} data-testid="child-content">
                      <h2 {...child.getTitleProps()}>Child dialog</h2>
                      <p {...child.getDescriptionProps()}>The fruit list should appear above this dialog.</p>
                      <Select />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
      <style dangerouslySetInnerHTML={css} />
    </main>
  )
})

import { component$, useId } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import * as menu from "@zag-js/menu"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { dialog3?: dialog.Api } = {}

// Every positioner stays mounted while closed, so it is in the DOM before any dialog opens
// (React portals each one to the body; here they render inline)
export default component$(() => {
  const service1 = useMachine(dialog.machine, { id: useId() })
  const dialog1 = dialog.connect(service1, normalizeProps)

  const service2 = useMachine(dialog.machine, { id: useId() })
  const dialog2 = dialog.connect(service2, normalizeProps)

  const service3 = useMachine(dialog.machine, { id: useId() })
  const dialog3 = dialog.connect(service3, normalizeProps)

  const menuService = useMachine(menu.machine, { id: useId() })
  const actions = menu.connect(menuService, normalizeProps)
  apiRef.dialog3 = dialog3

  return (
    <>
      <main>
        <button {...dialog1.getTriggerProps()} data-testid="trigger-1">
          Open Dialog 1
        </button>

        <div {...dialog1.getBackdropProps()} />
        <div data-testid="positioner-1" {...dialog1.getPositionerProps()}>
          <div data-testid="content-1" {...dialog1.getContentProps()}>
            <h2 {...dialog1.getTitleProps()}>Dialog 1</h2>
            <button {...dialog2.getTriggerProps()} data-testid="trigger-2">
              Open Dialog 2
            </button>
            <button {...actions.getTriggerProps()} data-testid="menu-trigger">
              Actions
            </button>
            <button {...dialog1.getCloseTriggerProps()} data-testid="close-1">
              Close
            </button>
          </div>
        </div>

        <div {...dialog2.getBackdropProps()} />
        <div data-testid="positioner-2" {...dialog2.getPositionerProps()}>
          <div data-testid="content-2" {...dialog2.getContentProps()}>
            <h2 {...dialog2.getTitleProps()}>Dialog 2</h2>
            <button onClick$={() => apiRef.dialog3?.setOpen(true)} data-testid="open-3">
              Open Dialog 3
            </button>
            <button {...dialog2.getCloseTriggerProps()} data-testid="close-2">
              Close
            </button>
          </div>
        </div>

        <div {...dialog3.getBackdropProps()} />
        <div data-testid="positioner-3" {...dialog3.getPositionerProps()}>
          <div data-testid="content-3" {...dialog3.getContentProps()}>
            <h2 {...dialog3.getTitleProps()}>Dialog 3</h2>
            <button {...dialog3.getCloseTriggerProps()} data-testid="close-3">
              Close
            </button>
          </div>
        </div>

        <div data-testid="menu-positioner" {...actions.getPositionerProps()}>
          <ul data-testid="menu-content" {...actions.getContentProps()}>
            <li {...actions.getItemProps({ value: "rename" })}>Rename</li>
            <li {...actions.getItemProps({ value: "delete" })}>Delete</li>
          </ul>
        </div>
      </main>
      <Toolbar controls={null}>
        <StateVisualizer label="Dialog 1" state={service1} />
        <StateVisualizer label="Dialog 2" state={service2} />
        <StateVisualizer label="Dialog 3" state={service3} />
      </Toolbar>
    </>
  )
})

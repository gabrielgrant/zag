import { component$, useId } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

export default component$(() => {
  // Dialog 1
  const service = useMachine(dialog.machine, { id: useId() })
  const parentDialog = dialog.connect(service, normalizeProps)

  // Dialog 2
  const service2 = useMachine(dialog.machine, { id: useId() })
  const childDialog = dialog.connect(service2, normalizeProps)

  return (
    <>
      <main>
        <div>
          <button {...parentDialog.getTriggerProps()} data-testid="trigger-1">
            Open Dialog
          </button>

          <div style={{ minHeight: "1200px" }} />

          {parentDialog.open && (
            <>
              <div {...parentDialog.getBackdropProps()} />
              <div data-testid="positioner-1" {...parentDialog.getPositionerProps()}>
                <div {...parentDialog.getContentProps()}>
                  <h2 {...parentDialog.getTitleProps()}>Edit profile</h2>
                  <p {...parentDialog.getDescriptionProps()}>
                    Make changes to your profile here. Click save when you are done.
                  </p>
                  <button {...parentDialog.getCloseTriggerProps()} data-testid="close-1">
                    X
                  </button>
                  <input type="text" placeholder="Enter name..." data-testid="input-1" />
                  <button data-testid="save-button-1">Save Changes</button>

                  <button {...childDialog.getTriggerProps()} data-testid="trigger-2">
                    Open Nested
                  </button>

                  {childDialog.open && (
                    <>
                      <div {...childDialog.getBackdropProps()} />
                      <div data-testid="positioner-2" {...childDialog.getPositionerProps()}>
                        <div {...childDialog.getContentProps()}>
                          <h2 {...childDialog.getTitleProps()}>Nested</h2>
                          <button {...childDialog.getCloseTriggerProps()} data-testid="close-2">
                            X
                          </button>
                          {/* QRL handlers can't capture the non-serializable api;
                              closing dialog 1 == clicking its close trigger */}
                          <button
                            onClick$={() => {
                              document.querySelector<HTMLElement>("[data-testid=close-1]")?.click()
                            }}
                            data-testid="special-close"
                          >
                            Close Dialog 1
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Toolbar controls={null}>
        <StateVisualizer label="Dialog 1" state={service} />
        <StateVisualizer label="Dialog 2" state={service2} />
      </Toolbar>
    </>
  )
})

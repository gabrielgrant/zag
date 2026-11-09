import { component$, useId } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import * as tooltip from "@zag-js/tooltip"

const Tooltip = component$(() => {
  const service = useMachine(tooltip.machine, { id: useId() })
  const api = tooltip.connect(service, normalizeProps)
  return (
    <>
      <button {...api.getTriggerProps()}>Hover me</button>
      {/* rendered inline: Qwik has no portal */}
      {api.open && (
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()}>Tooltip</div>
        </div>
      )}
    </>
  )
})

export default component$(() => {
  const tooltipService = useMachine(tooltip.machine, { id: useId(), ids: { trigger: "t1" } })
  const dialogService = useMachine(dialog.machine, { id: useId(), ids: { trigger: "t1" } })

  const tooltipApi = tooltip.connect(tooltipService, normalizeProps)
  const dialogApi = dialog.connect(dialogService, normalizeProps)

  return (
    <main class="tooltip">
      <div class="root">
        <button {...mergeProps(tooltipApi.getTriggerProps(), dialogApi.getTriggerProps())}>Hover me</button>

        {/* rendered inline: Qwik has no portal */}
        {tooltipApi.open && (
          <div {...tooltipApi.getPositionerProps()}>
            <div {...tooltipApi.getContentProps()}>Tooltip</div>
          </div>
        )}

        {dialogApi.open && (
          <>
            <div {...dialogApi.getBackdropProps()} />
            <div {...dialogApi.getPositionerProps()}>
              <div {...dialogApi.getContentProps()}>
                <h2 {...dialogApi.getTitleProps()}>Edit profile</h2>
                <p {...dialogApi.getDescriptionProps()}>
                  Make changes to your profile here. Click save when you are done.
                </p>
                <div>
                  <Tooltip />
                  <input placeholder="Enter name..." />
                  <button>Save</button>
                </div>
                <button {...dialogApi.getCloseTriggerProps()}>Close</button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
})

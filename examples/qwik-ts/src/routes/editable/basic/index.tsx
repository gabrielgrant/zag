import { component$, useId } from "@qwik.dev/core"
import * as editable from "@zag-js/editable"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { editableControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(editableControls)
  const id = useId()

  const service = useMachine(
    editable.machine,
    () =>
      ({
        id,
        defaultValue: "Hello World",
        ...controls.values(),
      }) as editable.Props,
  )

  const api = editable.connect(service, normalizeProps)

  return (
    <>
      <main class="editable">
        <div {...api.getRootProps()}>
          <div {...api.getAreaProps()}>
            <input data-testid="input" {...api.getInputProps()} />
            <span data-testid="preview" {...api.getPreviewProps()} />
          </div>
          <div {...api.getControlProps()}>
            {!api.editing && (
              <button data-testid="edit-button" {...api.getEditTriggerProps()}>
                Edit
              </button>
            )}
            {api.editing && (
              <>
                <button data-testid="save-button" {...api.getSubmitTriggerProps()}>
                  Save
                </button>
                <button data-testid="cancel-button" {...api.getCancelTriggerProps()}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

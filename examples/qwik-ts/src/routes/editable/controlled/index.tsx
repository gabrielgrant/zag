import { component$, useId, useSignal } from "@qwik.dev/core"
import * as editable from "@zag-js/editable"
import { normalizeProps, useMachine } from "@zag-js/qwik"

export default component$(() => {
  const edit = useSignal(false)
  const id = useId()

  const service = useMachine(editable.machine, () => ({
    id,
    value: "Hello World",
    edit: edit.value,
    onEditChange(details: editable.EditChangeDetails) {
      edit.value = details.edit
    },
  }))

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
    </>
  )
})

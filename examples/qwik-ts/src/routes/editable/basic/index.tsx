import { component$, useId, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as editable from "@zag-js/editable"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  usePart$,
} from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

export default component$(() => {
  const id = useId()
  const inputId = `editable:${id}:input`
  const readOnly = useSignal(false)
  const disabled = useSignal(false)
  const autoResize = useSignal(false)
  const maxLength = useSignal(1000)
  const submitMode = useSignal<"enter" | "blur" | "both" | "none">("both")
  const activationMode = useSignal<"focus" | "dblclick" | "click">("focus")
  const machine = useMachine$(() =>
    createMachineSerializer(editable.machine, {
      props: () => ({
        id,
        defaultValue: "Hello World",
        readOnly: readOnly.value,
        disabled: disabled.value,
        autoResize: autoResize.value,
        maxLength: maxLength.value,
        submitMode: submitMode.value,
        activationMode: activationMode.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => editable.connect(machine.controller.value.service, normalizeProps), machine)
  machine.revision.value
  const api = parts.api
  const root = bindPart$((api) => api.getRootProps(), parts)
  const area = bindPart$((api) => api.getAreaProps(), parts)
  const input = bindPart$((api) => api.getInputProps(), parts)
  const preview = bindPart$((api) => api.getPreviewProps(), parts)
  const control = bindPart$((api) => api.getControlProps(), parts)
  const editTrigger = bindPart$((api) => api.getEditTriggerProps(), parts)
  const submitTrigger = bindPart$((api) => api.getSubmitTriggerProps(), parts)
  const cancelTrigger = bindPart$((api) => api.getCancelTriggerProps(), parts)
  const readOnlyControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        readOnly.value = checked
        machine.controller.value.updateProps({ readOnly: checked })
      },
    }),
    machine,
  )
  const disabledControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        disabled.value = checked
        machine.controller.value.updateProps({ disabled: checked })
      },
    }),
    machine,
  )
  const autoResizeControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        autoResize.value = checked
        machine.controller.value.updateProps({ autoResize: checked })
      },
    }),
    machine,
  )
  const maxLengthControl = usePart$(
    () => ({
      onInput(event: Event) {
        const value = Number((event.currentTarget as HTMLInputElement).value)
        maxLength.value = value
        machine.controller.value.updateProps({ maxLength: value })
      },
    }),
    machine,
  )
  const submitModeControl = usePart$(
    () => ({
      onInput(event: Event) {
        const value = (event.currentTarget as HTMLSelectElement).value as "enter" | "blur" | "both" | "none"
        submitMode.value = value
        machine.controller.value.updateProps({ submitMode: value })
      },
    }),
    machine,
  )
  const activationModeControl = usePart$(
    () => ({
      onInput(event: Event) {
        const value = (event.currentTarget as HTMLSelectElement).value as "focus" | "dblclick" | "click"
        activationMode.value = value
        machine.controller.value.updateProps({ activationMode: value })
      },
    }),
    machine,
  )

  useVisibleTask$(
    ({ cleanup }) => {
      let frame = 0

      const checkFocus = () => {
        const previewNode = preview.ref.value as HTMLElement | undefined
        if (
          activationMode.value === "focus" &&
          previewNode &&
          document.activeElement === previewNode &&
          !machine.controller.value.service.state.matches("edit")
        ) {
          machine.controller.value.service.send({ type: "EDIT", src: "focus" })
          requestAnimationFrame(() => {
            const node = document.getElementById(inputId) as HTMLInputElement | null
            node?.focus()
            node?.select()
          })
        }

        frame = requestAnimationFrame(checkFocus)
      }

      frame = requestAnimationFrame(checkFocus)
      cleanup(() => cancelAnimationFrame(frame))
    },
    { strategy: "document-ready" },
  )

  return (
    <>
      <main class="editable">
        <div ref={root.ref} {...root.props}>
          <div ref={area.ref} {...area.props}>
            <input data-testid="input" ref={input.ref} {...input.props} />
            <span
              data-testid="preview"
              ref={preview.ref}
              {...preview.props}
              tabIndex={!disabled.value && !readOnly.value ? 0 : undefined}
              onClick$={() => {
                if (activationMode.value === "click") {
                  api?.edit()
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      const node = document.getElementById(inputId) as HTMLInputElement | null
                      node?.focus()
                      node?.select()
                    })
                  })
                }
              }}
              onDblClick$={() => {
                if (activationMode.value === "dblclick") {
                  api?.edit()
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      const node = document.getElementById(inputId) as HTMLInputElement | null
                      node?.focus()
                      node?.select()
                    })
                  })
                }
              }}
              onFocus$={() => {
                if (activationMode.value === "focus") {
                  api?.edit()
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      const node = document.getElementById(inputId) as HTMLInputElement | null
                      node?.focus()
                      node?.select()
                    })
                  })
                }
              }}
            >
              {api?.valueText}
            </span>
          </div>
          <div ref={control.ref} {...control.props}>
            {!api?.editing && (
              <button
                data-testid="edit-button"
                ref={editTrigger.ref}
                {...editTrigger.props}
                onClick$={() => {
                  api?.edit()
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      const node = document.getElementById(inputId) as HTMLInputElement | null
                      node?.focus()
                      node?.select()
                    })
                  })
                }}
              >
                Edit
              </button>
            )}
            {api?.editing && (
              <>
                <button data-testid="save-button" ref={submitTrigger.ref} {...submitTrigger.props}>
                  Save
                </button>
                <button data-testid="cancel-button" ref={cancelTrigger.ref} {...cancelTrigger.props}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      <Toolbar controls>
        <div q:slot="controls" class="controls-container">
          <div class="checkbox">
            <input
              checked={readOnly.value}
              data-testid="readOnly"
              id="editable-read-only"
              ref={readOnlyControl.ref}
              type="checkbox"
              {...readOnlyControl.props}
            />
            <label for="editable-read-only">readOnly</label>
          </div>
          <div class="checkbox">
            <input
              checked={disabled.value}
              data-testid="disabled"
              id="editable-disabled"
              ref={disabledControl.ref}
              type="checkbox"
              {...disabledControl.props}
            />
            <label for="editable-disabled">disabled</label>
          </div>
          <div class="checkbox">
            <input
              checked={autoResize.value}
              data-testid="autoResize"
              id="editable-auto-resize"
              ref={autoResizeControl.ref}
              type="checkbox"
              {...autoResizeControl.props}
            />
            <label for="editable-auto-resize">autoResize</label>
          </div>
          <div class="field">
            <label for="editable-max-length">maxLength</label>
            <input
              data-testid="maxLength"
              id="editable-max-length"
              ref={maxLengthControl.ref}
              type="number"
              value={maxLength.value}
              {...maxLengthControl.props}
            />
          </div>
          <div class="field">
            <label for="editable-submit-mode">submitMode</label>
            <select
              data-testid="submitMode"
              id="editable-submit-mode"
              ref={submitModeControl.ref}
              value={submitMode.value}
              {...submitModeControl.props}
            >
              <option value="both">both</option>
              <option value="enter">enter</option>
              <option value="blur">blur</option>
              <option value="none">none</option>
            </select>
          </div>
          <div class="field">
            <label for="editable-activation-mode">activationMode</label>
            <select
              data-testid="activationMode"
              id="editable-activation-mode"
              ref={activationModeControl.ref}
              value={activationMode.value}
              {...activationModeControl.props}
            >
              <option value="focus">focus</option>
              <option value="dblclick">dblclick</option>
              <option value="click">click</option>
            </select>
          </div>
        </div>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Editable | Zag Qwik Examples",
}

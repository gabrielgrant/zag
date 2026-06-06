import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as passwordInput from "@zag-js/password-input"
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

const EyeIcon = component$(() => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
})

const EyeOffIcon = component$(() => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
      <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-2.83 3.95" />
      <path d="M6.61 6.61A17.34 17.34 0 0 0 2 12s3.5 8 10 8a10.93 10.93 0 0 0 5.39-1.39" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
})

export default component$(() => {
  const id = useId()
  const disabled = useSignal(false)
  const readOnly = useSignal(false)
  const ignorePasswordManagers = useSignal(false)
  const machine = useMachine$(() =>
    createMachineSerializer(passwordInput.machine, {
      props: () => ({
        id,
        disabled: disabled.value,
        readOnly: readOnly.value,
        ignorePasswordManagers: ignorePasswordManagers.value,
      }),
    }),
  )

  const parts = useConnectedParts$(
    () => passwordInput.connect(machine.controller.value.service, normalizeProps),
    machine,
  )
  const api = parts.api
  const root = bindPart$((api) => api.getRootProps(), parts)
  const label = bindPart$((api) => api.getLabelProps(), parts)
  const control = bindPart$((api) => api.getControlProps(), parts)
  const input = bindPart$((api) => api.getInputProps(), parts)
  const visibilityTrigger = bindPart$((api) => api.getVisibilityTriggerProps(), parts)
  const indicator = bindPart$((api) => api.getIndicatorProps(), parts)
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
  const passwordManagersControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        ignorePasswordManagers.value = checked
        machine.controller.value.updateProps({ ignorePasswordManagers: checked })
      },
    }),
    machine,
  )

  return (
    <>
      <main class="password-input">
        <div ref={root.ref} {...root.props}>
          <label ref={label.ref} {...label.props}>
            Password
          </label>
          <div ref={control.ref} {...control.props}>
            <input ref={input.ref} {...input.props} />
            <button ref={visibilityTrigger.ref} {...visibilityTrigger.props}>
              <span ref={indicator.ref} {...indicator.props}>
                {api?.visible ? <EyeIcon /> : <EyeOffIcon />}
              </span>
            </button>
          </div>
        </div>
      </main>

      <Toolbar controls>
        <div q:slot="controls" class="controls-container">
          <div class="checkbox">
            <input
              ref={disabledControl.ref}
              checked={disabled.value}
              data-testid="disabled"
              id="password-disabled"
              type="checkbox"
              {...disabledControl.props}
            />
            <label for="password-disabled">disabled</label>
          </div>
          <div class="checkbox">
            <input
              ref={readOnlyControl.ref}
              checked={readOnly.value}
              data-testid="readOnly"
              id="password-read-only"
              type="checkbox"
              {...readOnlyControl.props}
            />
            <label for="password-read-only">readOnly</label>
          </div>
          <div class="checkbox">
            <input
              ref={passwordManagersControl.ref}
              checked={ignorePasswordManagers.value}
              data-testid="ignorePasswordManagers"
              id="password-managers"
              type="checkbox"
              {...passwordManagersControl.props}
            />
            <label for="password-managers">ignorePasswordManagers</label>
          </div>
        </div>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Password Input | Zag Qwik Examples",
}

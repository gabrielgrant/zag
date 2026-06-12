import { component$, useId } from "@qwik.dev/core"
import * as passwordInput from "@zag-js/password-input"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { passwordInputControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(passwordInputControls)
  const id = useId()

  const service = useMachine(
    passwordInput.machine,
    () =>
      ({
        id,
        ...controls.values(),
      }) as passwordInput.Props,
  )

  const api = passwordInput.connect(service, normalizeProps)

  return (
    <>
      <main class="password-input">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Password</label>
          <div {...api.getControlProps()}>
            <input {...api.getInputProps()} />
            <button {...api.getVisibilityTriggerProps()}>
              <span {...api.getIndicatorProps()}>{api.visible ? "👁" : "🙈"}</span>
            </button>
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

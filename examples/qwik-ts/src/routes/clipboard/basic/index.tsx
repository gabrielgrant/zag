import { component$, useId } from "@qwik.dev/core"
import * as clipboard from "@zag-js/clipboard"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { clipboardControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(clipboardControls)
  const id = useId()

  const service = useMachine(
    clipboard.machine,
    () =>
      ({
        id,
        value: "https://github.com/chakra-ui/zag",
        ...controls.values(),
      }) as clipboard.Props,
  )

  const api = clipboard.connect(service, normalizeProps)

  return (
    <>
      <main class="clipboard">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Copy this link</label>
          <div {...api.getControlProps()}>
            <input {...api.getInputProps()} />
            <button {...api.getTriggerProps()}>{api.copied ? "✓" : "⧉"}</button>
          </div>
          <div {...api.getIndicatorProps({ copied: true })}>Copied!</div>
          <div {...api.getIndicatorProps({ copied: false })}>Copy</div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

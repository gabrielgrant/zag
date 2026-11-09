import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as radio from "@zag-js/radio-group"
import { radioControls, radioData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: radio.Api } = {}

export default component$(() => {
  const controls = useControls(radioControls)
  const id = useId()

  const service = useMachine(
    radio.machine,
    () =>
      ({
        id,
        name: "fruit",
        orientation: "horizontal",
        ...controls.values(),
      }) as radio.Props,
  )

  const api = radio.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="segmented-control">
        <div {...api.getRootProps()}>
          <div {...api.getIndicatorProps()} />
          {radioData.map((opt) => (
            <label key={opt.id} data-testid={`radio-${opt.id}`} {...api.getItemProps({ value: opt.id })}>
              <span data-testid={`label-${opt.id}`} {...api.getItemTextProps({ value: opt.id })}>
                {opt.label}
              </span>
              <input data-testid={`input-${opt.id}`} {...api.getItemHiddenInputProps({ value: opt.id })} />
            </label>
          ))}
        </div>
        <button onClick$={() => apiRef.current?.clearValue()}>reset</button>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

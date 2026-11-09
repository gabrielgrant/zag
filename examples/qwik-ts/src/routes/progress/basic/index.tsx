import { component$, useId } from "@qwik.dev/core"
import * as progress from "@zag-js/progress"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { progressControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: progress.Api } = {}

export default component$(() => {
  const controls = useControls(progressControls)
  const id = useId()

  const service = useMachine(
    progress.machine,
    () =>
      ({
        id,
        ...controls.values(),
      }) as progress.Props,
  )

  const api = progress.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="progress">
        <div {...api.getRootProps()}>
          <div {...api.getLabelProps()}>Upload progress</div>

          <svg {...api.getCircleProps()}>
            <circle {...api.getCircleTrackProps()} />
            <circle {...api.getCircleRangeProps()} />
          </svg>

          <div {...api.getTrackProps()}>
            <div {...api.getRangeProps()} />
          </div>

          <div {...api.getValueTextProps()}>{api.valueAsString}</div>

          <div>
            <button onClick$={() => apiRef.current?.setValue((apiRef.current.value ?? 0) - 20)}>Decrease</button>
            <button onClick$={() => apiRef.current?.setValue((apiRef.current.value ?? 0) + 20)}>Increase</button>
            <button onClick$={() => apiRef.current?.setValue(null)}>Indeterminate</button>
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

import { component$, useId } from "@qwik.dev/core"
import * as angleSlider from "@zag-js/angle-slider"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { angleSliderControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(angleSliderControls)
  const id = useId()

  const service = useMachine(angleSlider.machine, {
    ...controls.state,
    id,
  } as angleSlider.Props)

  const api = angleSlider.connect(service, normalizeProps)

  return (
    <>
      <main class="angle-slider">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>
            Angle Slider: <div {...api.getValueTextProps()}>{api.valueAsDegree}</div>
          </label>
          <div {...api.getControlProps()}>
            <div {...api.getThumbProps()}></div>
            <div {...api.getMarkerGroupProps()}>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((value) => (
                <div key={value} {...api.getMarkerProps({ value })}></div>
              ))}
            </div>
          </div>
          <input {...api.getHiddenInputProps()} />
        </div>
      </main>

      <Toolbar controls={controls}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

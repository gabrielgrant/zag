import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { sliderControls } from "@zag-js/shared"
import * as slider from "@zag-js/slider"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(sliderControls)
  const id = useId()

  const service = useMachine(
    slider.machine,
    () =>
      ({
        id,
        defaultValue: [0],
        ...controls.values(),
      }) as slider.Props,
  )

  const api = slider.connect(service, normalizeProps)

  return (
    <>
      <main class="slider">
        <form>
          <div {...api.getRootProps()}>
            <div>
              <label data-testid="label" {...api.getLabelProps()}>
                Slider Label
              </label>
              <output data-testid="output" {...api.getValueTextProps()}>
                {api.value.at(0)}
              </output>
            </div>
            <div class="control-area">
              <div {...api.getControlProps()}>
                <div data-testid="track" {...api.getTrackProps()}>
                  <div {...api.getRangeProps()} />
                </div>
                {api.value.map((_, index) => (
                  <div key={index} {...api.getThumbProps({ index })}>
                    <input {...api.getHiddenInputProps({ index })} />
                  </div>
                ))}
              </div>
              <div {...api.getMarkerGroupProps()}>
                <span {...api.getMarkerProps({ value: 10 })}>*</span>
                <span {...api.getMarkerProps({ value: 30 })}>*</span>
                <span {...api.getMarkerProps({ value: 90 })}>*</span>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

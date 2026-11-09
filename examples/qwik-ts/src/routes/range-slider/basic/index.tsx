import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { sliderControls } from "@zag-js/shared"
import * as slider from "@zag-js/slider"
import serialize from "form-serialize"
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
        name: "quantity",
        defaultValue: [10, 60],
        ...controls.values(),
      }) as slider.Props,
  )

  const api = slider.connect(service, normalizeProps)

  return (
    <>
      <main class="slider">
        <form
          // ensure we can read the value within forms
          onChange$={(_event, form) => {
            const formData = serialize(form, { hash: true })
            console.log(formData)
          }}
        >
          <div {...api.getRootProps()}>
            <div>
              <label {...api.getLabelProps()}>Quantity:</label>
              <output {...api.getValueTextProps()}>{api.value.join(" - ")}</output>
            </div>
            <div class="control-area">
              <div {...api.getControlProps()}>
                <div {...api.getTrackProps()}>
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
                <span {...api.getMarkerProps({ value: 50 })}>*</span>
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

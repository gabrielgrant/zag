import { component$, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as slider from "@zag-js/slider"

export default component$(() => {
  const value = useSignal([50])
  const endValue = useSignal([50])
  const id = useId()

  const service = useMachine(slider.machine, {
    id,
    name: "quantity",
    onValueChange(details) {
      value.value = details.value
    },
    onValueChangeEnd(details) {
      endValue.value = details.value
    },
  })

  const api = slider.connect(service, normalizeProps)

  return (
    <main>
      <div {...api.getRootProps()}>
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

        <div>
          <output>Change: {value.value[0]}</output>
          <output>Change end: {endValue.value[0]}</output>
        </div>
      </div>
    </main>
  )
})

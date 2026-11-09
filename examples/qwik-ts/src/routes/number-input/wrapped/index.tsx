import { component$, useId } from "@qwik.dev/core"
import * as numberInput from "@zag-js/number-input"
import { normalizeProps, useMachine } from "@zag-js/qwik"

/** see pin-input example: live api handle outside the render */
const apiRef: { current?: numberInput.Api } = {}

export default component$(() => {
  const min = 0
  const max = 10
  const id = useId()

  const service = useMachine(numberInput.machine, () => ({
    id,
    allowOverflow: true,
    max,
    min,
    onValueInvalid(details: numberInput.ValueInvalidDetails) {
      if (details.valueAsNumber > max) {
        apiRef.current?.setValue(min)
      } else if (details.valueAsNumber < min) {
        apiRef.current?.setValue(max)
      }
    },
  }))

  const api = numberInput.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <main>
      <div {...api.getRootProps()}>
        <label {...api.getLabelProps()}>Enter number:</label>
        <div {...api.getControlProps()}>
          <button {...api.getDecrementTriggerProps()}>−</button>
          <input {...api.getInputProps()} />
          <button {...api.getIncrementTriggerProps()}>+</button>
        </div>
      </div>
    </main>
  )
})

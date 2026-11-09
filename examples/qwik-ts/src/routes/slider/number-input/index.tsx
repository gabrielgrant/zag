import { component$, useId, useSignal, type QRL } from "@qwik.dev/core"
import * as numberInput from "@zag-js/number-input"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as slider from "@zag-js/slider"
import { nan } from "@zag-js/utils"

interface Props {
  value: string
  onChange$: QRL<(value: string) => void>
  min: number
  max: number
}

// component$ so each input owns its machine; the change callback crosses the
// boundary as a QRL
const NumberInput = component$<Props>((props) => {
  const id = useId()
  const service = useMachine(numberInput.machine, () => ({
    id,
    value: props.value,
    min: props.min,
    max: props.max,
    onValueChange(details) {
      props.onChange$(details.value)
    },
  }))

  const api = numberInput.connect(service, normalizeProps)

  return (
    <div {...api.getRootProps()}>
      <div {...api.getControlProps()} style={{ display: "flex" }}>
        <span
          style={{
            fontSize: "12px",
            paddingInline: "4px",
            paddingBlock: "2.5px",
            border: "1px inset black",
          }}
        >
          USD
        </span>
        <input {...api.getInputProps()} />
      </div>
    </div>
  )
})

const min = 500
const max = 5000
const minStepsBetweenThumbs = 100

function getAdjustedValue(value: number[]) {
  let [start, end] = value

  const isOverflowing = start > end || end > max || start < min
  if (!isOverflowing) return value

  if (start > end || start < min) start = min
  if (end > max) end = max
  if (end < start) end = start + minStepsBetweenThumbs

  return [start, end]
}

export default component$(() => {
  const value = useSignal([max / 4, max / 2])
  const id = useId()

  const service = useMachine(slider.machine, () => ({
    id,
    name: "quantity",
    min,
    max,
    minStepsBetweenThumbs,
    thumbAlignment: "center" as const,
    "aria-label": ["Minimum Price", "Maximum Price"],
    value: getAdjustedValue(value.value),
    onValueChange(details: slider.ValueChangeDetails) {
      value.value = details.value
    },
  }))

  const api = slider.connect(service, normalizeProps)

  return (
    <main class="slider">
      <div {...api.getRootProps()}>
        <div>
          <output {...api.getValueTextProps()}>{api.value.join(" - ")}</output>
        </div>
        <div {...api.getControlProps()}>
          <div {...api.getTrackProps()}>
            <div {...api.getRangeProps()} />
          </div>
          {api.value.map((_, index) => (
            <div key={index} {...api.getThumbProps({ index })} />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "40px" }}>
        {value.value.map((v, i) => (
          <NumberInput
            key={i}
            value={v.toString()}
            min={api.getThumbMin(i)}
            max={api.getThumbMax(i)}
            onChange$={(next) => {
              const copy = [...value.value]
              copy[i] = nan(parseFloat(next))
              value.value = copy
            }}
          />
        ))}
      </div>
    </main>
  )
})

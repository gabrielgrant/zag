import { slider } from "@ui-machines/web"
import { normalizeProps, useMachine, useSetup } from "@ui-machines/solid"

import { createMemo } from "solid-js"
import { css } from "@emotion/css"

import { StateVisualizer } from "../components/state-visualizer"
import { sliderStyle } from "../../../../shared/style"
import serialize from "form-serialize"

const styles = css(sliderStyle)

export default function Page() {
  const [state, send] = useMachine(
    slider.machine.withContext({
      uid: "123",
      value: 40,
      name: "volume",
      dir: "ltr",
    }),
  )

  const ref = useSetup<HTMLDivElement>({ send, id: "id" })

  const machineState = createMemo(() => slider.connect(state, send, normalizeProps))

  return (
    <div className={styles}>
      <form // ensure we can read the value within forms
        onChange={(e) => {
          const formData = serialize(e.currentTarget, { hash: true })
          console.log(formData)
        }}
      >
        <div>
          <label {...machineState().labelProps}>Slider Label</label>
          <output {...machineState().outputProps}>{machineState().value}</output>
        </div>
        <div className="slider" ref={ref} {...machineState().rootProps}>
          <div className="slider__track" {...machineState().trackProps}>
            <div className="slider__range" {...machineState().rangeProps} />
          </div>
          <div className="slider__thumb" {...machineState().thumbProps}>
            <input {...machineState().inputProps} />
          </div>
        </div>

        <StateVisualizer state={state} />
      </form>
    </div>
  )
}

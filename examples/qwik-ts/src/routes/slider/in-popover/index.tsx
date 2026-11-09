import { component$ } from "@qwik.dev/core"
import * as popover from "@zag-js/popover"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import * as slider from "@zag-js/slider"

const RangeSlider = component$(() => {
  const service = useMachine(slider.machine, {
    id: "1",
    name: "quantity",
    defaultValue: [10, 60],
  })

  const api = slider.connect(service, normalizeProps)

  return (
    <div class="slider">
      <div {...mergeProps(api.getRootProps())}>
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
        </div>
      </div>
    </div>
  )
})

export default component$(() => {
  const service = useMachine(popover.machine, {
    id: "2",
    modal: true,
    // content renders inline (Qwik has no portal), so the machine's tab-order
    // logic must agree with the actual DOM position
    portalled: false,
  })

  const api = popover.connect(service, normalizeProps)

  return (
    <main class="popover">
      <div data-part="root">
        <button data-testid="button-before">Button :before</button>

        <button data-testid="popover-trigger" {...api.getTriggerProps()}>
          Click me
          {/* span, not div: Qwik's SSR validator rejects a <div> inside <button> */}
          <span {...api.getIndicatorProps()}>{">"}</span>
        </button>

        <div {...api.getAnchorProps()}>anchor</div>

        <div {...api.getPositionerProps()}>
          <div data-testid="popover-content" class="popover-content" {...api.getContentProps()}>
            <RangeSlider />
          </div>
        </div>
        <span data-testid="plain-text">I am just text</span>
        <button data-testid="button-after">Button :after</button>
      </div>
    </main>
  )
})

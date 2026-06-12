import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as rating from "@zag-js/rating-group"
import { ratingControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

const HalfStar = component$(() => (
  <svg viewBox="0 0 273 260" data-part="star">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M135.977 214.086L52.1294 259.594L69.6031 165.229L0 99.1561L95.1465 86.614L135.977 1.04785V214.086Z"
      fill="currentColor"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M135.977 213.039L219.826 258.546L202.352 164.181L271.957 98.1082L176.808 85.5661L135.977 0V213.039Z"
      fill="#bdbdbd"
    />
  </svg>
))

const Star = component$(() => (
  <svg viewBox="0 0 273 260" data-part="star">
    <path
      d="M136.5 0L177.83 86.614L272.977 99.1561L203.374 165.229L220.847 259.594L136.5 213.815L52.1528 259.594L69.6265 165.229L0.0233917 99.1561L95.1699 86.614L136.5 0Z"
      fill="currentColor"
    />
  </svg>
))

export default component$(() => {
  const controls = useControls(ratingControls)
  const id = useId()

  const service = useMachine(
    rating.machine,
    () =>
      ({
        id,
        defaultValue: 2.5,
        ...controls.values(),
      }) as rating.Props,
  )

  const api = rating.connect(service, normalizeProps)

  return (
    <>
      <main class="rating">
        <div>
          <div {...api.getRootProps()}>
            <label {...api.getLabelProps()}>Rate:</label>
            <div {...api.getControlProps()}>
              {api.items.map((index) => {
                const state = api.getItemState({ index })
                return (
                  <span key={index} {...api.getItemProps({ index })}>
                    {state.half ? <HalfStar /> : <Star />}
                  </span>
                )
              })}
            </div>
          </div>
          <input {...api.getHiddenInputProps()} data-testid="hidden-input" />
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

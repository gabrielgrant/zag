import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as rating from "@zag-js/rating-group"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  type QwikMachineSignal,
} from "@zag-js/qwik"
import { ratingControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

function HalfStar() {
  return (
    <svg data-part="star" viewBox="0 0 273 260">
      <path
        clip-rule="evenodd"
        d="M135.977 214.086L52.1294 259.594L69.6031 165.229L0 99.1561L95.1465 86.614L135.977 1.04785V214.086Z"
        fill="currentColor"
        fill-rule="evenodd"
      />
      <path
        clip-rule="evenodd"
        d="M135.977 213.039L219.826 258.546L202.352 164.181L271.957 98.1082L176.808 85.5661L135.977 0V213.039Z"
        fill="#bdbdbd"
        fill-rule="evenodd"
      />
    </svg>
  )
}

function Star() {
  return (
    <svg data-part="star" viewBox="0 0 273 260">
      <path
        d="M136.5 0L177.83 86.614L272.977 99.1561L203.374 165.229L220.847 259.594L136.5 213.815L52.1528 259.594L69.6265 165.229L0.0233917 99.1561L95.1699 86.614L136.5 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

interface RatingItemProps {
  index: number
  machine: QwikMachineSignal<any>
}

const RatingItem = component$<RatingItemProps>(({ index, machine }) => {
  const parts = useConnectedParts$(() => rating.connect(machine.controller.value.service, normalizeProps), machine)
  const item = bindPart$((api) => api.getItemProps({ index }), parts)
  const itemState = parts.api?.getItemState({ index })

  return (
    <button ref={item.ref} {...item.props} tabIndex={itemState?.checked ? 0 : -1} type="button">
      {itemState?.half ? <HalfStar /> : <Star />}
    </button>
  )
})

export default component$(() => {
  const id = useId()
  const controls = useControls(ratingControls)
  const machine = useMachine$(() =>
    createMachineSerializer(rating.machine, {
      props: () => ({
        id,
        defaultValue: 2.5,
        ...controls.context.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => rating.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const root = bindPart$((api) => api.getRootProps(), parts)
  const label = bindPart$((api) => api.getLabelProps(), parts)
  const control = bindPart$((api) => api.getControlProps(), parts)
  const hiddenInput = bindPart$((api) => api.getHiddenInputProps(), parts)
  return (
    <>
      <main class="rating">
        <form>
          <div ref={root.ref} {...root.props}>
            <label ref={label.ref} {...label.props}>
              Rate:
            </label>
            <div ref={control.ref} {...control.props}>
              {api?.items.map((item) => (
                <RatingItem key={item} index={item} machine={machine} />
              ))}
            </div>
            <input data-testid="hidden-input" ref={hiddenInput.ref} {...hiddenInput.props} />
          </div>
          <button type="reset">Reset</button>
        </form>
      </main>

      <Toolbar
        controls={controls}
        onControlsChange$={(context) => {
          machine.controller.value.updateProps(context)
        }}
      >
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Rating Group | Zag Qwik Examples",
}

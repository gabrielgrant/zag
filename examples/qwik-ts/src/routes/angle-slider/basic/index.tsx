import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as angleSlider from "@zag-js/angle-slider"
import { angleSliderControls } from "@zag-js/shared"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  type QwikMachineSignal,
} from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

const markerValues = [0, 45, 90, 135, 180, 225, 270, 315]

interface MarkerProps {
  value: number
  machine: QwikMachineSignal<any>
}

const Marker = component$<MarkerProps>(({ value, machine }) => {
  const parts = useConnectedParts$(() => angleSlider.connect(machine.controller.value.service, normalizeProps), machine)
  const marker = bindPart$((api) => api.getMarkerProps({ value }), parts)

  return <div ref={marker.ref} {...marker.props}></div>
})

export default component$(() => {
  const id = useId()
  const controls = useControls(angleSliderControls)

  const machine = useMachine$(() =>
    createMachineSerializer(angleSlider.machine, {
      props: () => ({
        id,
        ...controls.context.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => angleSlider.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const root = bindPart$((api) => api.getRootProps(), parts)
  const label = bindPart$((api) => api.getLabelProps(), parts)
  const valueText = bindPart$((api) => api.getValueTextProps(), parts)
  const control = bindPart$((api) => api.getControlProps(), parts)
  const thumb = bindPart$((api) => api.getThumbProps(), parts)
  const markerGroup = bindPart$((api) => api.getMarkerGroupProps(), parts)
  const hiddenInput = bindPart$((api) => api.getHiddenInputProps(), parts)

  return (
    <>
      <main class="angle-slider">
        <div ref={root.ref} {...root.props}>
          <label ref={label.ref} {...label.props}>
            Angle Slider:{" "}
            <div ref={valueText.ref} {...valueText.props}>
              {api?.valueAsDegree}
            </div>
          </label>
          <div ref={control.ref} {...control.props}>
            <div ref={thumb.ref} {...thumb.props}></div>
            <div ref={markerGroup.ref} {...markerGroup.props}>
              {markerValues.map((value) => (
                <Marker key={value} value={value} machine={machine} />
              ))}
            </div>
          </div>
          <input ref={hiddenInput.ref} {...hiddenInput.props} />
        </div>
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
  title: "Angle Slider | Zag Qwik Examples",
}

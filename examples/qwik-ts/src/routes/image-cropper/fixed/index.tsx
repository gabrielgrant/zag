import { component$, useId, useSignal } from "@qwik.dev/core"
import * as imageCropper from "@zag-js/image-cropper"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { imageCropperControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

/** see pin-input example: live api handle for custom (non-zag) buttons */
const apiRef: { current?: imageCropper.Api } = {}

export default component$(() => {
  const controls = useControls(imageCropperControls)
  const id = useId()
  const zoom = useSignal(1)
  const rotation = useSignal(0)

  const service = useMachine(imageCropper.machine, () => ({
    id,
    zoom: zoom.value,
    onZoomChange(details: imageCropper.ZoomChangeDetails) {
      zoom.value = details.zoom
    },
    rotation: rotation.value,
    onRotationChange(details: imageCropper.RotationChangeDetails) {
      rotation.value = details.rotation
    },
    fixedCropArea: true,
    ...controls.values(),
  }))

  const api = imageCropper.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="image-cropper">
        <div {...api.getRootProps()}>
          <div {...api.getViewportProps()}>
            <img src="https://picsum.photos/seed/a/500/300" {...api.getImageProps()} />
            <div {...api.getSelectionProps()} />
          </div>
        </div>
        <label>
          Zoom:
          <input
            type="range"
            min={service.prop("minZoom")}
            max={service.prop("maxZoom")}
            step={service.prop("zoomStep")}
            value={zoom.value}
            onInput$={(_e, el) => apiRef.current?.setZoom(Number(el.value))}
          />
        </label>
        <label>
          Rotation:
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={rotation.value}
            onInput$={(_e, el) => apiRef.current?.setRotation(Number(el.value))}
          />
        </label>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} context={["naturalSize", "crop", "zoom", "rotation", "offset"]} />
      </Toolbar>
    </>
  )
})

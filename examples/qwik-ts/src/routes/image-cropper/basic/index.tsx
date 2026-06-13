import { component$, useId, useSignal } from "@qwik.dev/core"
import * as imageCropper from "@zag-js/image-cropper"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { handlePositions, imageCropperControls } from "@zag-js/shared"
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
  const flip = useSignal<imageCropper.FlipState>({ horizontal: false, vertical: false })
  const selectedHandle = useSignal<imageCropper.HandlePosition>("e")
  const resizeStep = useSignal(10)

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
    flip: flip.value,
    onFlipChange(details: imageCropper.FlipChangeDetails) {
      flip.value = details.flip
    },
    ...controls.values(),
  }))

  const api = imageCropper.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="image-cropper">
        <div {...api.getRootProps()}>
          <div {...api.getViewportProps()}>
            <img src="/crop-image.png" {...api.getImageProps()} />
            <div {...api.getSelectionProps()}>
              {handlePositions.map((position) => (
                <div key={position} {...api.getHandleProps({ position })}>
                  <div />
                </div>
              ))}
              <div {...api.getGridProps({ axis: "horizontal" })} />
              <div {...api.getGridProps({ axis: "vertical" })} />
            </div>
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
            data-testid="zoom-slider"
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
            data-testid="rotation-slider"
            onInput$={(_e, el) => apiRef.current?.setRotation(Number(el.value))}
          />
        </label>
        <fieldset>
          <legend>Flip</legend>
          <label>
            <input
              type="checkbox"
              checked={flip.value.horizontal}
              onInput$={(_e, el) => apiRef.current?.flipHorizontally(el.checked)}
            />
            Horizontal
          </label>
          <label>
            <input
              type="checkbox"
              checked={flip.value.vertical}
              onInput$={(_e, el) => apiRef.current?.flipVertically(el.checked)}
            />
            Vertical
          </label>
          <div>
            <button type="button" onClick$={() => apiRef.current?.flipHorizontally()}>
              Toggle horizontal flip
            </button>
            <button type="button" onClick$={() => apiRef.current?.flipVertically()}>
              Toggle vertical flip
            </button>
            <button type="button" onClick$={() => apiRef.current?.setFlip({ horizontal: false, vertical: false })}>
              Reset flips
            </button>
          </div>
        </fieldset>
        <div>
          <label>
            Resize handle:
            <select
              data-testid="resize-handle-select"
              value={selectedHandle.value}
              onInput$={(_e, el) => (selectedHandle.value = el.value as imageCropper.HandlePosition)}
            >
              {handlePositions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </label>
          <label>
            Resize step (px):
            <input
              data-testid="resize-step-input"
              type="number"
              min={1}
              value={resizeStep.value}
              onInput$={(_e, el) => {
                const value = Number(el.value)
                resizeStep.value = Number.isFinite(value) && value > 0 ? value : 1
              }}
            />
          </label>
          <div>
            <button
              type="button"
              data-testid="grow-button"
              onClick$={() => apiRef.current?.resize(selectedHandle.value, resizeStep.value)}
            >
              Grow selection
            </button>
            <button
              type="button"
              data-testid="shrink-button"
              onClick$={() => apiRef.current?.resize(selectedHandle.value, -resizeStep.value)}
            >
              Shrink selection
            </button>
          </div>
        </div>

        <div>
          <button type="button" data-testid="reset-button" onClick$={() => apiRef.current?.reset()}>
            Reset
          </button>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} context={["naturalSize", "crop", "zoom", "rotation", "flip", "offset"]} />
      </Toolbar>
    </>
  )
})

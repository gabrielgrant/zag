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
  const croppedImageUrl = useSignal<string | null>(null)
  const isExporting = useSignal(false)

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

  // The page's own action buttons go through normalizeProps like zag's parts:
  // plain functions become synchronous handlers on the client (an onClick$ QRL
  // runs a tick later on first use, after tests have already read the result)
  const action = (onClick: () => void) => normalizeProps.button({ type: "button", onClick })

  const centerCrop = () => {
    const { crop, viewportRect } = api
    api.setCrop({
      ...crop,
      x: (viewportRect.width - crop.width) / 2,
      y: (viewportRect.height - crop.height) / 2,
    })
  }

  const fillViewport = () => {
    const { viewportRect } = api
    api.setCrop({ x: 0, y: 0, width: viewportRect.width, height: viewportRect.height })
  }

  return (
    <>
      <main class="image-cropper">
        <div {...api.getRootProps()}>
          <div {...api.getViewportProps()}>
            <img src="https://picsum.photos/seed/a/500/300" crossOrigin="anonymous" {...api.getImageProps()} />
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
              {...normalizeProps.input({ onChange: (e) => api.flipHorizontally(e.currentTarget.checked) })}
            />
            Horizontal
          </label>
          <label>
            <input
              type="checkbox"
              checked={flip.value.vertical}
              {...normalizeProps.input({ onChange: (e) => api.flipVertically(e.currentTarget.checked) })}
            />
            Vertical
          </label>
          <div>
            <button {...action(() => api.flipHorizontally())}>Toggle horizontal flip</button>
            <button {...action(() => api.flipVertically())}>Toggle vertical flip</button>
            <button {...action(() => api.setFlip({ horizontal: false, vertical: false }))}>Reset flips</button>
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
            <button data-testid="grow-button" {...action(() => api.resize(selectedHandle.value, resizeStep.value))}>
              Grow selection
            </button>
            <button data-testid="shrink-button" {...action(() => api.resize(selectedHandle.value, -resizeStep.value))}>
              Shrink selection
            </button>
          </div>
        </div>

        <div>
          <button data-testid="reset-button" {...action(() => api.reset())}>
            Reset
          </button>
          <button data-testid="center-crop-button" {...action(centerCrop)}>
            Center selection
          </button>
          <button data-testid="fill-crop-button" {...action(fillViewport)}>
            Fill viewport
          </button>
        </div>

        <fieldset>
          <legend>Export Cropped Image</legend>
          <div>
            {(["blob", "dataUrl"] as const).map((output) => (
              <button
                key={output}
                type="button"
                disabled={isExporting.value}
                onClick$={async () => {
                  isExporting.value = true
                  try {
                    const result = await apiRef.current?.getCroppedImage({ output })
                    if (result) {
                      croppedImageUrl.value =
                        output === "dataUrl" ? (result as string) : URL.createObjectURL(result as Blob)
                    }
                  } catch (error) {
                    console.error("Failed to export image:", error)
                  } finally {
                    isExporting.value = false
                  }
                }}
              >
                {isExporting.value ? "Exporting..." : output === "blob" ? "Export as Blob" : "Export as Data URL"}
              </button>
            ))}
            <button
              type="button"
              disabled={isExporting.value}
              onClick$={async () => {
                isExporting.value = true
                try {
                  const blob = await apiRef.current?.getCroppedImage({ type: "image/png" })
                  if (blob && blob instanceof Blob) {
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement("a")
                    link.href = url
                    link.download = `cropped-image-${Date.now()}.png`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                  }
                } catch (error) {
                  console.error("Failed to download image:", error)
                } finally {
                  isExporting.value = false
                }
              }}
            >
              {isExporting.value ? "Downloading..." : "Download PNG"}
            </button>
            {croppedImageUrl.value && (
              <button
                type="button"
                onClick$={() => {
                  if (croppedImageUrl.value?.startsWith("blob:")) URL.revokeObjectURL(croppedImageUrl.value)
                  croppedImageUrl.value = null
                }}
              >
                Clear Preview
              </button>
            )}
          </div>
          {croppedImageUrl.value && (
            <div>
              <h3>Cropped Image Preview:</h3>
              <img
                src={croppedImageUrl.value}
                alt="Cropped result"
                width={500}
                height={300}
                style={{ maxWidth: "100%", height: "auto", border: "1px solid #ccc" }}
              />
            </div>
          )}
        </fieldset>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} context={["naturalSize", "crop", "zoom", "rotation", "flip", "offset"]} />
      </Toolbar>
    </>
  )
})

import { component$, useId } from "@qwik.dev/core"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import * as slider from "@zag-js/slider"
import * as tooltip from "@zag-js/tooltip"

export default component$(() => {
  const sliderService = useMachine(slider.machine, {
    id: useId(),
    name: "quantity",
    thumbSize: { width: 20, height: 20 },
    ids: {
      thumb(index) {
        return `thumb-${index}`
      },
    },
  })

  const sliderApi = slider.connect(sliderService, normalizeProps)

  const tooltipId = useId()
  const tooltipService = useMachine(tooltip.machine, () => ({
    id: tooltipId,
    ids: { trigger: "thumb-0" },
    // read live from the slider service (props are resolved lazily)
    open: slider.connect(sliderService, normalizeProps).dragging,
  }))

  const tooltipApi = tooltip.connect(tooltipService, normalizeProps)

  // Qwik has no portal: the tooltip renders inline
  return (
    <main class="slider">
      <div {...sliderApi.getRootProps()}>
        <div {...sliderApi.getControlProps()}>
          <div {...sliderApi.getTrackProps()}>
            <div {...sliderApi.getRangeProps()} />
          </div>
          <div {...mergeProps(tooltipApi.getTriggerProps(), sliderApi.getThumbProps({ index: 0 }))} />
          {tooltipApi.open && (
            <div {...tooltipApi.getPositionerProps()}>
              <div {...tooltipApi.getContentProps()}>{sliderApi.value[0]}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
})

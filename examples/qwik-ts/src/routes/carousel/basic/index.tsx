import { component$, useId } from "@qwik.dev/core"
import * as carousel from "@zag-js/carousel"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { carouselControls, carouselData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

/** see pin-input example: live api handle for custom (non-zag) buttons */
const apiRef: { current?: carousel.Api } = {}

export default component$(() => {
  const controls = useControls(carouselControls)
  const id = useId()

  const service = useMachine(
    carousel.machine,
    () =>
      ({
        id,
        spacing: "20px",
        slideCount: carouselData.length,
        allowMouseDrag: true,
        ...controls.values(),
      }) as carousel.Props,
  )

  const api = carousel.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="carousel">
        <div {...api.getRootProps()}>
          <button onClick$={() => apiRef.current?.scrollToIndex(4)}>Scroll to 4</button>
          <div {...api.getControlProps()}>
            <button {...api.getAutoplayTriggerProps()}>{api.isPlaying ? "Stop" : "Play"}</button>
            <div class="carousel-spacer" />
            <button {...api.getPrevTriggerProps()}>Prev</button>
            <button {...api.getNextTriggerProps()}>Next</button>
          </div>

          <div {...api.getItemGroupProps()}>
            {carouselData.map((image, index) => (
              <div {...api.getItemProps({ index })} key={index}>
                <img src={image} alt="" width={188} />
              </div>
            ))}
          </div>
          <div {...api.getIndicatorGroupProps()}>
            {api.pageSnapPoints.map((_, index) => (
              <button {...api.getIndicatorProps({ index })} key={index} />
            ))}
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} omit={["translations"]} />
      </Toolbar>
    </>
  )
})

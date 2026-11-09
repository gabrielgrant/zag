import { component$, useId, useSignal, type Signal } from "@qwik.dev/core"
import * as carousel from "@zag-js/carousel"
import * as dialog from "@zag-js/dialog"
import { normalizeProps, useMachine } from "@zag-js/qwik"

const SLIDE_COUNT = 30

const CarouselInDialog = component$<{ page: Signal<number> }>((props) => {
  const id = useId()
  const service = useMachine(carousel.machine, () => ({
    id,
    slideCount: SLIDE_COUNT,
    page: props.page.value,
    onPageChange({ page }: carousel.PageChangeDetails) {
      props.page.value = page
    },
  }))
  const api = carousel.connect(service, normalizeProps)

  return (
    <div class="carousel">
      <div {...api.getRootProps()}>
        <div {...api.getControlProps()}>
          <button {...api.getPrevTriggerProps()}>Prev</button>
          <button {...api.getNextTriggerProps()}>Next</button>
        </div>

        <div {...api.getItemGroupProps()}>
          {Array.from({ length: SLIDE_COUNT }, (_, i) => (
            <div {...api.getItemProps({ index: i })} key={i}>
              <img src={`https://picsum.photos/seed/slide-${i}/300/200`} alt={`Slide ${i}`} style={{ width: "100%" }} />
            </div>
          ))}
        </div>

        <div {...api.getIndicatorGroupProps()}>
          {api.pageSnapPoints.map((_, index) => (
            <button {...api.getIndicatorProps({ index })} key={index} />
          ))}
        </div>

        <p data-testid="page-display">Current page: {api.page}</p>
      </div>
    </div>
  )
})

export default component$(() => {
  const page = useSignal(0)

  const service = useMachine(dialog.machine, { id: useId() })
  const api = dialog.connect(service, normalizeProps)

  // The React page portals these and wraps backdrop/content in a `Presence`
  // (always mounted, `hidden` once the exit animation ends). Here they render
  // inline and rely on the parts' own `hidden` attribute, so the carousel
  // stays mounted across open/close just like in React.
  return (
    <main>
      <button {...api.getTriggerProps()} data-testid="open-dialog">
        Open Carousel in Dialog
      </button>

      <div {...api.getBackdropProps()} />
      <div {...api.getPositionerProps()}>
        <div {...api.getContentProps()}>
          <h2 {...api.getTitleProps()}>Carousel in Dialog</h2>
          <p {...api.getDescriptionProps()}>Navigate past page 10 to test the fix.</p>
          <CarouselInDialog page={page} />
          <button {...api.getCloseTriggerProps()} data-testid="close-dialog">
            Close
          </button>
        </div>
      </div>
    </main>
  )
})

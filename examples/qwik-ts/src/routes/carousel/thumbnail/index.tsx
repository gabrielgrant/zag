import { component$, useId } from "@qwik.dev/core"
import * as carousel from "@zag-js/carousel"
import { normalizeProps, useMachine } from "@zag-js/qwik"

const items = Array.from({ length: 10 }, (_, index) => index)

const THUMBNAIL_SLIDES_PER_PAGE = 6.75

/** see pin-input example: live api handles outside the render */
const mainApiRef: { current?: carousel.Api } = {}
const thumbnailApiRef: { current?: carousel.Api } = {}

export default component$(() => {
  const mainId = useId()
  const thumbnailId = useId()

  const mainService = useMachine(carousel.machine, () => ({
    id: mainId,
    slideCount: items.length,
    slidesPerPage: 1,
    onPageChange(details: carousel.PageChangeDetails) {
      const index = Math.floor((details.page + 1) / THUMBNAIL_SLIDES_PER_PAGE)
      thumbnailApiRef.current?.scrollTo(index)
    },
  }))
  const mainApi = carousel.connect(mainService, normalizeProps)
  mainApiRef.current = mainApi

  const thumbnailService = useMachine(carousel.machine, () => ({
    id: thumbnailId,
    slideCount: items.length,
    slidesPerPage: THUMBNAIL_SLIDES_PER_PAGE,
    spacing: "12px",
  }))
  const thumbnailApi = carousel.connect(thumbnailService, normalizeProps)
  thumbnailApiRef.current = thumbnailApi

  return (
    <main>
      <div {...mainApi.getRootProps()}>
        <div {...mainApi.getControlProps()}>
          <button {...mainApi.getPrevTriggerProps()}>Prev</button>
          <button {...mainApi.getNextTriggerProps()}>Next</button>
        </div>
        <div {...mainApi.getItemGroupProps()}>
          {items.map((index) => (
            <div {...mainApi.getItemProps({ index })} key={index}>
              {index + 1}
            </div>
          ))}
        </div>
        <div {...thumbnailApi.getRootProps()}>
          <div {...thumbnailApi.getItemGroupProps()}>
            {items.map((index) => (
              <div
                {...thumbnailApi.getItemProps({ index })}
                key={index}
                onClick$={() => mainApiRef.current?.scrollToIndex(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
})

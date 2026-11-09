import { component$, useId } from "@qwik.dev/core"
import * as popover from "@zag-js/popover"
import { normalizeProps, useMachine } from "@zag-js/qwik"

const dataAttr = (el: HTMLElement, key: string, value: boolean) => {
  if (value) el.dataset[key] = ""
  else delete el.dataset[key]
}

const isMdDown = () => window.matchMedia("(max-width: 640px)").matches

const Popover = component$(() => {
  const id = useId()

  const service = useMachine(popover.machine, () => ({
    id,
    // React portals the content when `portalled`; here it renders inline (Qwik has no portal)
    portalled: false,
    positioning: {
      updatePosition({ updatePosition, floatingElement }: any) {
        const positionerEl = floatingElement as HTMLElement
        const contentEl = positionerEl.firstElementChild as HTMLElement

        dataAttr(positionerEl, "fullscreen", isMdDown())
        dataAttr(contentEl, "fullscreen", isMdDown())

        updatePosition()
      },
    },
  }))

  const api = popover.connect(service, normalizeProps)

  return (
    <main>
      <button {...api.getTriggerProps()}>Click me</button>
      <div {...api.getPositionerProps()}>
        <div {...api.getContentProps()}>
          <div {...api.getTitleProps()}>Presenters</div>
          <div {...api.getDescriptionProps()}>Description</div>
          <button>Action Button</button>
          <button {...api.getCloseTriggerProps()}>X</button>
        </div>
      </div>
    </main>
  )
})

export default component$(() => {
  return (
    <div class="App">
      <Popover />
    </div>
  )
})

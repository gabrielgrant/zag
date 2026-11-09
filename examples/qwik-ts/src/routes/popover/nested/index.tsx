import { component$, Slot } from "@qwik.dev/core"
import * as popover from "@zag-js/popover"
import { normalizeProps, useMachine } from "@zag-js/qwik"

const Popover = component$<{ nested?: boolean; id: string }>((props) => {
  const { nested, id } = props
  const service = useMachine(popover.machine, {
    id,
    // React portals the content to the body; here it renders inline (Qwik has no portal)
    portalled: false,
    modal: false,
  })
  const api = popover.connect(service, normalizeProps)

  return (
    <>
      <div data-part="root">
        {!nested && <button data-testid="button-before">Button :before</button>}

        <button data-testid="popover-trigger" {...api.getTriggerProps()}>
          {nested ? "Open Nested" : "Click me"}
        </button>

        {!nested && <div {...api.getAnchorProps()}>anchor</div>}

        <div {...api.getPositionerProps()}>
          <div data-testid="popover-content" class="popover-content" {...api.getContentProps()}>
            <div {...api.getArrowProps()}>
              <div {...api.getArrowTipProps()} />
            </div>
            <div data-testid="popover-title" {...api.getTitleProps()}>
              Popover Title
            </div>
            <div data-part="body" data-testid="popover-body">
              <a>Non-focusable Link</a>
              <a href="#" data-testid="focusable-link">
                Focusable Link
              </a>
              <input data-testid="input" placeholder="input" />
              <button data-testid="popover-close-button" {...api.getCloseTriggerProps()}>
                X
              </button>
              <Slot />
            </div>
          </div>
        </div>
        {!nested && <span data-testid="plain-text">I am just text</span>}
        {!nested && <button data-testid="button-after">Button :after</button>}
      </div>
    </>
  )
})

export default component$(() => {
  return (
    <>
      <main class="popover">
        <Popover id="p1">
          <Popover nested id="p2">
            <Popover nested id="p3" />
          </Popover>
        </Popover>
      </main>
    </>
  )
})

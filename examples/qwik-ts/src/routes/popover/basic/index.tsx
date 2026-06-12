import { component$, useId } from "@qwik.dev/core"
import * as popover from "@zag-js/popover"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { popoverControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(popoverControls)
  const id = useId()

  const service = useMachine(popover.machine, {
    ...controls.state,
    id,
    // content is rendered inline (Qwik has no portal); keep the machine's
    // tab-order logic in agreement with the actual DOM position
    portalled: false,
  } as popover.Props)

  const api = popover.connect(service, normalizeProps)

  return (
    <>
      <main class="popover">
        <div data-part="root">
          <button data-testid="button-before">Button :before</button>

          <button data-testid="popover-trigger" {...api.getTriggerProps()}>
            Click me
            <div {...api.getIndicatorProps()}>{">"}</div>
          </button>

          <div {...api.getAnchorProps()}>anchor</div>

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
              </div>
            </div>
          </div>
          <span data-testid="plain-text">I am just text</span>
          <button data-testid="button-after">Button :after</button>
        </div>
      </main>

      <Toolbar controls={controls}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

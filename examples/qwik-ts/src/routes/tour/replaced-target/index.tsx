import { component$, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { tourReplacedTargetData } from "@zag-js/shared"
import * as tour from "@zag-js/tour"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { registerTourSteps } from "~/lib/tour-steps"

/** see pin-input example: live api handle for custom (non-zag) buttons */
const apiRef: { current?: tour.Api } = {}

export default component$(() => {
  const replaced = useSignal(false)

  registerTourSteps("replaced-target", tourReplacedTargetData)

  const service = useMachine(tour.machine, { id: useId(), steps: tourReplacedTargetData })
  const api = tour.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="tour">
        <div>
          <button onClick$={() => apiRef.current?.start()}>Start Tour</button>
          <button onClick$={() => (replaced.value = true)}>Replace target</button>

          <div class="steps__container">
            {/* The same target id, carried by one node or the other */}
            {!replaced.value && <h3 id="target">Original target</h3>}
            <div class="h-200px" />
            {replaced.value && <h3 id="target">Replacement target</h3>}
          </div>
        </div>

        {/* rendered inline: Qwik has no portal */}
        {api.step && api.open && (
          <>
            {api.step.backdrop && <div {...api.getBackdropProps()} />}
            <div {...api.getSpotlightProps()} />
            <div {...api.getPositionerProps()}>
              <div {...api.getContentProps()}>
                {api.step.arrow && (
                  <div {...api.getArrowProps()}>
                    <div {...api.getArrowTipProps()} />
                  </div>
                )}

                <p {...api.getTitleProps()}>{api.step.title}</p>
                <div {...api.getDescriptionProps()}>{api.step.description}</div>

                <div class="tour button__group">
                  {api.step.actions?.map((action) => (
                    <button key={action.label} {...api.getActionTriggerProps({ action })}>
                      {action.label}
                    </button>
                  ))}
                </div>

                <button {...api.getCloseTriggerProps()}>✕</button>
              </div>
            </div>
          </>
        )}
      </main>

      <Toolbar controls={null} viz>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

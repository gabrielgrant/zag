import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { stepsControls, stepsData } from "@zag-js/shared"
import * as steps from "@zag-js/steps"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(stepsControls)
  const id = useId()

  const service = useMachine(
    steps.machine,
    () =>
      ({
        id,
        count: stepsData.length,
        ...controls.values(),
      }) as steps.Props,
  )

  const api = steps.connect(service, normalizeProps)

  return (
    <>
      <main class="steps">
        <div {...api.getRootProps()}>
          <div {...api.getListProps()}>
            {stepsData.map((step, index) => (
              <div key={index} {...api.getItemProps({ index })}>
                <button {...api.getTriggerProps({ index })}>
                  {/* span, not div: Qwik's SSR validator rejects a <div> inside <button> */}
                  <span {...api.getIndicatorProps({ index })}>{index + 1}</span>
                  <span>{step.title}</span>
                </button>
                <div {...api.getSeparatorProps({ index })} />
              </div>
            ))}
          </div>

          {stepsData.map((step, index) => (
            <div key={index} {...api.getContentProps({ index })}>
              {step.title} - {step.description}
            </div>
          ))}

          <div {...api.getContentProps({ index: stepsData.length })}>
            Steps Complete - Thank you for filling out the form!
          </div>

          <div>
            <button {...api.getPrevTriggerProps()}>Back</button>
            <button {...api.getNextTriggerProps()}>Next</button>
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

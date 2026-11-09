import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as timer from "@zag-js/timer"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

export default component$(() => {
  const id = useId()

  const service = useMachine(
    timer.machine,
    () =>
      ({
        id,
        countdown: true,
        autoStart: true,
        startMs: timer.parse({ days: 2, seconds: 10 }),
        onComplete() {
          console.log("Timer completed")
        },
      }) as timer.Props,
  )

  const api = timer.connect(service, normalizeProps)

  const actions = (
    <div {...api.getControlProps()}>
      <button {...api.getActionTriggerProps({ action: "start" })}>START</button>
      <button {...api.getActionTriggerProps({ action: "pause" })}>PAUSE</button>
      <button {...api.getActionTriggerProps({ action: "resume" })}>RESUME</button>
      <button {...api.getActionTriggerProps({ action: "reset" })}>RESET</button>
    </div>
  )

  return (
    <>
      <main class="timer">
        <div {...api.getRootProps()}>
          <div {...api.getAreaProps()}>
            <div {...api.getItemProps({ type: "days" })}>{api.formattedTime.days}</div>
            <div {...api.getSeparatorProps()}>:</div>
            <div {...api.getItemProps({ type: "hours" })}>{api.formattedTime.hours}</div>
            <div {...api.getSeparatorProps()}>:</div>
            <div {...api.getItemProps({ type: "minutes" })}>{api.formattedTime.minutes}</div>
            <div {...api.getSeparatorProps()}>:</div>
            <div {...api.getItemProps({ type: "seconds" })}>{api.formattedTime.seconds}</div>
          </div>
        </div>
        {actions}
      </main>

      <Toolbar controls={null} viz>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

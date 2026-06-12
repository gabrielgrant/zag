import type { MachineSchema, Service } from "@zag-js/core"
import { highlightState } from "@zag-js/stringify-state"

interface StateVisualizerProps<T extends MachineSchema> {
  state: Service<T>
  label?: string
  omit?: string[]
  context?: Array<keyof T["context"]>
}

/**
 * Inline component (no `component$`): the service contains functions and must
 * never cross a `component$` prop boundary. Rendering inline keeps it inside
 * the route's render context, and the signal reads below subscribe the route
 * to state changes.
 */
export const StateVisualizer = <T extends MachineSchema>(props: StateVisualizerProps<T>) => {
  const { state: service, label, omit, context } = props
  const finalObject = {
    state: service.state.get(),
    event: service.event.current(),
    context: context ? Object.fromEntries(context.map((key) => [key, service.context.get(key)])) : undefined,
  }

  // NOTE: unlike other examples, <details> wraps <pre> here — Qwik's SSR
  // validator rejects non-phrasing content inside <pre>
  return (
    <div class="viz">
      <details open>
        <summary> {label || "Visualizer"} </summary>
        <pre dir="ltr" dangerouslySetInnerHTML={highlightState(finalObject, omit)} />
      </details>
    </div>
  )
}

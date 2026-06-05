import { component$, useSignal, useVisibleTask$ } from "@qwik.dev/core"

interface StateVisualizerProps {
  controller: {
    value: {
      service: {
        state: { get(): unknown }
        event: { current(): unknown; previous(): unknown }
      }
    }
  }
  revision: { value: number }
  label?: string
}

function createVisualizerReplacer() {
  const seen = new WeakSet<object>()

  return (_key: string, value: unknown) => {
    if (value instanceof Event) return `[${value.type} event]`
    if (value instanceof Node) return `[${value.nodeName.toLowerCase()}]`
    if (typeof value === "function") return "[function]"
    if (value === null || typeof value !== "object") return value
    if (seen.has(value)) return "[circular]"
    seen.add(value)
    return value
  }
}

export const StateVisualizer = component$((props: StateVisualizerProps) => {
  const state = useSignal("{}")

  useVisibleTask$(
    ({ track }) => {
      track(() => props.revision.value)
      const service = props.controller.value.service
      state.value = JSON.stringify(
        {
          state: service.state.get(),
          event: service.event.current(),
          previousEvent: service.event.previous(),
        },
        createVisualizerReplacer(),
        2,
      )
    },
    { strategy: "document-ready" },
  )

  return (
    <div class="viz">
      <details open>
        <summary> {props.label || "Visualizer"} </summary>
        <pre dir="ltr">
          <code>{state.value}</code>
        </pre>
      </details>
    </div>
  )
})

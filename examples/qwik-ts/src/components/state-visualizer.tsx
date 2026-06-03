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
        null,
        2,
      )
    },
    { strategy: "document-ready" },
  )

  return (
    <div class="viz">
      <pre dir="ltr">
        <details open>
          <summary> {props.label || "Visualizer"} </summary>
          <code>{state.value}</code>
        </details>
      </pre>
    </div>
  )
})

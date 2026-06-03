import { component$ } from "@qwik.dev/core"

interface StateVisualizerProps {
  state: string
  label?: string
}

export const StateVisualizer = component$((props: StateVisualizerProps) => {
  return (
    <div class="viz">
      <pre dir="ltr">
        <details open>
          <summary> {props.label || "Visualizer"} </summary>
          <code>{props.state}</code>
        </details>
      </pre>
    </div>
  )
})

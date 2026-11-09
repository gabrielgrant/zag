import { component$ } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as toggle from "@zag-js/toggle"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

// inline replacement for lucide's BoldIcon
const BoldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
  </svg>
)

export default component$(() => {
  const service = useMachine(toggle.machine, {})
  const api = toggle.connect(service, normalizeProps)

  return (
    <>
      <main class="toggle">
        <button {...api.getRootProps()}>
          <span {...api.getIndicatorProps()}>
            <BoldIcon />
          </span>
        </button>
      </main>

      <Toolbar viz>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

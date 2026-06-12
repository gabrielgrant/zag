import { component$, Slot, useSignal } from "@qwik.dev/core"
import { dataAttr } from "@zag-js/dom-query"
import type { UseControlsReturn } from "~/hooks/use-controls"
import { Controls } from "./controls"

interface ToolbarProps {
  // config + store only — both serializable across the component$ boundary
  controls?: UseControlsReturn | null
  viz?: boolean
}

export const Toolbar = component$<ToolbarProps>((props) => {
  const active = useSignal(props.viz ? 1 : !props.controls ? 1 : 0)

  return (
    <div class="toolbar">
      <nav>
        {props.controls && (
          <button data-active={dataAttr(active.value === 0)} onClick$={() => (active.value = 0)}>
            Controls
          </button>
        )}
        <button data-active={dataAttr(active.value === 1)} onClick$={() => (active.value = 1)}>
          Visualizer
        </button>
      </nav>
      <div>
        {props.controls && (
          <div data-content data-active={dataAttr(active.value === 0)}>
            <Controls store={props.controls} />
          </div>
        )}
        <div data-content data-active={dataAttr(active.value === 1)}>
          <Slot />
        </div>
      </div>
    </div>
  )
})

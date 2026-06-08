import { component$, Slot, useSignal, type QRL } from "@qwik.dev/core"
import { Controls, type UseControlsReturn } from "~/hooks/use-controls"

interface ToolbarProps {
  controls?: boolean | UseControlsReturn
  onControlsChange$?: QRL<(context: Record<string, any>) => void>
  viz?: boolean
}

const dataAttr = (condition: boolean) => (condition ? "" : undefined)
const hasControls = (controls: ToolbarProps["controls"]) => !!controls
const isControlsStore = (controls: ToolbarProps["controls"]): controls is UseControlsReturn =>
  typeof controls === "object" && controls !== null

export const Toolbar = component$<ToolbarProps>((props) => {
  const active = useSignal(props.viz ? 1 : hasControls(props.controls) ? 0 : 1)

  return (
    <div class="toolbar">
      <nav>
        {hasControls(props.controls) && (
          <button data-active={dataAttr(active.value === 0)} onClick$={() => (active.value = 0)}>
            Controls
          </button>
        )}
        <button data-active={dataAttr(active.value === 1)} onClick$={() => (active.value = 1)}>
          Visualizer
        </button>
      </nav>
      <div>
        {hasControls(props.controls) && (
          <div data-content data-active={dataAttr(active.value === 0)}>
            {isControlsStore(props.controls) ? (
              <Controls controls={props.controls} onChange$={props.onControlsChange$} />
            ) : (
              <Slot name="controls" />
            )}
          </div>
        )}
        <div data-content data-active={dataAttr(active.value === 1)}>
          <Slot />
        </div>
      </div>
    </div>
  )
})

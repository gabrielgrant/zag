import { component$, Slot, useSignal } from "@qwik.dev/core"

interface ToolbarProps {
  controls?: boolean
  viz?: boolean
}

const dataAttr = (condition: boolean) => (condition ? "" : undefined)

export const Toolbar = component$<ToolbarProps>((props) => {
  const active = useSignal(props.viz ? 1 : props.controls ? 0 : 1)

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
            <Slot name="controls" />
          </div>
        )}
        <div data-content data-active={dataAttr(active.value === 1)}>
          <Slot />
        </div>
      </div>
    </div>
  )
})

import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as cascadeSelect from "@zag-js/cascade-select"
import { cascadeSelectControls } from "@zag-js/shared"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useApi$,
  useConnectedParts$,
  useMachine$,
} from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"
import { collection, TreeNode } from "./tree-node"

export default component$(() => {
  const id = useId()
  const controls = useControls(cascadeSelectControls)

  const machine = useMachine$(() =>
    createMachineSerializer(cascadeSelect.machine, {
      props: () => ({
        id,
        collection,
        name: "location",
        ...controls.context.value,
      }),
    }),
  )

  const parts = useConnectedParts$(
    () => cascadeSelect.connect(machine.controller.value.service, normalizeProps),
    machine,
  )
  const highlightedValue = useApi$((api) => api.highlightedValue, parts)
  const value = useApi$((api) => api.value, parts)
  const root = bindPart$((api) => api.getRootProps(), parts)
  const label = bindPart$((api) => api.getLabelProps(), parts)
  const control = bindPart$((api) => api.getControlProps(), parts)
  const trigger = bindPart$((api) => api.getTriggerProps(), parts)
  const valueText = bindPart$(
    (api) => ({
      ...api.getValueTextProps(),
      textContent: api.valueAsString || "Select a location",
    }),
    parts,
  )
  const indicator = bindPart$((api) => api.getIndicatorProps(), parts)
  const clearTrigger = bindPart$((api) => api.getClearTriggerProps(), parts)
  const hiddenInput = bindPart$((api) => api.getHiddenInputProps(), parts)
  const positioner = bindPart$((api) => api.getPositionerProps(), parts)
  const content = bindPart$((api) => api.getContentProps(), parts)

  return (
    <>
      <main class="cascade-select">
        <div ref={root.ref} {...root.props}>
          <label ref={label.ref} {...label.props}>
            Select a location
          </label>

          <div ref={control.ref} {...control.props}>
            <button ref={trigger.ref} {...trigger.props}>
              <span ref={valueText.ref} {...valueText.props} />
              <span ref={indicator.ref} {...indicator.props}>
                ▼
              </span>
            </button>
            <button
              ref={clearTrigger.ref}
              {...clearTrigger.props}
              style={{ ...(clearTrigger.props.style as object), position: "relative", zIndex: 1 }}
            >
              X
            </button>
          </div>

          <input ref={hiddenInput.ref} {...hiddenInput.props} />

          <div ref={positioner.ref} {...positioner.props}>
            <div ref={content.ref} {...content.props}>
              <TreeNode machine={machine} node={collection.rootNode} revision={machine.revision.value} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: "350px" }}>
          <h3>Highlighted Value:</h3>
          <pre>{JSON.stringify(highlightedValue.value ?? [], null, 2)}</pre>
        </div>
        <div style={{ marginTop: "20px" }}>
          <h3>Selected Value:</h3>
          <pre>{JSON.stringify(value.value ?? [], null, 2)}</pre>
        </div>
      </main>

      <Toolbar
        controls={controls}
        onControlsChange$={(context) => {
          machine.controller.value.updateProps(context)
        }}
      >
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Cascade Select | Zag Qwik Examples",
}

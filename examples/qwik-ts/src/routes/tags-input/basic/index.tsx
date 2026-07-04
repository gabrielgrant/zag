import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { tagsInputControls } from "@zag-js/shared"
import * as tagsInput from "@zag-js/tags-input"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

function toDashCase(str: string) {
  return str.replace(/\s+/g, "-").toLowerCase()
}

export default component$(() => {
  const controls = useControls(tagsInputControls)
  const id = useId()

  const service = useMachine(
    tagsInput.machine,
    () =>
      ({
        id,
        defaultValue: ["React", "Vue"],
        ...controls.values(),
      }) as tagsInput.Props,
  )

  const api = tagsInput.connect(service, normalizeProps)

  return (
    <>
      <main class="tags-input">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Enter frameworks:</label>
          <div {...api.getControlProps()}>
            {/* render `null` (not an empty mapped array) when there are no
                tags: with an empty [] child, Qwik's keyed diff recreates the
                trailing keyed siblings on every subsequent re-render, which
                destroys the focused new-tag input each frame and locks the
                machine into a focus/blur render loop */}
            {api.value.length === 0
              ? null
              : api.value.map((value, index) => (
                  <span key={`${toDashCase(value)}-tag-${index}`} {...api.getItemProps({ index, value })}>
                    <div data-testid={`${toDashCase(value)}-tag`} {...api.getItemPreviewProps({ index, value })}>
                      <span data-testid={`${toDashCase(value)}-valuetext`} {...api.getItemTextProps({ index, value })}>
                        {value}{" "}
                      </span>
                      <button
                        data-testid={`${toDashCase(value)}-close-button`}
                        {...api.getItemDeleteTriggerProps({ index, value })}
                      >
                        &#x2715;
                      </button>
                    </div>
                    <input data-testid={`${toDashCase(value)}-input`} {...api.getItemInputProps({ index, value })} />
                  </span>
                ))}
            {/* keyed so removing an item span cannot positionally reconcile
                these onto former item nodes (which would recreate the
                focused input and drop focus) */}
            <input key="new-tag-input" data-testid="input" placeholder="add tag" {...api.getInputProps()} />
            <button key="clear-button" {...api.getClearTriggerProps()}>
              X
            </button>
          </div>
          <input {...api.getHiddenInputProps()} />
        </div>
      </main>
      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

import { component$, useId, useSignal } from "@qwik.dev/core"
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

  const submitCount = useSignal(0)
  const lastSubmit = useSignal<string | null>(null)

  const service = useMachine(tagsInput.machine, () => ({
    id,
    name: "tags",
    defaultValue: ["React", "Vue"],
    ...controls.values(),
  }))

  const api = tagsInput.connect(service, normalizeProps)

  return (
    <>
      <main class="tags-input">
        <form
          preventdefault:submit
          onSubmit$={(_event, form) => {
            const data = new FormData(form)
            const value = String(data.get("tags") ?? "")
            submitCount.value++
            lastSubmit.value = value
          }}
        >
          <div {...api.getRootProps()}>
            <label {...api.getLabelProps()}>Enter frameworks:</label>
            <div {...api.getControlProps()}>
              {/* `null` (not an empty mapped array) when there are no tags —
                  see tags-input/basic: Qwik's keyed diff otherwise recreates
                  the trailing keyed siblings every re-render once the list
                  has emptied, breaking input focus */}
              {api.value.length === 0
                ? null
                : api.value.map((value, index) => (
                    <span key={`${toDashCase(value)}-tag-${index}`} {...api.getItemProps({ index, value })}>
                      <div data-testid={`${toDashCase(value)}-tag`} {...api.getItemPreviewProps({ index, value })}>
                        <span
                          data-testid={`${toDashCase(value)}-valuetext`}
                          {...api.getItemTextProps({ index, value })}
                        >
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
              <input key="new-tag-input" data-testid="input" placeholder="add tag" {...api.getInputProps()} />
              <button key="clear-button" type="button" {...api.getClearTriggerProps()}>
                X
              </button>
            </div>
            <input {...api.getHiddenInputProps()} />
          </div>

          <div style={{ marginTop: "16px" }}>
            <button type="submit">Submit</button>
          </div>
        </form>

        <section style={{ marginTop: "16px" }}>
          <strong>submit count:</strong> <span data-testid="submit-count">{submitCount.value}</span>
          <br />
          <strong>last submitted value:</strong> <span data-testid="last-submit">{lastSubmit.value ?? "—"}</span>
        </section>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

import { component$, useId, useSignal } from "@qwik.dev/core"
import { ensureSerializersRegistered } from "~/serializers"
import * as colorPicker from "@zag-js/color-picker"
import { normalizeProps, useMachine } from "@zag-js/qwik"

const presets = ["#f47373", "#697689", "#37d67a"]

export default component$(() => {
  ensureSerializersRegistered()
  const id = useId()
  const nextFieldRef = useSignal<HTMLInputElement>()
  const service = useMachine(
    colorPicker.machine,
    () =>
      ({
        id,
        closeOnSelect: true,
        defaultValue: colorPicker.parse("#ff0000"),
        onValueChange() {
          nextFieldRef.value?.focus()
        },
      }) as colorPicker.Props,
  )
  const api = colorPicker.connect(service, normalizeProps)
  return (
    <main class="color-picker">
      <div {...api.getRootProps()}>
        <div {...api.getControlProps()}>
          <button {...api.getTriggerProps()}>
            {/* span, not div: Qwik's dev SSR rejects <div> inside <button> */}
            <span style={{ display: "flex" }}>
              <span {...api.getSwatchProps({ value: api.value })} />
            </span>
          </button>
        </div>
        <input ref={nextFieldRef} data-testid="next-field" placeholder="Next field" />
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()}>
            <div {...api.getSwatchGroupProps()} style={{ display: "flex", gap: "8px" }}>
              {presets.map((preset) => (
                <button key={preset} {...api.getSwatchTriggerProps({ value: preset })}>
                  <span style={{ display: "flex" }}>
                    <span {...api.getSwatchProps({ value: preset })} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
})

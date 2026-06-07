import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as radio from "@zag-js/radio-group"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  usePart$,
  type QwikMachineSignal,
} from "@zag-js/qwik"
import { radioData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

interface RadioItemProps {
  machine: QwikMachineSignal<any>
  value: string
  label: string
}

const RadioItem = component$<RadioItemProps>(({ machine, value, label }) => {
  const parts = useConnectedParts$(() => radio.connect(machine.controller.value.service, normalizeProps), machine)
  const item = bindPart$((api) => api.getItemProps({ value }), parts)
  const control = bindPart$((api) => api.getItemControlProps({ value }), parts)
  const text = bindPart$((api) => api.getItemTextProps({ value }), parts)
  const input = bindPart$((api) => api.getItemHiddenInputProps({ value }), parts)

  return (
    <label data-testid={`radio-${value}`} ref={item.ref} {...item.props}>
      <div data-testid={`control-${value}`} ref={control.ref} {...control.props} />
      <span data-testid={`label-${value}`} ref={text.ref} {...text.props}>
        {label}
      </span>
      <input data-testid={`input-${value}`} ref={input.ref} {...input.props} />
    </label>
  )
})

export default component$(() => {
  const id = useId()
  const disabled = useSignal(false)
  const readOnly = useSignal(false)
  const machine = useMachine$(() =>
    createMachineSerializer(radio.machine, {
      props: () => ({
        id,
        name: "fruits",
        disabled: disabled.value,
        readOnly: readOnly.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => radio.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const root = bindPart$((api) => api.getRootProps(), parts)
  const label = bindPart$((api) => api.getLabelProps(), parts)
  const indicator = bindPart$((api) => api.getIndicatorProps(), parts)
  const disabledControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        disabled.value = checked
        machine.controller.value.updateProps({ disabled: checked })
      },
    }),
    machine,
  )
  const readOnlyControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        readOnly.value = checked
        machine.controller.value.updateProps({ readOnly: checked })
      },
    }),
    machine,
  )

  return (
    <>
      <main class="radio">
        <form>
          <fieldset disabled={false}>
            <div ref={root.ref} {...root.props}>
              <h3 ref={label.ref} {...label.props}>
                Fruits
              </h3>
              <div ref={indicator.ref} {...indicator.props} />
              {radioData.map((opt) => (
                <RadioItem key={opt.id} label={opt.label} machine={machine} value={opt.id} />
              ))}
            </div>
            <button type="reset">Reset</button>
            <button onClick$={() => api?.setValue("mango")} type="button">
              Set to Mangoes
            </button>
            <button onClick$={() => api?.focus()} type="button">
              Focus
            </button>
          </fieldset>
        </form>
      </main>

      <Toolbar controls>
        <div q:slot="controls" class="controls-container">
          <div class="checkbox">
            <input
              ref={disabledControl.ref}
              checked={disabled.value}
              data-testid="disabled"
              id="radio-disabled"
              type="checkbox"
              {...disabledControl.props}
            />
            <label for="radio-disabled">disabled</label>
          </div>
          <div class="checkbox">
            <input
              ref={readOnlyControl.ref}
              checked={readOnly.value}
              data-testid="readOnly"
              id="radio-read-only"
              type="checkbox"
              {...readOnlyControl.props}
            />
            <label for="radio-read-only">readOnly</label>
          </div>
        </div>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Radio Group | Zag Qwik Examples",
}

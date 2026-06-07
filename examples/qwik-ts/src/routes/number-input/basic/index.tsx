import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as numberInput from "@zag-js/number-input"
import { bindPart$, createMachineSerializer, normalizeProps, useConnectedParts$, useMachine$ } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

export default component$(() => {
  const id = useId()
  const disabled = useSignal(false)
  const clampValueOnBlur = useSignal(true)
  const allowMouseWheel = useSignal(false)
  const spinOnPress = useSignal(true)
  const step = useSignal(1)
  const min = useSignal(0)
  const max = useSignal(100)
  const locale = useSignal("en-US")
  const maximumFractionDigits = useSignal("")
  const minimumFractionDigits = useSignal("")
  const formatStyle = useSignal("")
  const currency = useSignal("USD")

  const machine = useMachine$(() =>
    createMachineSerializer(numberInput.machine, {
      props: () => ({
        id,
        disabled: disabled.value,
        clampValueOnBlur: clampValueOnBlur.value,
        allowMouseWheel: allowMouseWheel.value,
        spinOnPress: spinOnPress.value,
        step: step.value,
        min: min.value,
        max: max.value,
        locale: locale.value,
        formatOptions: {
          maximumFractionDigits: maximumFractionDigits.value === "" ? undefined : Number(maximumFractionDigits.value),
          minimumFractionDigits: minimumFractionDigits.value === "" ? undefined : Number(minimumFractionDigits.value),
          style: formatStyle.value === "" ? undefined : (formatStyle.value as "decimal" | "currency" | "percent"),
          currency: currency.value,
        },
      }),
    }),
  )

  const parts = useConnectedParts$(() => numberInput.connect(machine.controller.value.service, normalizeProps), machine)
  const root = bindPart$((api) => api.getRootProps(), parts)
  const scrubber = bindPart$((api) => api.getScrubberProps(), parts)
  const label = bindPart$((api) => api.getLabelProps(), parts)
  const control = bindPart$((api) => api.getControlProps(), parts)
  const decrement = bindPart$((api) => api.getDecrementTriggerProps(), parts)
  const input = bindPart$((api) => api.getInputProps(), parts)
  const increment = bindPart$((api) => api.getIncrementTriggerProps(), parts)

  return (
    <>
      <main>
        <div ref={root.ref} {...root.props}>
          <div data-testid="scrubber" ref={scrubber.ref} {...scrubber.props} />
          <label data-testid="label" ref={label.ref} {...label.props}>
            Enter number:
          </label>
          <div ref={control.ref} {...control.props}>
            <button data-testid="dec-button" ref={decrement.ref} {...decrement.props}>
              DEC
            </button>
            <input data-testid="input" ref={input.ref} {...input.props} />
            <button data-testid="inc-button" ref={increment.ref} {...increment.props}>
              INC
            </button>
          </div>
        </div>
      </main>

      <Toolbar controls>
        <div q:slot="controls" class="controls-container">
          <div class="checkbox">
            <input
              checked={disabled.value}
              data-testid="disabled"
              onInput$={(_, currentTarget) => {
                const checked = currentTarget.checked
                disabled.value = checked
                machine.controller.value.updateProps({ disabled: checked })
              }}
              type="checkbox"
            />
            <label>disabled</label>
          </div>
          <div class="checkbox">
            <input
              checked={clampValueOnBlur.value}
              data-testid="clampValueOnBlur"
              onInput$={(_, currentTarget) => {
                const checked = currentTarget.checked
                clampValueOnBlur.value = checked
                machine.controller.value.updateProps({ clampValueOnBlur: checked })
              }}
              type="checkbox"
            />
            <label>clampValueOnBlur</label>
          </div>
          <div class="checkbox">
            <input
              checked={allowMouseWheel.value}
              data-testid="allowMouseWheel"
              onInput$={(_, currentTarget) => {
                const checked = currentTarget.checked
                allowMouseWheel.value = checked
                machine.controller.value.updateProps({ allowMouseWheel: checked })
              }}
              type="checkbox"
            />
            <label>allowMouseWheel</label>
          </div>
          <div class="checkbox">
            <input
              checked={spinOnPress.value}
              data-testid="spinOnPress"
              onInput$={(_, currentTarget) => {
                const checked = currentTarget.checked
                spinOnPress.value = checked
                machine.controller.value.updateProps({ spinOnPress: checked })
              }}
              type="checkbox"
            />
            <label>spinOnPress</label>
          </div>
          <div class="field">
            <label>step</label>
            <input
              data-testid="step"
              onInput$={(_, currentTarget) => {
                const value = Number(currentTarget.value)
                step.value = value
                machine.controller.value.updateProps({ step: value })
              }}
              type="number"
              value={step.value}
            />
          </div>
          <div class="field">
            <label>min</label>
            <input
              data-testid="min"
              onInput$={(_, currentTarget) => {
                const value = Number(currentTarget.value)
                min.value = value
                machine.controller.value.updateProps({ min: value })
              }}
              type="number"
              value={min.value}
            />
          </div>
          <div class="field">
            <label>max</label>
            <input
              data-testid="max"
              onInput$={(_, currentTarget) => {
                const value = Number(currentTarget.value)
                max.value = value
                machine.controller.value.updateProps({ max: value })
              }}
              type="number"
              value={max.value}
            />
          </div>
          <div class="field">
            <label>locale</label>
            <select
              data-testid="locale"
              onInput$={(_, currentTarget) => {
                const value = currentTarget.value
                locale.value = value
                machine.controller.value.updateProps({ locale: value })
              }}
              value={locale.value}
            >
              <option value="en-US">en-US</option>
              <option value="en-GB">en-GB</option>
              <option value="fr-FR">fr-FR</option>
              <option value="de-DE">de-DE</option>
              <option value="ja-JP">ja-JP</option>
              <option value="mk-MK">mk-MK</option>
              <option value="zh-CN">zh-CN</option>
            </select>
          </div>
          <div class="field">
            <label>formatOptions.maximumFractionDigits</label>
            <input
              data-testid="formatOptions.maximumFractionDigits"
              onInput$={(_, currentTarget) => {
                maximumFractionDigits.value = currentTarget.value
                machine.controller.value.updateProps({
                  formatOptions: {
                    maximumFractionDigits: currentTarget.value === "" ? undefined : Number(currentTarget.value),
                    minimumFractionDigits:
                      minimumFractionDigits.value === "" ? undefined : Number(minimumFractionDigits.value),
                    style:
                      formatStyle.value === "" ? undefined : (formatStyle.value as "decimal" | "currency" | "percent"),
                    currency: currency.value,
                  },
                })
              }}
              type="number"
              value={maximumFractionDigits.value}
            />
          </div>
          <div class="field">
            <label>formatOptions.minimumFractionDigits</label>
            <input
              data-testid="formatOptions.minimumFractionDigits"
              onInput$={(_, currentTarget) => {
                minimumFractionDigits.value = currentTarget.value
                machine.controller.value.updateProps({
                  formatOptions: {
                    maximumFractionDigits:
                      maximumFractionDigits.value === "" ? undefined : Number(maximumFractionDigits.value),
                    minimumFractionDigits: currentTarget.value === "" ? undefined : Number(currentTarget.value),
                    style:
                      formatStyle.value === "" ? undefined : (formatStyle.value as "decimal" | "currency" | "percent"),
                    currency: currency.value,
                  },
                })
              }}
              type="number"
              value={minimumFractionDigits.value}
            />
          </div>
          <div class="field">
            <label>formatOptions.style</label>
            <select
              data-testid="formatOptions.style"
              onInput$={(_, currentTarget) => {
                formatStyle.value = currentTarget.value
                machine.controller.value.updateProps({
                  formatOptions: {
                    maximumFractionDigits:
                      maximumFractionDigits.value === "" ? undefined : Number(maximumFractionDigits.value),
                    minimumFractionDigits:
                      minimumFractionDigits.value === "" ? undefined : Number(minimumFractionDigits.value),
                    style:
                      currentTarget.value === ""
                        ? undefined
                        : (currentTarget.value as "decimal" | "currency" | "percent"),
                    currency: currency.value,
                  },
                })
              }}
              value={formatStyle.value}
            >
              <option value="">---</option>
              <option value="decimal">decimal</option>
              <option value="currency">currency</option>
              <option value="percent">percent</option>
            </select>
          </div>
          <div class="field">
            <label>formatOptions.currency</label>
            <select
              data-testid="formatOptions.currency"
              onInput$={(_, currentTarget) => {
                currency.value = currentTarget.value
                machine.controller.value.updateProps({
                  formatOptions: {
                    maximumFractionDigits:
                      maximumFractionDigits.value === "" ? undefined : Number(maximumFractionDigits.value),
                    minimumFractionDigits:
                      minimumFractionDigits.value === "" ? undefined : Number(minimumFractionDigits.value),
                    style:
                      formatStyle.value === "" ? undefined : (formatStyle.value as "decimal" | "currency" | "percent"),
                    currency: currentTarget.value,
                  },
                })
              }}
              value={currency.value}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="JPY">JPY</option>
              <option value="GBP">GBP</option>
              <option value="MXN">MXN</option>
              <option value="CNY">CNY</option>
            </select>
          </div>
        </div>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Number Input | Zag Qwik Examples",
}

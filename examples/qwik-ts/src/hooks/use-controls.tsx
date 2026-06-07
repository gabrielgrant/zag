import { $, component$, useComputed$, useSignal, type QRL, type Signal } from "@qwik.dev/core"
import { deepGet, deepSet, getControlDefaults, getTransformedControlValues, type ControlRecord } from "@zag-js/shared"

export function useControls<T extends ControlRecord>(config: T) {
  const state = useSignal(getControlDefaults(config))
  const context = useComputed$(() => getTransformedControlValues(config, state.value))

  return {
    config,
    context,
    state,
  }
}

interface ControlsProps {
  config: ControlRecord
  onChange$?: QRL<(context: Record<string, any>) => void>
  state: Signal<Record<string, any>>
}

function getContext(config: ControlRecord, state: Record<string, any>) {
  return getTransformedControlValues(config as any, state as any) as Record<string, any>
}

function getNextState(state: Record<string, any>, key: string, value: any) {
  const nextState = structuredClone(state)
  deepSet(nextState, key, value)
  return nextState
}

export const Controls = component$<ControlsProps>((props) => {
  const setState = $((key: string, value: any) => {
    const nextState = getNextState(props.state.value, key, value)
    props.state.value = nextState
    props.onChange$?.(getContext(props.config, nextState))
  })

  return (
    <div class="controls-container">
      {Object.keys(props.config).map((key) => {
        const control = props.config[key]
        if (!control) return null

        const { label = key, type } = control
        const value = deepGet(props.state.value, key)

        switch (type) {
          case "boolean":
            return (
              <div class="checkbox" key={key}>
                <input
                  checked={value}
                  data-testid={key}
                  id={label}
                  onInput$={(_, currentTarget) => {
                    setState(key, currentTarget.checked)
                  }}
                  type="checkbox"
                />
                <label for={label}>{label}</label>
              </div>
            )
          case "string":
            return (
              <div class="text" key={key}>
                <label style={{ marginRight: "10px" }}>{label}</label>
                <input
                  data-testid={key}
                  onKeyDown$={(event, currentTarget) => {
                    if (event.key === "Enter") setState(key, currentTarget.value)
                  }}
                  placeholder={control.placeholder}
                  type="text"
                  value={value ?? ""}
                />
              </div>
            )
          case "select":
            return (
              <div class="text" key={key}>
                <label for={label} style={{ marginRight: "10px" }}>
                  {label}
                </label>
                <select
                  data-testid={key}
                  id={label}
                  onInput$={(_, currentTarget) => {
                    setState(key, currentTarget.value)
                  }}
                  value={value ?? "-----"}
                >
                  <option>-----</option>
                  {control.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )
          case "number":
            return (
              <div class="text" key={key}>
                <label for={label} style={{ marginRight: "10px" }}>
                  {label}
                </label>
                <input
                  data-testid={key}
                  id={label}
                  max={control.max}
                  min={control.min}
                  onKeyDown$={(event, currentTarget) => {
                    if (event.key !== "Enter") return
                    const nextValue = Number.parseFloat(currentTarget.value)
                    setState(key, Number.isNaN(nextValue) ? 0 : nextValue)
                  }}
                  type="number"
                  value={value ?? ""}
                />
              </div>
            )
          case "date":
            return (
              <div class="text" key={key}>
                <label for={label} style={{ marginRight: "10px" }}>
                  {label}
                </label>
                <input
                  data-testid={key}
                  id={label}
                  onInput$={(_, currentTarget) => {
                    setState(key, currentTarget.value)
                  }}
                  placeholder={control.defaultValue}
                  type="date"
                  value={value ?? ""}
                />
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
})

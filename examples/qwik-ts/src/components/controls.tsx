import * as allControls from "@zag-js/shared"
import { deepGet, deepSet } from "@zag-js/shared"
import type { ControlsRef } from "~/hooks/use-controls"

/**
 * Inline component (no `component$`): renders within the parent's context.
 * Receives only the config's export name + the value store (both
 * serializable); the config itself — which may contain functions — is looked
 * up from @zag-js/shared at render time. Event handlers below are extracted
 * as QRLs by the optimizer and may only capture serializable values — the
 * store and string keys.
 */
export const Controls = (props: { store: ControlsRef }) => {
  const { name, state, config: inlineConfig } = props.store
  // inline route configs travel with the ref; named configs are looked up
  const config = inlineConfig ?? (allControls as any)[name] ?? {}

  return (
    <div class="controls-container">
      {Object.keys(config).map((key) => {
        const { type, label = key, options, placeholder, min, max } = (config[key] ?? {}) as any
        const value = deepGet(state, key)
        switch (type) {
          case "boolean":
            return (
              <div key={key} class="checkbox">
                <input
                  data-testid={key}
                  id={label}
                  type="checkbox"
                  checked={value}
                  onChange$={(_event, el) => {
                    deepSet(state, key, el.checked)
                  }}
                />
                <label for={label}>{label}</label>
              </div>
            )
          case "string":
            return (
              <div key={key} class="text">
                <label style={{ marginRight: "10px" }}>{label}</label>
                <input
                  data-testid={key}
                  type="text"
                  placeholder={placeholder}
                  value={value}
                  onKeyDown$={(event, el) => {
                    if (event.key === "Enter") {
                      deepSet(state, key, el.value)
                    }
                  }}
                />
              </div>
            )
          case "select":
            return (
              <div key={key} class="text">
                <label for={label} style={{ marginRight: "10px" }}>
                  {label}
                </label>
                <select
                  data-testid={key}
                  id={label}
                  value={value}
                  onChange$={(_event, el) => {
                    deepSet(state, key, el.value)
                  }}
                >
                  <option>-----</option>
                  {(options as any[]).map((option) => (
                    <option key={option} value={option} selected={option === value}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )
          case "number":
            return (
              <div key={key} class="text">
                <label for={label} style={{ marginRight: "10px" }}>
                  {label}
                </label>
                <input
                  data-testid={key}
                  id={label}
                  type="number"
                  min={min}
                  max={max}
                  value={value}
                  onKeyDown$={(event, el) => {
                    if (event.key === "Enter") {
                      const val = parseFloat(el.value)
                      deepSet(state, key, isNaN(val) ? 0 : val)
                    }
                  }}
                />
              </div>
            )
          case "date":
            return (
              <div key={key} class="text">
                <label for={label} style={{ marginRight: "10px" }}>
                  {label}
                </label>
                <input
                  data-testid={key}
                  id={label}
                  type="date"
                  placeholder={placeholder}
                  value={value}
                  onChange$={(_event, el) => {
                    deepSet(state, key, el.value)
                  }}
                />
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

import { useStore, useVisibleTask$ } from "@qwik.dev/core"
import * as allControls from "@zag-js/shared"
import {
  deepSet,
  getControlDefaults,
  getTransformedControlValues,
  type ControlRecord,
  type ControlValue,
} from "@zag-js/shared"

/**
 * Serializable handle for the controls panel: control configs may contain
 * functions (e.g. `transformValue`), so only the config's export *name* and
 * the value store may cross a component$ boundary — the config itself is
 * looked up again from @zag-js/shared on the other side.
 */
export interface ControlsRef {
  name: string
  state: any
  /**
   * Inline configs (defined in a route rather than exported from
   * @zag-js/shared) have no resolvable name, so the config travels with the
   * ref. Only serializable configs (no `transformValue`) can cross the
   * component$ boundary this way — which inline route configs are.
   */
  config?: ControlRecord
}

export interface UseControlsReturn<T extends ControlRecord = ControlRecord> {
  config: T
  state: ControlValue<T>
  /** machine props view: raw values with each control's transform applied */
  values: () => ControlValue<T>
  /** what gets passed to <Toolbar/> (crosses a component$ boundary) */
  ref: ControlsRef
}

export function useControls<T extends ControlRecord>(config: T): UseControlsReturn<T> {
  const state = useStore<any>(getControlDefaults(config), { deep: true })
  // subscribe the calling component to every control value: machine props
  // accessors read the store lazily (at event time), which does not register
  // render subscriptions — without this, control edits would never re-render
  // the page (and machine `watch` would never observe prop changes)
  for (const key of Object.keys(state)) void state[key]
  // The panel's onChange$/onKeyDown$ handlers are lazy QRLs and can run after
  // the next interaction; e2e flips a control and interacts right away (as the
  // other examples apply control changes synchronously), so also apply edits
  // from native listeners during the same event. The QRLs then write the same
  // value again.
  const keys = Object.keys(config)
  useVisibleTask$(
    ({ cleanup }) => {
      const apply = (event: Event) => {
        const el = event.target as HTMLInputElement | HTMLSelectElement
        const key = el.dataset?.testid
        if (!key || !keys.includes(key) || !el.closest(".controls-container")) return
        if (event.type === "keydown") {
          if ((event as KeyboardEvent).key !== "Enter") return
          if (el.type === "number") {
            const val = parseFloat(el.value)
            deepSet(state, key, isNaN(val) ? 0 : val)
          } else if (el.type === "text") deepSet(state, key, el.value)
          return
        }
        if (el.type === "checkbox") deepSet(state, key, (el as HTMLInputElement).checked)
        else if (el.tagName === "SELECT" || el.type === "date") deepSet(state, key, el.value)
      }
      document.addEventListener("change", apply, true)
      document.addEventListener("keydown", apply, true)
      cleanup(() => {
        document.removeEventListener("change", apply, true)
        document.removeEventListener("keydown", apply, true)
      })
    },
    { strategy: "document-ready" },
  )

  const name = Object.keys(allControls).find((key) => (allControls as any)[key] === config) ?? ""
  return {
    config,
    state,
    values: () => getTransformedControlValues(config, state) as ControlValue<T>,
    // named (shared) configs may hold functions, so pass them by name only;
    // inline configs are serializable and travel with the ref
    ref: { name, state, config: name ? undefined : config },
  }
}

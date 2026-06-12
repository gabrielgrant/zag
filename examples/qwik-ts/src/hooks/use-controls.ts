import { useStore } from "@qwik.dev/core"
import * as allControls from "@zag-js/shared"
import { getControlDefaults, getTransformedControlValues, type ControlRecord, type ControlValue } from "@zag-js/shared"

/**
 * Serializable handle for the controls panel: control configs may contain
 * functions (e.g. `transformValue`), so only the config's export *name* and
 * the value store may cross a component$ boundary — the config itself is
 * looked up again from @zag-js/shared on the other side.
 */
export interface ControlsRef {
  name: string
  state: any
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
  const name = Object.keys(allControls).find((key) => (allControls as any)[key] === config) ?? ""
  return {
    config,
    state,
    values: () => getTransformedControlValues(config, state) as ControlValue<T>,
    ref: { name, state },
  }
}

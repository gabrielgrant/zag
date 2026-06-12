import { useStore } from "@qwik.dev/core"
import { getControlDefaults, type ControlRecord, type ControlValue } from "@zag-js/shared"

export interface UseControlsReturn<T extends ControlRecord = ControlRecord> {
  config: T
  state: ControlValue<T>
}

export function useControls<T extends ControlRecord>(config: T): UseControlsReturn<T> {
  // the store is serializable, so it can safely cross component$ boundaries
  // and be captured by event handler QRLs
  const state = useStore<any>(getControlDefaults(config), { deep: true })
  return { config, state }
}

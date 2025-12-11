import type { RefObject } from "@zag-js/core"
import { useSignal } from "@builder.io/qwik"

export function useRefs<T extends Record<string, RefObject>>(refs: T): T {
  const result = {} as T
  for (const key in refs) {
    const ref = refs[key]
    const signal = useSignal<HTMLElement | null>(null)
    result[key] = {
      get current() {
        return signal.value
      },
      set current(value) {
        signal.value = value
      },
    } as any
  }
  return result
}

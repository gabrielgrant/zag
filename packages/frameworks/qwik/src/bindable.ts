import type { Bindable, BindableOptions } from "@zag-js/core"
import { useSignal, type Signal } from "@builder.io/qwik"
import { isEqual } from "@zag-js/utils"

export function createBindable<T>(options: BindableOptions<T>): Bindable<T> {
  const { defaultValue, onChange, hash = isEqual } = options
  const signal = useSignal<T>(defaultValue)
  const initial = defaultValue

  return {
    initial,
    get() {
      return signal.value
    },
    set(value: T) {
      const prev = signal.value
      if (hash(value, prev)) return
      signal.value = value
      onChange?.(value, prev)
    },
    invoke(value: T, prev: T) {
      onChange?.(value, prev)
    },
    hash,
  }
}

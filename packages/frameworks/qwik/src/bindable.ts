import type { Bindable, BindableParams } from "@zag-js/core"
import { useSignal, useOnDocument } from "@builder.io/qwik"
import { isFunction } from "@zag-js/utils"

export function createBindable<T>(props: () => BindableParams<T>): Bindable<T> {
  const initial = props().defaultValue ?? props().value
  const eq = props().isEqual ?? Object.is

  const v = useSignal(initial)
  const controlled = () => props().value !== undefined
  const valueRef = useSignal(controlled() ? props().value : v.value)

  return {
    initial,
    ref: valueRef,
    get(): T {
      return (controlled() ? props().value : v.value) as T
    },
    set(val: T | ((prev: T) => T)) {
      const prev = controlled() ? props().value : v.value
      const next = isFunction(val) ? val(prev as T) : val
      if (props().debug) {
        console.log(`[bindable > ${props().debug}] setValue`, { next, prev })
      }

      if (!controlled()) v.value = next
      if (!eq(next, prev)) {
        props().onChange?.(next, prev)
      }
    },
    invoke(nextValue: T, prevValue: T) {
      props().onChange?.(nextValue, prevValue)
    },
    hash(value: T) {
      return props().hash?.(value) ?? String(value)
    },
  }
}

createBindable.cleanup = (fn: VoidFunction) => {
  // Qwik will handle cleanup via useVisibleTask$ cleanup function
  // This is a no-op that gets called from the machine
}

createBindable.ref = <T>(defaultValue: T) => {
  let value = defaultValue
  return {
    get: () => value,
    set: (next: T) => {
      value = next
    },
  }
}

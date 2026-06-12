import type { Bindable, BindableParams } from "@zag-js/core"
import { isFunction } from "@zag-js/utils"
import { useSignal } from "@qwik.dev/core"

/**
 * Creates a `Bindable` backed by a Qwik signal.
 *
 * The signal is part of Qwik's sequential component scope, so its value is
 * serialized on SSR and resumed on the client for free. Reads during render
 * register fine-grained subscriptions, so any component calling `connect()`
 * re-renders when the value changes.
 *
 * Note: the `sync` flag is a no-op. Qwik has no public `flushSync`; signal
 * values are synchronously consistent and the DOM is reconciled by Qwik's
 * scheduler.
 */
export function useBindable<T>(props: () => BindableParams<T>): Bindable<T> {
  const initialValue = props().value ?? props().defaultValue

  // both signals resume from SSR; the initial signal is never written
  const initialSig = useSignal<T | undefined>(() => initialValue)
  const valueSig = useSignal<T | undefined>(() => initialValue)

  const controlled = () => props().value !== undefined

  const get = (): T => {
    return (controlled() ? props().value : valueSig.value) as T
  }

  const set = (value: T | ((prev: T) => T)) => {
    const eq = props().isEqual ?? Object.is
    const prev = get()
    const next = isFunction(value) ? value(prev) : value

    if (props().debug) {
      console.log(`[bindable > ${props().debug}] setValue`, { next, prev })
    }

    if (!controlled()) valueSig.value = next
    if (!eq(next, prev)) {
      props().onChange?.(next, prev)
    }
  }

  return {
    initial: initialSig.value,
    ref: {
      get current() {
        return get()
      },
    },
    get,
    set,
    invoke(nextValue: T, prevValue: T) {
      props().onChange?.(nextValue, prevValue)
    },
    hash(value: T) {
      return props().hash?.(value) ?? String(value)
    },
  }
}

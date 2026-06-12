import type { Bindable, BindableParams } from "@zag-js/core"
import { isFunction } from "@zag-js/utils"
import { useSignal } from "@qwik.dev/core"
import { decodeValue, encodeValue } from "./value-serializer"

/**
 * Creates a `Bindable` backed by a Qwik signal.
 *
 * The signal is part of Qwik's sequential component scope, so its value is
 * serialized on SSR and resumed on the client for free. Reads during render
 * register fine-grained subscriptions, so any component calling `connect()`
 * re-renders when the value changes.
 *
 * Values pass through the value-serializer registry on write and decode on
 * read, so machines holding class instances in context (DateValue, Color)
 * stay SSR-serializable — see value-serializer.ts.
 *
 * Note: the `sync` flag is a no-op. Qwik has no public `flushSync`; signal
 * values are synchronously consistent and the DOM is reconciled by Qwik's
 * scheduler.
 */
export function useBindable<T>(props: () => BindableParams<T>): Bindable<T> {
  const initialValue = props().value ?? props().defaultValue

  // both signals resume from SSR; the initial signal is never written
  const initialSig = useSignal<unknown>(() => encodeValue(initialValue))
  const valueSig = useSignal<unknown>(() => encodeValue(initialValue))

  const controlled = () => props().value !== undefined

  const get = (): T => {
    return (controlled() ? props().value : decodeValue(valueSig.value)) as T
  }

  const set = (value: T | ((prev: T) => T)) => {
    const eq = props().isEqual ?? Object.is
    const prev = get()
    const next = isFunction(value) ? value(prev) : value

    if (props().debug) {
      console.log(`[bindable > ${props().debug}] setValue`, { next, prev })
    }

    if (!controlled()) valueSig.value = encodeValue(next)
    if (!eq(next, prev)) {
      props().onChange?.(next, prev)
    }
  }

  return {
    initial: decodeValue(initialSig.value) as T | undefined,
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

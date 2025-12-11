import type { Bindable } from "@zag-js/core"
import { useTask$ } from "@builder.io/qwik"

export function useTrack<T>(bindable: Bindable<T>, fn: (value: T) => void) {
  useTask$(({ track }) => {
    track(() => bindable.get())
    fn(bindable.get())
  })
}

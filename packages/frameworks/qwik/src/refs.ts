import type { BindableRefs } from "@zag-js/core"

export function createRefs<T extends Record<string, any>>(refs: T): BindableRefs<T> {
  const ref = { current: refs }
  return {
    get<K extends keyof T>(key: K): T[K] {
      return (ref.current as any)[key]
    },
    set<K extends keyof T>(key: K, value: T[K]) {
      ;(ref.current as any)[key] = value
    },
  } as BindableRefs<T>
}

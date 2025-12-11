export function useRefs<T>(refs: T) {
  const refStore = { current: refs }
  return {
    get<K extends keyof T>(key: K): T[K] {
      return refStore.current[key]
    },
    set<K extends keyof T>(key: K, value: T[K]) {
      refStore.current[key] = value
    },
  }
}

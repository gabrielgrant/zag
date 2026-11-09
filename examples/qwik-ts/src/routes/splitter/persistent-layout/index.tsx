import { component$, useId, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as splitter from "@zag-js/splitter"
import { isEqual } from "@zag-js/utils"

const storageKey = "zag:splitter:persistent-layout"

const getPanels = (showInspector: boolean) =>
  [
    { id: "nav", minSize: 20 },
    { id: "content", minSize: 30 },
    showInspector && { id: "inspector", minSize: 20 },
  ].filter(Boolean) as splitter.PanelData[]

export default component$(() => {
  const showInspector = useSignal(true)

  // Qwik counterpart of the React example's usePersistentMapState: a map of
  // layout key -> sizes, read from localStorage once on the client. Writes
  // before that read are ignored so mount-time callbacks can't overwrite the
  // persisted state.
  const sizeMap = useSignal<Record<string, number[]>>({})
  const hydrated = useSignal(false)

  useVisibleTask$(
    () => {
      try {
        const raw = window.localStorage.getItem(storageKey)
        if (raw != null) sizeMap.value = JSON.parse(raw)
      } catch {
        // Ignore access errors in private browsing or restricted environments.
      } finally {
        hydrated.value = true
      }
    },
    { strategy: "document-ready" },
  )

  const panels = getPanels(showInspector.value)
  const key = splitter.layout(panels)
  const size = sizeMap.value[key] ?? []

  const id = useId()
  const service = useMachine(splitter.machine, () => {
    const panels = getPanels(showInspector.value)
    const key = splitter.layout(panels)
    return {
      id,
      panels,
      size: sizeMap.value[key] ?? [],
      onResize: (details) => {
        if (!hydrated.value) return
        const next = { ...sizeMap.value, [key]: details.size }
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next))
        } catch {
          // Ignore access errors in private browsing or restricted environments.
        }
        sizeMap.value = next
      },
    } satisfies splitter.Props
  })

  const api = splitter.connect(service, normalizeProps)

  const machineSizes = api.getSizes()
  const ready = hydrated.value && (size.length === 0 || isEqual(machineSizes, size))

  return (
    <main class="splitter" style={{ visibility: ready ? "visible" : "hidden" }}>
      <pre>{JSON.stringify(api.getSizes())}</pre>
      <button onClick$={() => (showInspector.value = !showInspector.value)}>
        {showInspector.value ? "Hide Inspector" : "Show Inspector"}
      </button>

      <div {...api.getRootProps()}>
        <div {...api.getPanelProps({ id: "nav" })}>
          <p>Nav</p>
        </div>
        <div {...api.getResizeTriggerProps({ id: "nav:content" })} />
        <div {...api.getPanelProps({ id: "content" })}>
          <p>Content</p>
        </div>
        {showInspector.value && (
          <>
            <div {...api.getResizeTriggerProps({ id: "content:inspector" })} />
            <div {...api.getPanelProps({ id: "inspector" })}>
              <p>Inspector</p>
            </div>
          </>
        )}
      </div>
    </main>
  )
})

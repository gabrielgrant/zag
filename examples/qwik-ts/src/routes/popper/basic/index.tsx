import { component$, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import { getPlacement, getPlacementStyles } from "@zag-js/popper"

export default component$(() => {
  const referenceRef = useSignal<HTMLButtonElement>()
  const floatingRef = useSignal<HTMLDivElement>()

  useVisibleTask$(
    ({ cleanup }) => {
      const floating = floatingRef.value
      if (!referenceRef.value || !floating) return
      const stop = getPlacement(referenceRef.value, floating, {
        placement: "right-start",
        onComplete(data) {
          // Applied to the node directly rather than through a re-rendered
          // `style` prop: Qwik rewrites the whole style attribute on change,
          // which would drop the `--x`/`--y` vars popper writes onto the node.
          const styles = getPlacementStyles(data).floating as Record<string, string | undefined>
          for (const [key, value] of Object.entries(styles)) {
            const prop = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
            if (value == null) floating.style.removeProperty(prop)
            else floating.style.setProperty(prop, value)
          }
        },
      })
      cleanup(() => stop?.())
    },
    { strategy: "document-ready" },
  )

  const styles = getPlacementStyles({})

  return (
    <div>
      <button ref={referenceRef}>Hello StackBlitz!</button>
      <div style={styles.floating} ref={floatingRef}>
        Start editing to see some magic happen :)
      </div>
    </div>
  )
})

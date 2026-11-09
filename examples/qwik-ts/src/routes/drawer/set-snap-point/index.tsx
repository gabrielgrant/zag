import { component$, useId, useSignal } from "@qwik.dev/core"
import * as drawer from "@zag-js/drawer"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { usePresence } from "~/lib/dialog-presence"
import styles from "@shared/styles/drawer.module.css"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: drawer.Api } = {}

export default component$(() => {
  const id = useId()
  const log = useSignal<(string | number | null)[]>([])

  const service = useMachine(drawer.machine, () => ({
    id,
    snapPoints: ["20rem", "30rem", 1],
    defaultSnapPoint: "20rem",
    closeOnInteractOutside: false,
    onSnapPointChange(details: drawer.SnapPointChangeDetails) {
      log.value = [...log.value, details.snapPoint]
    },
  }))

  const api = drawer.connect(service, normalizeProps)
  const backdropPresence = usePresence(() => api.getBackdropProps())
  const contentPresence = usePresence(() => api.getContentProps())
  apiRef.current = api

  return (
    <main>
      <div data-testid="snap-point">{String(api.snapPoint)}</div>
      <div data-testid="snap-point-log">{log.value.join(",")}</div>
      <div data-testid="open-state">{String(api.open)}</div>

      <button class={styles.trigger} {...api.getTriggerProps()}>
        Open
      </button>

      <div class={styles.backdrop} {...backdropPresence.props} />
      <div class={styles.positioner} {...api.getPositionerProps()}>
        <div class={styles.content} {...contentPresence.props}>
          <div class={styles.grabber} {...api.getGrabberProps()}>
            <div class={styles.grabberIndicator} {...api.getGrabberIndicatorProps()} />
          </div>
          <div {...api.getTitleProps()}>Drawer</div>

          <button data-testid="reset" onClick$={() => (log.value = [])}>
            Reset log
          </button>

          <button data-testid="set-30" onClick$={() => apiRef.current?.setSnapPoint("30rem")}>
            setSnapPoint(30rem)
          </button>

          <button
            data-testid="set-30-then-20"
            onClick$={() => {
              apiRef.current?.setSnapPoint("30rem")
              apiRef.current?.setSnapPoint("20rem")
            }}
          >
            setSnapPoint(30rem) then setSnapPoint(20rem)
          </button>

          <button
            data-testid="set-30-then-full"
            onClick$={() => {
              apiRef.current?.setSnapPoint("30rem")
              apiRef.current?.setSnapPoint(1)
            }}
          >
            setSnapPoint(30rem) then setSnapPoint(1)
          </button>

          <button
            data-testid="set-30-repeatedly"
            onClick$={() => {
              for (let i = 0; i < 5; i++) apiRef.current?.setSnapPoint("30rem")
            }}
          >
            setSnapPoint(30rem) five times
          </button>
        </div>
      </div>
    </main>
  )
})

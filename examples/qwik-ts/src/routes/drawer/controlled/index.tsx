import { component$, useId, useSignal } from "@qwik.dev/core"
import * as drawer from "@zag-js/drawer"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { usePresence } from "~/lib/dialog-presence"
import styles from "@shared/styles/drawer.module.css"

const AlwaysOpenDrawer = component$(() => {
  const service = useMachine(drawer.machine, {
    id: useId(),
    open: true,
  })

  const api = drawer.connect(service, normalizeProps)
  const backdropPresence = usePresence(() => api.getBackdropProps())
  const contentPresence = usePresence(() => api.getContentProps())

  return (
    <div>
      <h3>Always Open (no onOpenChange)</h3>
      <p style={{ fontSize: 14, color: "#6b7280" }}>
        This drawer has <code>open: true</code> without <code>onOpenChange</code>. Swiping, escape, and outside click
        should have no effect.
      </p>
      <div class={styles.backdrop} {...backdropPresence.props} />
      <div class={styles.positioner} {...api.getPositionerProps()}>
        <div class={styles.content} {...contentPresence.props}>
          <div class={styles.grabber} {...api.getGrabberProps()}>
            <div class={styles.grabberIndicator} {...api.getGrabberIndicatorProps()} />
          </div>
          <div {...api.getTitleProps()}>Always Open</div>
          <p {...api.getDescriptionProps()}>
            Try swiping down, pressing Escape, or clicking outside. This drawer should never close.
          </p>
        </div>
      </div>
    </div>
  )
})

const ControlledDrawer = component$(() => {
  const id = useId()
  const open = useSignal(false)

  const service = useMachine(drawer.machine, () => ({
    id,
    open: open.value,
    onOpenChange(details: drawer.OpenChangeDetails) {
      open.value = details.open
    },
  }))

  const api = drawer.connect(service, normalizeProps)
  const backdropPresence = usePresence(() => api.getBackdropProps())
  const contentPresence = usePresence(() => api.getContentProps())

  return (
    <div>
      <h3>Controlled (open + onOpenChange)</h3>
      <p style={{ fontSize: 14, color: "#6b7280" }}>Standard controlled mode. Open state is managed by React.</p>
      <button class={styles.trigger} {...api.getTriggerProps()}>
        Open Controlled
      </button>
      <div class={styles.backdrop} {...backdropPresence.props} />
      <div class={styles.positioner} {...api.getPositionerProps()}>
        <div class={styles.content} {...contentPresence.props}>
          <div class={styles.grabber} {...api.getGrabberProps()}>
            <div class={styles.grabberIndicator} {...api.getGrabberIndicatorProps()} />
          </div>
          <div {...api.getTitleProps()}>Controlled Drawer</div>
          <p {...api.getDescriptionProps()}>
            This drawer is fully controlled. Swipe, escape, and outside click all work.
          </p>
          <p style={{ fontSize: 14 }}>
            Open: <strong>{String(open.value)}</strong>
          </p>
          <button {...api.getCloseTriggerProps()}>Close</button>
        </div>
      </div>
    </div>
  )
})

export default component$(() => {
  const scenario = useSignal<"always-open" | "controlled">("controlled")

  return (
    <main style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          class={styles.trigger}
          onClick$={() => (scenario.value = "always-open")}
          style={{ fontWeight: scenario.value === "always-open" ? 700 : 400 }}
        >
          Always Open
        </button>
        <button
          class={styles.trigger}
          onClick$={() => (scenario.value = "controlled")}
          style={{ fontWeight: scenario.value === "controlled" ? 700 : 400 }}
        >
          Controlled
        </button>
      </div>

      {scenario.value === "always-open" && <AlwaysOpenDrawer />}
      {scenario.value === "controlled" && <ControlledDrawer />}
    </main>
  )
})

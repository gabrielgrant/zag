import { component$, useId } from "@qwik.dev/core"
import * as drawer from "@zag-js/drawer"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import { usePresence } from "~/lib/dialog-presence"
import styles from "@shared/styles/drawer.module.css"

export default component$(() => {
  const service = useMachine(drawer.machine, {
    id: useId(),
    modal: false,
    closeOnInteractOutside: false,
    swipeDirection: "end",
  })

  const api = drawer.connect(service, normalizeProps)
  const contentPresence = usePresence(() => api.getContentProps())

  return (
    <main style={{ padding: 24 }}>
      <button class={styles.trigger} {...api.getTriggerProps()}>
        Open Drawer
      </button>

      <div style={{ marginTop: 24, padding: 16, border: "1px dashed #d1d5db", borderRadius: 8 }}>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          This area stays interactive while the drawer is open. Try typing below:
        </p>
        <input
          type="text"
          placeholder="Type something..."
          style={{
            width: "100%",
            padding: "8px 12px",
            marginTop: 8,
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            fontSize: 16,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div class={styles.positioner} {...api.getPositionerProps()}>
        <div class={styles.content} {...contentPresence.props}>
          <div {...api.getTitleProps()}>Non-modal Drawer</div>
          <p
            {...mergeProps(api.getDescriptionProps(), {
              style: { color: "#6b7280", margin: "8px 0 0", padding: "0 16px" },
            })}
          >
            No backdrop, no focus trap, no scroll lock. The page behind stays fully interactive. Close with the button,
            drag to dismiss, or Escape.
          </p>
          <div style={{ padding: 16 }}>
            <button {...api.getCloseTriggerProps()}>Close</button>
          </div>
        </div>
      </div>
    </main>
  )
})

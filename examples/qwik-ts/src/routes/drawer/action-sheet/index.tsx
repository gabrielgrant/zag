import { component$, useId } from "@qwik.dev/core"
import * as drawer from "@zag-js/drawer"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { usePresence } from "~/lib/dialog-presence"
import styles from "@shared/styles/drawer-action-sheet.module.css"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: drawer.Api } = {}

export default component$(() => {
  const service = useMachine(drawer.machine, {
    id: useId(),
  })

  const api = drawer.connect(service, normalizeProps)
  const backdropPresence = usePresence(() => api.getBackdropProps())
  const contentPresence = usePresence(() => api.getContentProps({ draggable: false }))
  apiRef.current = api

  return (
    <main>
      <button class={styles.trigger} {...api.getTriggerProps()}>
        Manage Profile
      </button>
      <div class={styles.backdrop} {...backdropPresence.props} />
      <div class={styles.positioner} {...api.getPositionerProps()}>
        <div class={styles.popup} {...contentPresence.props}>
          <div class={styles.surface}>
            <div {...api.getTitleProps()} class={styles.title}>
              Profile Actions
            </div>
            <ul class={styles.actions}>
              <li class={styles.action}>
                <button class={styles.actionButton} onClick$={() => apiRef.current?.setOpen(false)}>
                  Edit Profile
                </button>
              </li>
              <li class={styles.action}>
                <button class={styles.actionButton} onClick$={() => apiRef.current?.setOpen(false)}>
                  Change Avatar
                </button>
              </li>
              <li class={styles.action}>
                <button class={styles.actionButton} onClick$={() => apiRef.current?.setOpen(false)}>
                  Privacy Settings
                </button>
              </li>
            </ul>
          </div>

          <div class={styles.dangerSurface}>
            <button class={styles.dangerButton} onClick$={() => apiRef.current?.setOpen(false)}>
              Delete Account
            </button>
          </div>

          <div class={styles.surface}>
            <button class={styles.actionButton} {...api.getCloseTriggerProps()}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </main>
  )
})

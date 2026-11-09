import { component$, useId, useSignal } from "@qwik.dev/core"
import * as drawer from "@zag-js/drawer"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { usePresence } from "~/lib/dialog-presence"
import styles from "@shared/styles/drawer-nested.module.css"

// React portals the second and third drawers to the body; here they render inline
export default component$(() => {
  const baseId = useId()
  const firstOpen = useSignal(false)
  const secondOpen = useSignal(false)
  const thirdOpen = useSignal(false)

  const firstService = useMachine(drawer.machine, () => ({
    id: `${baseId}-root`,
    open: firstOpen.value,
    onOpenChange: ({ open }: drawer.OpenChangeDetails) => {
      firstOpen.value = open
      if (!open) {
        secondOpen.value = false
        thirdOpen.value = false
      }
    },
  }))

  const secondService = useMachine(drawer.machine, () => ({
    id: `${baseId}-second`,
    open: secondOpen.value,
    onOpenChange: ({ open }: drawer.OpenChangeDetails) => {
      secondOpen.value = open
      if (!open) thirdOpen.value = false
    },
  }))

  const thirdService = useMachine(drawer.machine, () => ({
    id: `${baseId}-third`,
    open: thirdOpen.value,
    onOpenChange: ({ open }: drawer.OpenChangeDetails) => {
      thirdOpen.value = open
    },
  }))

  const firstApi = drawer.connect(firstService, normalizeProps)
  const firstBackdropPresence = usePresence(() => firstApi.getBackdropProps())
  const firstContentPresence = usePresence(() => firstApi.getContentProps())
  const secondApi = drawer.connect(secondService, normalizeProps)
  const secondContentPresence = usePresence(() => secondApi.getContentProps())
  const thirdApi = drawer.connect(thirdService, normalizeProps)
  const thirdContentPresence = usePresence(() => thirdApi.getContentProps())

  return (
    <main class={styles.main}>
      <button {...firstApi.getTriggerProps()} class={styles.button}>
        Open drawer stack
      </button>

      <div {...firstBackdropPresence.props} class={styles.backdrop} />
      <div {...firstApi.getPositionerProps()} class={styles.positioner}>
        <div {...firstContentPresence.props} class={styles.contentHost}>
          <div class={styles.popup}>
            <div {...firstApi.getGrabberProps()} class={styles.handle}>
              <div {...firstApi.getGrabberIndicatorProps()} />
            </div>
            <div class={styles.content}>
              <div {...firstApi.getTitleProps()} class={styles.title}>
                Account
              </div>
              <p class={styles.description}>
                Nested drawers can be styled to stack, while each drawer remains independently focus managed.
              </p>

              <div class={styles.actions}>
                <div class={styles.actionsLeft}>
                  <button {...secondApi.getTriggerProps()} class={styles.ghostButton}>
                    Security settings
                  </button>
                </div>
                <button {...firstApi.getCloseTriggerProps()} class={styles.button}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div {...secondApi.getPositionerProps()} class={styles.positioner}>
        <div {...secondContentPresence.props} class={styles.contentHost}>
          <div class={styles.popup}>
            <div {...secondApi.getGrabberProps()} class={styles.handle}>
              <div {...secondApi.getGrabberIndicatorProps()} />
            </div>
            <div class={styles.content}>
              <div {...secondApi.getTitleProps()} class={styles.title}>
                Security
              </div>
              <p class={styles.description}>Review sign-in activity and update your security preferences.</p>

              <ul class={styles.list}>
                <li>Passkeys enabled</li>
                <li>2FA via authenticator app</li>
                <li>3 signed-in devices</li>
              </ul>

              <div class={styles.actions}>
                <div class={styles.actionsLeft}>
                  <button {...thirdApi.getTriggerProps()} class={styles.ghostButton}>
                    Advanced options
                  </button>
                </div>
                <button {...secondApi.getCloseTriggerProps()} class={styles.button}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div {...thirdApi.getPositionerProps()} class={styles.positioner}>
        <div {...thirdContentPresence.props} class={styles.contentHost}>
          <div class={styles.popup}>
            <div {...thirdApi.getGrabberProps()} class={styles.handle}>
              <div {...thirdApi.getGrabberIndicatorProps()} />
            </div>
            <div class={styles.content}>
              <div {...thirdApi.getTitleProps()} class={styles.title}>
                Advanced
              </div>
              <p class={styles.description}>This drawer is taller to demonstrate variable-height stacking.</p>

              <div class={styles.field}>
                <label class={styles.label} for="device-name">
                  Device name
                </label>
                <input id="device-name" class={styles.input} value="Personal laptop" />
              </div>

              <div class={styles.field}>
                <label class={styles.label} for="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  class={styles.textarea}
                  value="Rotate recovery codes and revoke older sessions."
                  rows={3}
                />
              </div>

              <div class={styles.actions}>
                <button {...thirdApi.getCloseTriggerProps()} class={styles.button}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
})

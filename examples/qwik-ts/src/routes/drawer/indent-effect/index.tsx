import { component$, useId, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import * as drawer from "@zag-js/drawer"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import styles from "@shared/styles/drawer-indent-effect.module.css"

const stack = drawer.createStack()

export default component$(() => {
  const id = useId()
  const service = useMachine(drawer.machine, () => ({
    id,
    stack,
    modal: false,
  }))

  const api = drawer.connect(service, normalizeProps)

  // Qwik equivalent of useSyncExternalStore: bump a signal on stack changes
  // so the component re-renders and re-reads the snapshot (`stack` is a
  // module-level const, so the task QRL can reference it)
  const stackTick = useSignal(0)
  useVisibleTask$(({ cleanup }) => {
    cleanup(stack.subscribe(() => stackTick.value++))
  })
  void stackTick.value
  const stackApi = drawer.connectStack(stack.getSnapshot(), normalizeProps)

  return (
    <main class={styles.page}>
      <div class={styles.sandbox}>
        <div
          {...stackApi.getIndentBackgroundProps()}
          class={styles.indentBackground}
          data-testid="drawer-indent-background"
        />

        <div {...stackApi.getIndentProps()} class={styles.indent} data-testid="drawer-indent">
          <div class={styles.center}>
            <button class={styles.trigger} {...api.getTriggerProps()}>
              Open drawer
            </button>
          </div>
        </div>

        <div {...api.getBackdropProps()} class={styles.backdrop} data-testid="drawer-backdrop" />
        <div {...api.getPositionerProps()} class={styles.positioner}>
          <div {...api.getContentProps()} class={styles.content}>
            <div {...api.getGrabberProps()} class={styles.grabber}>
              <div {...api.getGrabberIndicatorProps()} class={styles.grabberIndicator} />
            </div>
            <div class={styles.contentInner}>
              <h2 class={styles.title} {...api.getTitleProps()}>
                Notifications
              </h2>
              <p class={styles.description} {...api.getDescriptionProps()}>
                You are all caught up. Good job!
              </p>
              <div class={styles.actions}>
                <button class={styles.close} {...api.getCloseTriggerProps()}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
})

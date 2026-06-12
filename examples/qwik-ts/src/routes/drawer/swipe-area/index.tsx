import { component$, useId } from "@qwik.dev/core"
import * as drawer from "@zag-js/drawer"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import styles from "@shared/styles/drawer.module.css"

export default component$(() => {
  const id = useId()
  const service = useMachine(drawer.machine, { id })

  const api = drawer.connect(service, normalizeProps)

  return (
    <>
      <main>
        <div class={styles.swipeArea} {...api.getSwipeAreaProps()} />
        <div class={styles.backdrop} {...api.getBackdropProps()} />
        <div class={styles.positioner} {...api.getPositionerProps()}>
          <div class={styles.content} {...api.getContentProps()}>
            <div class={styles.grabber} {...api.getGrabberProps()}>
              <div class={styles.grabberIndicator} {...api.getGrabberIndicatorProps()} />
            </div>
            <div {...api.getTitleProps()}>Drawer</div>
            <p {...api.getDescriptionProps()}>Swipe up from the bottom edge to open this drawer.</p>
            <button {...api.getCloseTriggerProps()}>Close</button>
            <div class={styles.scrollable} data-testid="scrollable">
              {Array.from({ length: 100 }).map((_element, index) => (
                <div key={index}>Item {index}</div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Toolbar>
        <StateVisualizer state={service} context={["dragOffset", "snapPoint", "contentSize"]} />
      </Toolbar>
    </>
  )
})

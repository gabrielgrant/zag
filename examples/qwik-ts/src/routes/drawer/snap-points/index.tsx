import { component$, useId } from "@qwik.dev/core"
import * as drawer from "@zag-js/drawer"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { drawerControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"
import styles from "@shared/styles/drawer.module.css"

export default component$(() => {
  const controls = useControls(drawerControls)
  const id = useId()

  const service = useMachine(
    drawer.machine,
    () =>
      ({
        id,
        snapPoints: ["20rem", 1],
        ...controls.values(),
      }) as any,
  )

  const api = drawer.connect(service, normalizeProps)

  return (
    <>
      <main>
        <button class={styles.trigger} {...api.getTriggerProps()}>
          Open
        </button>
        <div class={styles.backdrop} {...api.getBackdropProps()} />
        <div class={styles.positioner} {...api.getPositionerProps()}>
          <div class={styles.content} {...api.getContentProps()}>
            <div class={styles.grabber} {...api.getGrabberProps()}>
              <div class={styles.grabberIndicator} {...api.getGrabberIndicatorProps()} />
            </div>
            <div {...api.getTitleProps()}>Drawer</div>
            <div data-no-drag class={styles.noDrag}>
              No drag area
            </div>
            <div class={styles.scrollable}>
              {Array.from({ length: 100 }).map((_element, index) => (
                <div key={index}>Item {index}</div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} context={["dragOffset", "snapPoint", "resolvedActiveSnapPoint"]} />
      </Toolbar>
    </>
  )
})

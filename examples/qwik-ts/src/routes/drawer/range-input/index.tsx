import { component$, useId, useSignal } from "@qwik.dev/core"
import * as drawer from "@zag-js/drawer"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import { drawerControls } from "@zag-js/shared"
import { usePresence } from "~/lib/dialog-presence"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"
import styles from "@shared/styles/drawer.module.css"

export default component$(() => {
  const controls = useControls(drawerControls)
  const volume = useSignal(50)
  const id = useId()

  const service = useMachine(
    drawer.machine,
    () =>
      ({
        id,
        ...controls.values(),
      }) as any,
  )

  const api = drawer.connect(service, normalizeProps)
  const backdropPresence = usePresence(() => api.getBackdropProps())
  const contentPresence = usePresence(() => api.getContentProps())

  return (
    <>
      <main>
        <button class={styles.trigger} {...api.getTriggerProps()}>
          Open
        </button>
        <div class={styles.backdrop} {...backdropPresence.props} />
        <div class={styles.positioner} {...api.getPositionerProps()}>
          <div class={styles.content} {...contentPresence.props}>
            <div class={styles.grabber} {...api.getGrabberProps()}>
              <div class={styles.grabberIndicator} {...api.getGrabberIndicatorProps()} />
            </div>
            <div {...api.getTitleProps()}>Drawer + native range</div>
            <p
              {...mergeProps(api.getDescriptionProps(), {
                style: { padding: "0 16px", margin: "8px 0 0", fontSize: 14, color: "#555" },
              })}
            >
              Drag the slider horizontally. The sheet should not move or steal the gesture while adjusting the range.
            </p>
            <div style={{ padding: "16px", width: "100%", boxSizing: "border-box" }}>
              <label for="drawer-range-demo" style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
                Volume (native <code style={{ fontSize: 12 }}>&lt;input type=&quot;range&quot;&gt;</code>)
              </label>
              <input
                id="drawer-range-demo"
                type="range"
                min={0}
                max={100}
                value={volume.value}
                onInput$={(_e, el) => (volume.value = Number(el.value))}
                data-testid="drawer-native-range"
                style={{ width: "100%", touchAction: "auto" }}
              />
              <output style={{ display: "block", marginTop: 8, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                {volume.value}
              </output>
            </div>
            <div class={styles.scrollable} data-testid="scrollable">
              {Array.from({ length: 40 }).map((_element, index) => (
                <div key={index} style={{ padding: "4px 16px" }}>
                  Item {index}
                </div>
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

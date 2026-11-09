import { component$, Slot, useId } from "@qwik.dev/core"
import * as collapsible from "@zag-js/collapsible"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

interface CollapsibleProps {
  trigger: string
  debug?: boolean
  open?: boolean
}

const Collapsible = component$<CollapsibleProps>((props) => {
  const id = useId()
  const service = useMachine(collapsible.machine, () => ({ id, open: props.open }))
  const api = collapsible.connect(service, normalizeProps)
  return (
    <>
      <div {...api.getRootProps()}>
        <button {...api.getTriggerProps()}>{props.trigger}</button>
        <div {...mergeProps(api.getContentProps(), { style: { background: "red" } })}>
          <Slot />
        </div>
      </div>
      {props.debug && (
        <div style={{ position: "fixed", top: 0, right: 0 }}>
          <Toolbar viz>
            <StateVisualizer state={service} omit={["stylesRef"]} />
          </Toolbar>
        </div>
      )}
    </>
  )
})

export default component$(() => {
  return (
    <main>
      <Collapsible trigger="Collapsible Depth 1" debug>
        <p>
          Lorem dfd dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
          magna sfsd. Ut enim ad minimdfd v eniam
        </p>
        <Collapsible trigger="Sibling 1 / Collapsible Depth 2">
          <p>
            Lorem dfd dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
            magna sfsd. Ut enim ad minimdfd v eniam
          </p>
          <Collapsible trigger="Collapsible Depth 3">
            <p>
              Lorem dfd dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna sfsd. Ut enim ad minimdfd v eniam
            </p>
            <Collapsible trigger="Collapsible Depth 4">
              <p>
                Lorem dfd dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna sfsd. Ut enim ad minimdfd.
              </p>
              <Collapsible trigger="Collapsible Depth 5">
                <p>
                  Lorem dfd dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                  dolore magna sfsd. Ut enim ad minimdfd v eniam
                </p>
              </Collapsible>
            </Collapsible>
          </Collapsible>
        </Collapsible>

        <Collapsible trigger="Sibling 2">
          <p>
            Lorem dfd dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
            magna sfsd. Ut enim ad minimdfd v eniam
          </p>
        </Collapsible>
      </Collapsible>
    </main>
  )
})

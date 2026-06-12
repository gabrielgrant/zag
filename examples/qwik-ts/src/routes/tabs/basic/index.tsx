import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { tabsControls, tabsData } from "@zag-js/shared"
import * as tabs from "@zag-js/tabs"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(tabsControls)
  const id = useId()

  const service = useMachine(tabs.machine, {
    ...controls.state,
    id,
    defaultValue: "nils",
  } as tabs.Props)

  const api = tabs.connect(service, normalizeProps)

  return (
    <>
      <main class="tabs">
        <div {...api.getRootProps()}>
          <div {...api.getIndicatorProps()} />
          <div {...api.getListProps()}>
            {tabsData.map((data) => (
              <button {...api.getTriggerProps({ value: data.id })} key={data.id} data-testid={`${data.id}-tab`}>
                {data.label}
              </button>
            ))}
          </div>
          {tabsData.map((data) => (
            <div {...api.getContentProps({ value: data.id })} key={data.id} data-testid={`${data.id}-tab-panel`}>
              <p>{data.content}</p>
              {data.id === "agnes" ? <input placeholder="Agnes" /> : null}
            </div>
          ))}
        </div>
      </main>
      <Toolbar controls={controls}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

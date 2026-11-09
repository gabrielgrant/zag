import { component$, Fragment, Slot, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as splitter from "@zag-js/splitter"

// Created on first use rather than at module load (see cascade-select/basic):
// calling into the machine package while this module evaluates can hit a
// production-build chunk cycle.
let registryCache: ReturnType<typeof splitter.registry> | undefined
const getRegistry = () =>
  (registryCache ??= splitter.registry({
    // Touch-friendly margins
    hitAreaMargins: { coarse: 15, fine: 8 },
  }))

export interface PanelGroupProps {
  orientation?: splitter.Props["orientation"]
  defaultSize?: splitter.Props["defaultSize"]
  panels: splitter.PanelData[]
  /** share one splitter registry between groups (enables multi-drag) */
  multiDrag?: boolean
}

/**
 * Qwik counterpart of the React example's PanelGroup / Panel / ResizeTrigger
 * trio. The connect api can't cross a component$ boundary (or travel through
 * context), so the group renders its own panels and resize triggers: one
 * panel per entry of `panels`, with a resize trigger `"<a>:<b>"` between
 * neighbours. Panel content is projected through a named slot per panel id
 * (`<div q:slot="a">…</div>`).
 */
export const PanelGroup = component$<PanelGroupProps>((props) => {
  const id = useId()
  const service = useMachine(splitter.machine, () => ({
    orientation: props.orientation,
    defaultSize: props.defaultSize,
    panels: props.panels,
    id,
    registry: props.multiDrag ? getRegistry() : undefined,
  }))
  const api = splitter.connect(service, normalizeProps)

  return (
    <div {...api.getRootProps()}>
      {props.panels.map((panel, index) => {
        const next = props.panels[index + 1]
        return (
          <Fragment key={panel.id}>
            <div {...api.getPanelProps({ id: panel.id })}>
              <Slot name={panel.id} />
            </div>
            {next && <div {...api.getResizeTriggerProps({ id: `${panel.id}:${next.id}` })} />}
          </Fragment>
        )
      })}
    </div>
  )
})

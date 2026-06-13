import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, registerValueSerializer, useMachine } from "@zag-js/qwik"
import { tourControls, tourData } from "@zag-js/shared"
import * as tour from "@zag-js/tour"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

/** see pin-input example: live api handle for custom (non-zag) buttons */
const apiRef: { current?: tour.Api } = {}

/**
 * The tour machine keeps the steps (which carry target() closures) in
 * context — un-serializable for SSR resume (Q34 would silently drop the
 * page's resumable state). Encode steps by reference into this module's
 * tourData and rehydrate by id.
 */
registerValueSerializer({
  id: "tour-step",
  match: (v): v is (typeof tourData)[number] =>
    typeof v === "object" && v !== null && tourData.includes(v as (typeof tourData)[number]),
  encode: (v) => v.id,
  decode: (id) => tourData.find((s) => s.id === id)!,
})

// Qwik has no portal to render into an iframe body; srcdoc with the static
// content keeps it same-origin so the tour can reach #step-2a inside it
const iframeContent = `<h1 id="step-2a">Iframe Content</h1>
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>`

export default component$(() => {
  const controls = useControls(tourControls)
  const id = useId()

  const service = useMachine(
    tour.machine,
    () =>
      ({
        id,
        steps: tourData,
        ...controls.values(),
      }) as tour.Props,
  )

  const api = tour.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="tour">
        <div>
          <button onClick$={() => apiRef.current?.start()}>Start Tour</button>
          <div class="steps__container">
            <h3 id="step-1">Step 1</h3>
            <div class="overflow__container">
              <div class="h-200px" />
              <h3 id="step-2">Step 2</h3>
              <div class="h-100px" />
            </div>
            <iframe title={`frame:${id}`} srcdoc={iframeContent} />
            <h3 id="step-3">Step 3</h3>
            <h3 id="step-4">Step 4</h3>
          </div>
        </div>

        {api.step && api.open && (
          <>
            {api.step.backdrop && <div {...api.getBackdropProps()} />}
            <div {...api.getSpotlightProps()} />
            <div {...api.getPositionerProps()}>
              <div {...api.getContentProps()}>
                {api.step.arrow && (
                  <div {...api.getArrowProps()}>
                    <div {...api.getArrowTipProps()} />
                  </div>
                )}

                <p {...api.getTitleProps()}>{api.step.title}</p>
                <div {...api.getDescriptionProps()}>{api.step.description}</div>
                <div {...api.getProgressTextProps()}>{api.getProgressText()}</div>

                {api.step.actions && (
                  <div class="tour button__group">
                    {api.step.actions.map((action) => (
                      <button key={action.label} {...api.getActionTriggerProps({ action })}>
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                <button {...api.getCloseTriggerProps()}>✕</button>
              </div>
            </div>
          </>
        )}
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} omit={["steps"]} />
      </Toolbar>
    </>
  )
})

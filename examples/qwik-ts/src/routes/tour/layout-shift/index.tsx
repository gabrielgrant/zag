import { component$, useId, useSignal, useStyles$ } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { tourLayoutShiftData } from "@zag-js/shared"
import * as tour from "@zag-js/tour"
import { registerTourSteps } from "~/lib/tour-steps"

// A fixed-height root that gains overflow — the layout change a ResizeObserver cannot see.
const layoutShiftStyles = `
  html { height: 100%; }
  body { min-height: 100%; }
  body, .page, .page main { overflow: visible; }
  .page { height: auto; min-height: 100vh; }
  .page main { display: block; }
  .nav { flex-shrink: 0; height: 100vh; }

  .layout-shift { padding: 40px; }
  .layout-shift .targets { display: flex; gap: 80px; margin-top: 40px; }
  .layout-shift .targets button { width: 160px; }
  .layout-shift .targets button[data-wide] { width: 280px; }
  .layout-shift .filler { height: 100px; padding-top: 40px; }
  .layout-shift .filler[data-expanded] { height: 2000px; }
`

/** see pin-input example: live api handle for custom (non-zag) buttons */
const apiRef: { current?: tour.Api } = {}

export default component$(() => {
  // React: <style jsx global>
  useStyles$(layoutShiftStyles)

  const wide = useSignal(false)
  const expanded = useSignal(false)

  registerTourSteps("layout-shift", tourLayoutShiftData)

  const service = useMachine(tour.machine, { id: useId(), steps: tourLayoutShiftData })
  const api = tour.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="tour layout-shift">
        <button onClick$={() => apiRef.current?.start()}>Start tour</button>

        <div class="targets">
          <button id="layout-target" data-wide={wide.value || undefined}>
            First target
          </button>
          <button id="other-target" data-wide={wide.value || undefined}>
            Second target
          </button>
        </div>

        <div class="filler" data-expanded={expanded.value || undefined}>
          {expanded.value ? "Extra content is in the page." : "Use the tour controls to shift the layout."}
        </div>
      </main>

      {/* rendered inline: Qwik has no portal */}
      {api.open && (
        <>
          <div {...api.getBackdropProps()} />
          <div {...api.getSpotlightProps()} />
          <div {...api.getPositionerProps()}>
            <div {...api.getContentProps()}>
              <p {...api.getTitleProps()}>{api.step?.title}</p>
              <div {...api.getDescriptionProps()}>{api.step?.description}</div>

              <div class="tour button__group">
                <button onClick$={() => (wide.value = !wide.value)}>Resize target</button>
                <button onClick$={() => (expanded.value = !expanded.value)}>Toggle extra content</button>
                {api.step?.actions?.map((action) => (
                  <button key={action.label} {...api.getActionTriggerProps({ action })}>
                    {action.label}
                  </button>
                ))}
              </div>

              <button {...api.getCloseTriggerProps()}>
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
})

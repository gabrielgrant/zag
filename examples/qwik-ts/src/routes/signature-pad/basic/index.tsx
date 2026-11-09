import { component$, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { signaturePadControls } from "@zag-js/shared"
import * as signaturePad from "@zag-js/signature-pad"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"
import { withoutQwikMarkers } from "~/lib/qr-code-svg"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: signaturePad.Api } = {}

// the svg is SSR-rendered, so Qwik's markers must be hidden while it is
// serialized (see withoutQwikMarkers)
const getSegment = () => document.querySelector("[data-scope=signature-pad][data-part=segment]")

// inline replacement for lucide's RotateCcw icon
const RotateCcw = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
)

export default component$(() => {
  const url = useSignal("")

  const controls = useControls(signaturePadControls)
  const id = useId()

  const service = useMachine(
    signaturePad.machine,
    () =>
      ({
        id,
        onDrawEnd(details) {
          withoutQwikMarkers(getSegment(), () => details.getDataUrl("image/png")).then((value) => {
            url.value = value
          })
        },
        drawing: {
          fill: "red",
          size: 4,
          simulatePressure: true,
        },
        ...controls.values(),
      }) as signaturePad.Props,
  )

  const api = signaturePad.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="signature-pad">
        <div {...api.getRootProps()}>
          <input {...api.getHiddenInputProps({ value: url.value })} />
          <label {...api.getLabelProps()}>Signature Pad</label>

          <div {...api.getControlProps()}>
            <svg {...api.getSegmentProps()}>
              {api.paths.map((path, i) => (
                <path key={i} {...api.getSegmentPathProps({ path })} />
              ))}
              {api.currentPath && <path {...api.getSegmentPathProps({ path: api.currentPath })} />}
            </svg>

            <div {...api.getGuideProps()} />
          </div>

          <button {...api.getClearTriggerProps()}>
            <RotateCcw />
          </button>
        </div>

        <button
          onClick$={async () => {
            const api = apiRef.current
            if (!api) return
            url.value = await withoutQwikMarkers(getSegment(), () => api.getDataUrl("image/png"))
          }}
        >
          Show Image
        </button>
        {url.value && <img data-part="preview" alt="signature" src={url.value} />}
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} omit={["currentPoints", "currentPath", "paths"]} />
      </Toolbar>
    </>
  )
})

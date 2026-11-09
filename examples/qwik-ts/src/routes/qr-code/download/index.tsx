import { component$, useId, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import * as qrCode from "@zag-js/qr-code"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { hideQwikMarkers } from "~/lib/qr-code-svg"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: qrCode.Api } = {}

const getFrame = () => document.querySelector("[data-scope=qr-code][data-part=frame]")

export default component$(() => {
  const preview = useSignal<string | null>(null)
  const id = useId()

  const service = useMachine(qrCode.machine, {
    id,
    value: "https://zagjs.com",
    encoding: { ecc: "H" },
  })

  const api = qrCode.connect(service, normalizeProps)
  apiRef.current = api

  // zag's qr-code getDataUrl() clones the svg only after the overlay image
  // has loaded, so Qwik's SSR markers (see hideQwikMarkers) can't just be
  // hidden around the call. Hide them once, when a download/preview is first
  // requested (the component is live by then, so Qwik has already read them),
  // and put them back when the page goes away. A window capture listener runs
  // before the trigger's own click handler.
  useVisibleTask$(
    ({ cleanup }) => {
      let restore: (() => void) | undefined
      const onClick = (event: MouseEvent) => {
        const target = event.target as Element | null
        if (!target?.closest?.("[data-scope=qr-code][data-part=download-trigger], [data-qr-preview]")) return
        restore ??= hideQwikMarkers(getFrame())
      }
      window.addEventListener("click", onClick, true)
      cleanup(() => {
        window.removeEventListener("click", onClick, true)
        restore?.()
      })
    },
    { strategy: "document-ready" },
  )

  return (
    <main class="qr-code">
      <div {...api.getRootProps()}>
        <svg {...api.getFrameProps()}>
          <path {...api.getPatternProps()} />
        </svg>
        <div {...api.getOverlayProps()}>
          <img src="https://avatars.githubusercontent.com/u/54212428?s=88&v=4" alt="" width={88} height={88} />
        </div>
      </div>

      <button {...api.getDownloadTriggerProps({ mimeType: "image/png", quality: 1, fileName: "qr-code.png" })}>
        Download
      </button>
      <button
        data-qr-preview
        onClick$={async () => {
          const url = await apiRef.current?.getDataUrl("image/png", 1)
          if (url) preview.value = url
        }}
      >
        Preview
      </button>

      {preview.value && <img width="120" height="120" src={preview.value} alt="qr-code preview" />}
    </main>
  )
})

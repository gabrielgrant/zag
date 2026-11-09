import { component$, useId, useSignal } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import { normalizeProps, useMachine } from "@zag-js/qwik"

function getCloudinaryIframe() {
  return document.querySelector("[data-test=uw-iframe]")
}

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

export default component$(() => {
  const id = useId()
  const buttonRef = useSignal<HTMLButtonElement>()
  // `next-cloudinary` isn't available here: a stand-in for its upload widget, which
  // renders an iframe (`[data-test=uw-iframe]`) outside the dialog — the element
  // `persistentElements` keeps interactive while the dialog is open
  const widgetOpen = useSignal(false)

  const service = useMachine(dialog.machine, () => ({
    id,
    persistentElements: [getCloudinaryIframe],
  }))

  const api = dialog.connect(service, normalizeProps)

  return (
    <div>
      <button {...api.getTriggerProps()}>Open Dialog</button>
      {api.open && (
        <>
          <div {...api.getBackdropProps()} />
          <div {...api.getPositionerProps()}>
            <div {...api.getContentProps()}>
              <h2 {...api.getTitleProps()}>Edit profile</h2>
              <p {...api.getDescriptionProps()}>Make changes to your profile here. Click save when you are done.</p>

              <button ref={buttonRef} onClick$={() => (widgetOpen.value = true)}>
                Upload an Image
              </button>

              <button {...api.getCloseTriggerProps()}>
                <XIcon />
              </button>
            </div>
          </div>
        </>
      )}

      {widgetOpen.value && (
        <div
          data-test="uw-iframe"
          style={{
            position: "fixed",
            inset: "10%",
            zIndex: 10000,
            background: "white",
            border: "1px solid #ccc",
            padding: "16px",
          }}
        >
          <p>Upload widget (stand-in)</p>
          <input placeholder="Image URL" />
          <button
            onClick$={() => {
              widgetOpen.value = false
              buttonRef.value?.focus()
            }}
          >
            Close widget
          </button>
        </div>
      )}
    </div>
  )
})

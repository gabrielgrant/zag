import { component$, Slot, useId } from "@qwik.dev/core"
import * as colorPicker from "@zag-js/color-picker"
import * as dialog from "@zag-js/dialog"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { ensureSerializersRegistered } from "~/serializers"

const XIcon = () => (
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
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

const ColorPicker = component$(() => {
  ensureSerializersRegistered()
  const id = useId()

  const service = useMachine(
    colorPicker.machine,
    () =>
      ({
        id,
        name: "color",
        defaultValue: colorPicker.parse("hsl(0, 100%, 50%)"),
      }) as colorPicker.Props,
  )

  const api = colorPicker.connect(service, normalizeProps)

  // Qwik has no portal: the content renders inline (inside the dialog content)
  return (
    <div {...api.getRootProps()}>
      <label {...api.getLabelProps()}>Select Color</label>
      <div {...api.getControlProps()}>
        <input {...api.getHiddenInputProps()} />
        <button {...api.getTriggerProps()}>
          {/* span, not div: Qwik's dev SSR rejects <div> inside <button> */}
          <span style={{ position: "relative", display: "flex" }}>
            <span {...api.getTransparencyGridProps({ size: "4px" })} />
            <span {...api.getSwatchProps({ value: api.value })} />
          </span>
        </button>
      </div>

      {api.open && (
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()}>
            <div class="content__inner">
              <div {...api.getAreaProps()}>
                <div {...api.getAreaBackgroundProps()} />
                <div {...api.getAreaThumbProps()} />
              </div>

              <div {...api.getChannelSliderProps({ channel: "hue" })}>
                <div {...api.getChannelSliderTrackProps({ channel: "hue" })} />
                <div {...api.getChannelSliderThumbProps({ channel: "hue" })} />
              </div>

              <div {...api.getChannelSliderProps({ channel: "alpha" })}>
                <div {...api.getTransparencyGridProps({ size: "12px" })} />
                <div {...api.getChannelSliderTrackProps({ channel: "alpha" })} />
                <div {...api.getChannelSliderThumbProps({ channel: "alpha" })} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

const Dialog = component$<{ title?: string }>((props) => {
  const id = useId()
  const service = useMachine(dialog.machine, { id })
  const api = dialog.connect(service, normalizeProps)

  return (
    <>
      <button {...api.getTriggerProps()}>Open Dialog</button>
      {/*
        Qwik has no portal, so the dialog renders inline. It also stays mounted
        (hidden while closed) rather than being conditionally rendered like the
        React page: a conditionally rendered <Slot /> gets duplicated by Qwik
        when the component re-renders right after the branch mounts.
      */}
      <div {...api.getBackdropProps()} />
      <div {...api.getPositionerProps()} hidden={!api.open}>
        <div {...api.getContentProps()}>
          <div style={{ padding: "24px", minWidth: "400px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2 {...api.getTitleProps()}>{props.title || "Color Picker Dialog"}</h2>
              <button {...api.getCloseTriggerProps()}>
                <XIcon />
              </button>
            </div>
            <div {...api.getDescriptionProps()} style={{ marginBottom: "24px" }}>
              This dialog contains a color picker. The issue was that interacting with the color picker would close the
              dialog.
            </div>
            <Slot />
          </div>
        </div>
      </div>
    </>
  )
})

export default component$(() => {
  return (
    <main style={{ padding: "20px" }}>
      <h1>Color Picker in Dialog Test</h1>
      <p>
        This page tests the portalled color picker inside a portalled dialog issue. Before the fix, clicking on the
        color picker would close the dialog.
      </p>

      <div style={{ marginTop: "20px" }}>
        <Dialog title="Primary Color Selection">
          <div style={{ marginBottom: "16px" }}>
            <ColorPicker />
          </div>
        </Dialog>
      </div>
    </main>
  )
})

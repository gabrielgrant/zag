import { component$, useId } from "@qwik.dev/core"
import * as colorPicker from "@zag-js/color-picker"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { colorPickerControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"
import { ensureSerializersRegistered } from "~/serializers"

const presets = ["#f47373", "#697689"]

export default component$(() => {
  ensureSerializersRegistered()
  const controls = useControls(colorPickerControls)
  const id = useId()

  const service = useMachine(
    colorPicker.machine,
    () =>
      ({
        id,
        name: "color",
        // format comes from the controls panel
        defaultValue: colorPicker.parse("hsl(0, 100%, 50%)"),
        ...controls.values(),
      }) as colorPicker.Props,
  )

  const api = colorPicker.connect(service, normalizeProps)

  return (
    <>
      <main class="color-picker">
        <form>
          <input {...api.getHiddenInputProps()} />
          <div {...api.getRootProps()}>
            <label {...api.getLabelProps()}>
              Select Color: <span data-testid="value-text">{api.valueAsString}</span>
            </label>

            <div {...api.getControlProps()}>
              <button {...api.getTriggerProps()}>
                <div {...api.getTransparencyGridProps({ size: "10px" })} />
                <div {...api.getSwatchProps({ value: api.value })} />
              </button>
              <input {...api.getChannelInputProps({ channel: "hex" })} />
              <input {...api.getChannelInputProps({ channel: "alpha" })} />
            </div>

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

                  {api.format.startsWith("hsl") && (
                    <div style={{ display: "flex", width: "100%" }}>
                      <span>H</span> <input {...api.getChannelInputProps({ channel: "hue" })} />
                      <span>S</span> <input {...api.getChannelInputProps({ channel: "saturation" })} />
                      <span>L</span> <input {...api.getChannelInputProps({ channel: "lightness" })} />
                      <span>A</span> <input {...api.getChannelInputProps({ channel: "alpha" })} />
                    </div>
                  )}

                  {api.format.startsWith("rgb") && (
                    <div style={{ display: "flex", width: "100%" }}>
                      <span>R</span> <input {...api.getChannelInputProps({ channel: "red" })} />
                      <span>G</span> <input {...api.getChannelInputProps({ channel: "green" })} />
                      <span>B</span> <input {...api.getChannelInputProps({ channel: "blue" })} />
                      <span>A</span> <input {...api.getChannelInputProps({ channel: "alpha" })} />
                    </div>
                  )}

                  {api.format.startsWith("hsb") && (
                    <div style={{ display: "flex", width: "100%" }}>
                      <span>H</span> <input {...api.getChannelInputProps({ channel: "hue" })} />
                      <span>S</span> <input {...api.getChannelInputProps({ channel: "saturation" })} />
                      <span>B</span> <input {...api.getChannelInputProps({ channel: "brightness" })} />
                      <span>A</span> <input {...api.getChannelInputProps({ channel: "alpha" })} />
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                      <div {...api.getTransparencyGridProps({ size: "4px" })} />
                      <div {...api.getSwatchProps({ value: api.value })} />
                    </div>
                    <p data-testid="value-text">{api.valueAsString}</p>
                  </div>

                  <input {...api.getChannelInputProps({ channel: "hex" })} />

                  <div {...api.getSwatchGroupProps()} style={{ display: "flex", gap: "10px" }}>
                    {presets.map((preset) => (
                      <button key={preset} {...api.getSwatchTriggerProps({ value: preset })}>
                        <div style={{ position: "relative" }}>
                          <div {...api.getTransparencyGridProps({ size: "4px" })} />
                          <div {...api.getSwatchProps({ value: preset })} />
                        </div>
                      </button>
                    ))}
                  </div>

                  <button {...api.getEyeDropperTriggerProps()}>🖊</button>
                </div>
              </div>
            </div>
          </div>
          <button type="submit">Submit</button>
          <button type="reset">Reset</button>
        </form>
      </main>

      <Toolbar viz controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

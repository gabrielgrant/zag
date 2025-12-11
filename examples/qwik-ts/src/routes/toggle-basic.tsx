import { component$ } from "@builder.io/qwik"
import { DocumentHead } from "@builder.io/qwik-city"
import * as toggle from "@zag-js/toggle-group"
import { useMachine, normalizePropsBasic } from "@zag-js/qwik"

export default component$(() => {
  const service = useMachine(toggle.machine, {
    id: "toggle-basic",
  })

  const api = toggle.connect(service, normalizePropsBasic)

  return (
    <div class="example-section">
      <h2>Toggle Group - Basic Strategy</h2>
      
      <p>
        This example uses <code>normalizePropsBasic</code> which provides manual control.
        Event handlers are wrapped in QRLs but preventDefault is not handled automatically.
      </p>

      <p>
        <strong>Note:</strong> If any buttons navigate or have default behaviors, you would need
        to manually add <code>preventdefault:click</code> attributes.
      </p>

      <div style={{ margin: "20px 0" }}>
        <div {...api.getRootProps()}>
          <button {...api.getItemProps({ value: "bold" })}>
            <strong>B</strong>
          </button>
          <button {...api.getItemProps({ value: "italic" })}>
            <em>I</em>
          </button>
          <button {...api.getItemProps({ value: "underline" })}>
            <u>U</u>
          </button>
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <p>
          <strong>Value:</strong> {JSON.stringify(api.value)}
        </p>
      </div>

      <div class="example-section" style={{ marginTop: "20px", background: "#f9f9f9" }}>
        <h3>Code Example</h3>
        <pre style={{ overflow: "auto" }}>
{`import { normalizePropsBasic } from "@zag-js/qwik"

const api = toggle.connect(service, normalizePropsBasic)

// Use props directly - no automatic preventDefault
<div {...api.getRootProps()}>
  <button {...api.getItemProps({ value: "bold" })}>B</button>
</div>`}
        </pre>
      </div>
    </div>
  )
})

export const head: DocumentHead = {
  title: "Toggle Basic Strategy - Zag.js Qwik",
  meta: [
    {
      name: "description",
      content: "Toggle group example using basic QRL wrapping strategy",
    },
  ],
}

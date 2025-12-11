import { component$ } from "@builder.io/qwik"
import { DocumentHead } from "@builder.io/qwik-city"
import * as toggle from "@zag-js/toggle-group"
import { useMachine, normalizePropsManual } from "@zag-js/qwik"

export default component$(() => {
  const service = useMachine(toggle.machine, {
    id: "toggle-manual",
  })

  const api = toggle.connect(service, normalizePropsManual)

  return (
    <div class="example-section">
      <h2>Toggle Group - Manual Strategy</h2>
      
      <p>
        This example uses <code>normalizePropsManual</code> which requires explicit
        metadata to control preventDefault behavior.
      </p>

      <p>
        <strong>Explicit Control:</strong> You specify which events need preventDefault
        using the <code>data-prevent-default</code> attribute.
      </p>

      <div style={{ margin: "20px 0" }}>
        <div 
          {...api.getRootProps()}
          data-prevent-default={["click", "mousedown"]}
        >
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
{`import { normalizePropsManual } from "@zag-js/qwik"

const api = toggle.connect(service, normalizePropsManual)

// Explicitly specify events that need preventDefault
<div 
  {...api.getRootProps()}
  data-prevent-default={["click", "mousedown"]}
>
  <button {...api.getItemProps({ value: "bold" })}>B</button>
</div>`}
        </pre>
      </div>

      <div class="example-section" style={{ marginTop: "20px", background: "#e8f5e9" }}>
        <h3>When to Use</h3>
        <ul>
          <li>You want explicit control over preventDefault</li>
          <li>You know exactly which events need it</li>
          <li>You want to avoid auto-detection surprises</li>
          <li>You're building a library and want predictable behavior</li>
        </ul>
      </div>
    </div>
  )
})

export const head: DocumentHead = {
  title: "Toggle Manual Strategy - Zag.js Qwik",
  meta: [
    {
      name: "description",
      content: "Toggle group example using manual preventDefault strategy",
    },
  ],
}

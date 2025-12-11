import { component$ } from "@builder.io/qwik"
import { DocumentHead } from "@builder.io/qwik-city"
import * as toggle from "@zag-js/toggle-group"
import { useMachine, normalizeProps } from "@zag-js/qwik"

export default component$(() => {
  const service = useMachine(toggle.machine, {
    id: "toggle-auto",
  })

  const api = toggle.connect(service, normalizeProps)

  return (
    <div class="example-section">
      <h2>Toggle Group - Auto-detect Strategy</h2>
      
      <p>
        This example uses <code>normalizeProps</code> (alias for <code>normalizePropsAutoPrevent</code>) 
        which automatically detects preventDefault usage in handlers.
      </p>

      <p>
        <strong>Default and Recommended:</strong> This strategy analyzes event handlers
        and automatically adds <code>preventdefault</code> attributes when needed.
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
{`import { normalizeProps } from "@zag-js/qwik"

const api = toggle.connect(service, normalizeProps)

// preventDefault is automatically handled if detected
<div {...api.getRootProps()}>
  <button {...api.getItemProps({ value: "bold" })}>B</button>
</div>`}
        </pre>
      </div>

      <div class="example-section" style={{ marginTop: "20px", background: "#fff8e1" }}>
        <h3>How It Works</h3>
        <ul>
          <li>Analyzes event handlers for preventDefault calls</li>
          <li>Automatically adds <code>preventdefault:eventname</code> attributes</li>
          <li>Best balance of convenience and functionality</li>
          <li>Works for 90% of use cases</li>
        </ul>
      </div>
    </div>
  )
})

export const head: DocumentHead = {
  title: "Toggle Auto-detect Strategy - Zag.js Qwik",
  meta: [
    {
      name: "description",
      content: "Toggle group example using auto-detect preventDefault strategy",
    },
  ],
}

import { component$ } from "@builder.io/qwik"
import { DocumentHead } from "@builder.io/qwik-city"
import * as checkbox from "@zag-js/checkbox"
import { useMachine, normalizeProps } from "@zag-js/qwik"

export default component$(() => {
  const service = useMachine(checkbox.machine, {
    id: "checkbox-1",
  })

  const api = checkbox.connect(service, normalizeProps)

  return (
    <div class="example-section">
      <h2>Checkbox Example</h2>
      
      <p>
        This example demonstrates a checkbox component using the default (auto-detect) strategy.
      </p>

      <div class="checkbox-wrapper">
        <label {...api.getRootProps()} class="checkbox-label">
          <div {...api.getControlProps()} class="checkbox-control">
            {api.checked && <span>✓</span>}
          </div>
          <span {...api.getLabelProps()}>Accept terms and conditions</span>
          <input {...api.getHiddenInputProps()} />
        </label>
      </div>

      <div style={{ marginTop: "20px" }}>
        <p>
          <strong>Checked:</strong> {api.checked ? "Yes" : "No"}
        </p>
        <p>
          <strong>State:</strong> {api.checkedState}
        </p>
      </div>

      <div class="example-section" style={{ marginTop: "20px", background: "#f9f9f9" }}>
        <h3>Code Example</h3>
        <pre style={{ overflow: "auto" }}>
{`import * as checkbox from "@zag-js/checkbox"
import { useMachine, normalizeProps } from "@zag-js/qwik"

export default component$(() => {
  const service = useMachine(checkbox.machine, {
    id: "checkbox-1",
  })

  const api = checkbox.connect(service, normalizeProps)

  return (
    <label {...api.getRootProps()}>
      <div {...api.getControlProps()}>
        {api.checked && <span>✓</span>}
      </div>
      <span {...api.getLabelProps()}>
        Accept terms
      </span>
      <input {...api.getHiddenInputProps()} />
    </label>
  )
})`}
        </pre>
      </div>

      <div class="example-section" style={{ marginTop: "20px", background: "#e3f2fd" }}>
        <h3>Features</h3>
        <ul>
          <li>✓ Accessible checkbox with proper ARIA attributes</li>
          <li>✓ Keyboard navigation support</li>
          <li>✓ Auto-detected preventDefault handling</li>
          <li>✓ Framework-agnostic state machine logic</li>
        </ul>
      </div>
    </div>
  )
})

export const head: DocumentHead = {
  title: "Checkbox Example - Zag.js Qwik",
  meta: [
    {
      name: "description",
      content: "Checkbox component example with Zag.js and Qwik",
    },
  ],
}

import { component$ } from "@builder.io/qwik"
import { DocumentHead } from "@builder.io/qwik-city"

export default component$(() => {
  return (
    <div>
      <h2>Welcome to Zag.js + Qwik</h2>
      
      <p>
        This example app demonstrates different strategies for using Zag.js with Qwik,
        particularly around handling the preventDefault challenge.
      </p>

      <div class="example-section">
        <h3>The preventDefault Challenge</h3>
        <p>
          Qwik's event handlers are lazy-loaded and asynchronous by default, which means
          calling <code>event.preventDefault()</code> inside handlers doesn't work as expected.
        </p>
        <p>
          This package provides three different strategies to handle this:
        </p>
        <ul>
          <li>
            <strong>Basic:</strong> Manual control - you explicitly add preventdefault attributes
          </li>
          <li>
            <strong>Auto-detect:</strong> Automatically detects preventDefault usage (default)
          </li>
          <li>
            <strong>Manual:</strong> Explicit metadata-driven approach
          </li>
        </ul>
      </div>

      <div class="example-section">
        <h3>Explore Examples</h3>
        <p>
          Use the navigation above to try different components with each strategy.
        </p>
      </div>

      <div class="example-section">
        <h3>Documentation</h3>
        <p>
          See the <code>@zag-js/qwik</code> README for detailed documentation on each
          approach and when to use them.
        </p>
      </div>
    </div>
  )
})

export const head: DocumentHead = {
  title: "Zag.js Qwik Examples - Home",
  meta: [
    {
      name: "description",
      content: "Examples of using Zag.js state machines with Qwik framework",
    },
  ],
}

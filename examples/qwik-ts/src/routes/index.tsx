import { component$ } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"

export default component$(() => {
  return (
    <div class="index-nav">
      <h2>Components</h2>
      <ul>
        <li>
          <a href="/menu">Menu</a>
        </li>
        <li>
          <a href="/context-menu">Context Menu</a>
        </li>
      </ul>
    </div>
  )
})

export const head: DocumentHead = {
  title: "Zag Qwik Examples",
  meta: [
    {
      name: "description",
      content: "Qwik v2 examples for Zag machines",
    },
  ],
}

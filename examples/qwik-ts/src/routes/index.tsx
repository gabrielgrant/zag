import { component$ } from "@qwik.dev/core"
import { Link, type DocumentHead } from "@qwik.dev/router"

export default component$(() => {
  return (
    <div class="index-nav">
      <h2>Components</h2>
      <ul>
        <li>
          <Link href="/menu">Menu</Link>
        </li>
        <li>
          <Link href="/navigation-menu">Navigation Menu</Link>
        </li>
        <li>
          <Link href="/context-menu">Context Menu</Link>
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

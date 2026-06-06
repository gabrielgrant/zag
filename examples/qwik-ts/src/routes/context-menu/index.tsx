import { component$ } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"

const examples = [{ href: "/context-menu/basic", title: "Basic" }]

export default component$(() => {
  return (
    <div class="index-nav component-index-nav">
      <h2>
        Context Menu Examples ({examples.length}/{examples.length})
      </h2>
      <ul>
        {examples.map((example) => (
          <li key={example.href}>
            <a href={example.href}>{example.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
})

export const head: DocumentHead = {
  title: "Context Menu Examples | Zag Qwik Examples",
}

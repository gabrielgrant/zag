import { component$ } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"

const examples = [
  { href: "/menu/basic", title: "Basic" },
  { href: "/menu/multiple-trigger", title: "Multiple Trigger" },
  { href: "/menu/options", title: "Options" },
]

export default component$(() => {
  return (
    <div class="index-nav component-index-nav">
      <h2>
        Menu Examples ({examples.length}/{examples.length})
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
  title: "Menu Examples | Zag Qwik Examples",
}

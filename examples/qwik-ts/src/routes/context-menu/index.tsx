import { component$ } from "@qwik.dev/core"
import { Link, type DocumentHead } from "@qwik.dev/router"

const examples = [
  { href: "/context-menu/basic", title: "Basic" },
  { href: "/context-menu/multiple-trigger", title: "Multiple Trigger" },
]

export default component$(() => {
  return (
    <div class="index-nav component-index-nav">
      <h2>
        Context Menu Examples ({examples.length}/{examples.length})
      </h2>
      <ul>
        {examples.map((example) => (
          <li key={example.href}>
            <Link href={example.href}>{example.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
})

export const head: DocumentHead = {
  title: "Context Menu Examples | Zag Qwik Examples",
}

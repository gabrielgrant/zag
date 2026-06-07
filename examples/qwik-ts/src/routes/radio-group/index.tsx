import { component$ } from "@qwik.dev/core"
import { Link, type DocumentHead } from "@qwik.dev/router"

const examples = [{ href: "/radio-group/basic", title: "Basic" }]

export default component$(() => {
  return (
    <div class="index-nav component-index-nav">
      <h2>
        Radio Group Examples ({examples.length}/{examples.length})
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
  title: "Radio Group Examples | Zag Qwik Examples",
}

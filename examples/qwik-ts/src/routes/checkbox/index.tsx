import { component$ } from "@qwik.dev/core"
import { Link, type DocumentHead } from "@qwik.dev/router"

const examples = [{ href: "/checkbox/basic", title: "Basic" }]

export default component$(() => {
  return (
    <div class="index-nav component-index-nav">
      <h2>
        Checkbox Examples ({examples.length}/{examples.length})
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
  title: "Checkbox Examples | Zag Qwik Examples",
}

import { component$ } from "@qwik.dev/core"
import { Link, type DocumentHead } from "@qwik.dev/router"

const examples = [
  { href: "/pin-input/basic", title: "Basic" },
  { href: "/pin-input/controlled", title: "Controlled" },
  { href: "/pin-input/transform-paste", title: "Transform Paste" },
]

export default component$(() => {
  return (
    <div class="index-nav component-index-nav">
      <h2>
        Pin Input Examples ({examples.length}/{examples.length})
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
  title: "Pin Input Examples | Zag Qwik Examples",
}

import { component$ } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"

export default component$(() => {
  return (
    <main>
      <a href="/menu/basic">Menu basic</a>
    </main>
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

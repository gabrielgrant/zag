import { component$, Slot } from "@builder.io/qwik"
import { Link } from "@builder.io/qwik-city"

export default component$(() => {
  return (
    <div class="container">
      <header>
        <h1>Zag.js + Qwik Examples</h1>
        <p>
          Demonstrating different approaches to handle Qwik's preventDefault limitations
        </p>
      </header>
      <nav class="examples-list">
        <Link href="/">Home</Link>
        <Link href="/toggle-basic">Toggle (Basic Strategy)</Link>
        <Link href="/toggle-auto">Toggle (Auto-detect Strategy)</Link>
        <Link href="/toggle-manual">Toggle (Manual Strategy)</Link>
        <Link href="/checkbox">Checkbox</Link>
      </nav>
      <main>
        <Slot />
      </main>
    </div>
  )
})

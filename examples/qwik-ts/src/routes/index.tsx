import { component$ } from "@qwik.dev/core"
import { Link, type DocumentHead } from "@qwik.dev/router"

export default component$(() => {
  return (
    <div class="index-nav">
      <h2>Components</h2>
      <ul>
        <li>
          <Link href="/accordion">Accordion</Link>
        </li>
        <li>
          <Link href="/avatar">Avatar</Link>
        </li>
        <li>
          <Link href="/clipboard">Clipboard</Link>
        </li>
        <li>
          <Link href="/collapsible">Collapsible</Link>
        </li>
        <li>
          <Link href="/editable">Editable</Link>
        </li>
        <li>
          <Link href="/checkbox">Checkbox</Link>
        </li>
        <li>
          <Link href="/menu">Menu</Link>
        </li>
        <li>
          <Link href="/navigation-menu">Navigation Menu</Link>
        </li>
        <li>
          <Link href="/number-input">Number Input</Link>
        </li>
        <li>
          <Link href="/pagination">Pagination</Link>
        </li>
        <li>
          <Link href="/radio-group">Radio Group</Link>
        </li>
        <li>
          <Link href="/rating-group">Rating Group</Link>
        </li>
        <li>
          <Link href="/password-input">Password Input</Link>
        </li>
        <li>
          <Link href="/switch">Switch</Link>
        </li>
        <li>
          <Link href="/tabs">Tabs</Link>
        </li>
        <li>
          <Link href="/toggle-group">Toggle Group</Link>
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

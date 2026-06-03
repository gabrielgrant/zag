import { component$ } from "@qwik.dev/core"
import "@zag-js/shared/src/style.css"
import MenuBasic from "./routes/menu/basic"

export default component$(() => {
  const path = globalThis.location?.pathname ?? "/menu/basic"

  return (
    <div class="page">
      <aside class="nav">
        <header>Zagjs</header>
        <a data-active={path.startsWith("/menu") ? "" : undefined} href="/menu/basic">
          Menu
        </a>
      </aside>
      <MenuBasic />
    </div>
  )
})

import { component$, Slot } from "@qwik.dev/core"
import { useLocation } from "@qwik.dev/router"

export default component$(() => {
  const { url } = useLocation()
  const pathname = url.pathname
  const pathnameComponent = pathname.split("/").filter(Boolean)[0] ?? ""

  return (
    <div class="page">
      <aside class="nav">
        <header>Zagjs</header>
        <a data-active={pathnameComponent === "menu" ? "" : undefined} href="/menu">
          Menu
        </a>
        <a data-active={pathnameComponent === "context-menu" ? "" : undefined} href="/context-menu">
          Context Menu
        </a>
      </aside>
      <Slot />
    </div>
  )
})

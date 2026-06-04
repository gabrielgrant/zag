import { component$, Slot } from "@qwik.dev/core"
import { useLocation } from "@qwik.dev/router"

export default component$(() => {
  const { url } = useLocation()
  const isMenuRoute = url.pathname.startsWith("/menu")
  const isContextMenuRoute = url.pathname.startsWith("/context-menu")

  return (
    <div class="page">
      <aside class="nav">
        <header>Zagjs</header>
        <a data-active={isMenuRoute ? "" : undefined} href="/menu/basic">
          Menu
        </a>
        <a data-active={isContextMenuRoute ? "" : undefined} href="/context-menu/basic">
          Context Menu
        </a>
      </aside>
      <Slot />
    </div>
  )
})

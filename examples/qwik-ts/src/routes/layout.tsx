import { component$, Slot } from "@qwik.dev/core"
import { useLocation } from "@qwik.dev/router"

export default component$(() => {
  const { url } = useLocation()
  const pathname = url.pathname
  const isActive = (href: string) => pathname === href

  return (
    <div class="page">
      <aside class="nav">
        <header>Zagjs</header>
        <a data-active={isActive("/menu/basic") ? "" : undefined} href="/menu/basic">
          Menu basic
        </a>
        <a data-active={isActive("/menu/multiple-trigger") ? "" : undefined} href="/menu/multiple-trigger">
          Menu multiple trigger
        </a>
        <a data-active={isActive("/menu/options") ? "" : undefined} href="/menu/options">
          Menu options
        </a>
        <a data-active={isActive("/context-menu/basic") ? "" : undefined} href="/context-menu/basic">
          Context menu basic
        </a>
      </aside>
      <Slot />
    </div>
  )
})

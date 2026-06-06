import { component$, Slot } from "@qwik.dev/core"
import { Link, useLocation } from "@qwik.dev/router"

export default component$(() => {
  const { url } = useLocation()
  const pathname = url.pathname
  const pathnameComponent = pathname.split("/").filter(Boolean)[0] ?? ""

  return (
    <div class="page">
      <aside class="nav">
        <header>Zagjs</header>
        <Link data-active={pathnameComponent === "menu" ? "" : undefined} href="/menu">
          Menu
        </Link>
        <Link data-active={pathnameComponent === "navigation-menu" ? "" : undefined} href="/navigation-menu">
          Navigation Menu
        </Link>
        <Link data-active={pathnameComponent === "context-menu" ? "" : undefined} href="/context-menu">
          Context Menu
        </Link>
      </aside>
      <Slot />
    </div>
  )
})

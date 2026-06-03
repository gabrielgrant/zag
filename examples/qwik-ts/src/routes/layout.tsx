import { component$, Slot } from "@qwik.dev/core"
import { useLocation } from "@qwik.dev/router"

export default component$(() => {
  const { url } = useLocation()
  const isMenuRoute = url.pathname.startsWith("/menu")

  return (
    <div class="page">
      <aside class="nav">
        <header>Zagjs</header>
        <a data-active={isMenuRoute ? "" : undefined} href="/menu/basic">
          Menu
        </a>
      </aside>
      <Slot />
    </div>
  )
})

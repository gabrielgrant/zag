import { component$, Slot, useVisibleTask$ } from "@qwik.dev/core"
import { useLocation } from "@qwik.dev/router"
import { dataAttr } from "@zag-js/dom-query"
import { whenMachinesStarted } from "@zag-js/qwik"
import { routesData } from "@zag-js/shared"
import "../../../../shared/src/style.css"

const sortedRoutes = [...routesData].sort((a, b) => a.label.localeCompare(b.label))

export default component$(() => {
  const loc = useLocation()

  // e2e waits for this before interacting: every machine on the page has
  // woken and started, so interactions reach live handlers (as after
  // hydration in the other examples)
  useVisibleTask$(
    async () => {
      await whenMachinesStarted()
      document.documentElement.dataset.ready = ""
    },
    { strategy: "document-ready" },
  )

  return (
    <div class="page">
      <aside class="nav">
        <header>Zagjs</header>
        {sortedRoutes.map((route) => (
          <a
            key={route.path}
            href={route.path}
            data-active={dataAttr(loc.url.pathname.replace(/\/$/, "") === route.path)}
          >
            {route.label}
          </a>
        ))}
      </aside>
      <Slot />
    </div>
  )
})

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
        <Link data-active={pathnameComponent === "accordion" ? "" : undefined} href="/accordion">
          Accordion
        </Link>
        <Link data-active={pathnameComponent === "avatar" ? "" : undefined} href="/avatar">
          Avatar
        </Link>
        <Link data-active={pathnameComponent === "checkbox" ? "" : undefined} href="/checkbox">
          Checkbox
        </Link>
        <Link data-active={pathnameComponent === "clipboard" ? "" : undefined} href="/clipboard">
          Clipboard
        </Link>
        <Link data-active={pathnameComponent === "collapsible" ? "" : undefined} href="/collapsible">
          Collapsible
        </Link>
        <Link data-active={pathnameComponent === "menu" ? "" : undefined} href="/menu">
          Menu
        </Link>
        <Link data-active={pathnameComponent === "navigation-menu" ? "" : undefined} href="/navigation-menu">
          Navigation Menu
        </Link>
        <Link data-active={pathnameComponent === "pagination" ? "" : undefined} href="/pagination">
          Pagination
        </Link>
        <Link data-active={pathnameComponent === "radio-group" ? "" : undefined} href="/radio-group">
          Radio Group
        </Link>
        <Link data-active={pathnameComponent === "rating-group" ? "" : undefined} href="/rating-group">
          Rating Group
        </Link>
        <Link data-active={pathnameComponent === "password-input" ? "" : undefined} href="/password-input">
          Password Input
        </Link>
        <Link data-active={pathnameComponent === "switch" ? "" : undefined} href="/switch">
          Switch
        </Link>
        <Link data-active={pathnameComponent === "tabs" ? "" : undefined} href="/tabs">
          Tabs
        </Link>
        <Link data-active={pathnameComponent === "toggle-group" ? "" : undefined} href="/toggle-group">
          Toggle Group
        </Link>
        <Link data-active={pathnameComponent === "context-menu" ? "" : undefined} href="/context-menu">
          Context Menu
        </Link>
      </aside>
      <Slot />
    </div>
  )
})

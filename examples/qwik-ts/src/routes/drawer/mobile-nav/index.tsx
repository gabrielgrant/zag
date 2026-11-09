import { component$, useId } from "@qwik.dev/core"
import * as drawer from "@zag-js/drawer"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { usePresence } from "~/lib/dialog-presence"
import styles from "@shared/styles/drawer-mobile-nav.module.css"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: drawer.Api } = {}

const NAV_ITEMS = [
  { href: "#", label: "Overview" },
  { href: "#", label: "Components" },
  { href: "#", label: "Utilities" },
  { href: "#", label: "Releases" },
]

const LONG_LIST = Array.from({ length: 50 }, (_, i) => ({
  href: "#",
  label: `Item ${i + 1}`,
}))

export default component$(() => {
  const service = useMachine(drawer.machine, {
    id: useId(),
  })

  const api = drawer.connect(service, normalizeProps)
  const backdropPresence = usePresence(() => api.getBackdropProps())
  const contentPresence = usePresence(() => api.getContentProps({ draggable: false }))
  apiRef.current = api

  return (
    <main class={styles.page}>
      <header class={styles.header}>
        <button class={styles.menuButton} {...api.getTriggerProps()}>
          Open mobile menu
        </button>
      </header>

      <div class={styles.backdrop} {...backdropPresence.props} />
      <div class={styles.positioner} {...api.getPositionerProps()}>
        <div class={styles.popup} {...contentPresence.props}>
          <nav class={styles.panel}>
            <div class={styles.panelHeader}>
              <div aria-hidden="true" class={styles.headerSpacer} />
              <div class={styles.handle} {...api.getGrabberProps()}>
                <div class={styles.handleIndicator} {...api.getGrabberIndicatorProps()} />
              </div>
              <button class={styles.closeButton} {...api.getCloseTriggerProps()} aria-label="Close menu">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M0.75 0.75L6 6M11.25 11.25L6 6M6 6L0.75 11.25M6 6L11.25 0.75"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>

            <h2 {...api.getTitleProps()} class={styles.title}>
              Menu
            </h2>
            <p {...api.getDescriptionProps()} class={styles.description}>
              Scroll the long list. Flick down from the top to dismiss.
            </p>

            <div class={styles.scrollArea}>
              <ul class={styles.navList}>
                {NAV_ITEMS.map((item) => (
                  <li key={item.label} class={styles.navItem}>
                    <a class={styles.navLink} href={item.href} onClick$={() => apiRef.current?.setOpen(false)}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>

              <ul class={styles.longList} aria-label="Long list">
                {LONG_LIST.map((item) => (
                  <li key={item.label} class={styles.navItem}>
                    <a class={styles.navLink} href={item.href} onClick$={() => apiRef.current?.setOpen(false)}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </div>
    </main>
  )
})

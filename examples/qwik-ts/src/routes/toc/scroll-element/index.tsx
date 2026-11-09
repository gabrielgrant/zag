import { component$, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { tocControls, tocData } from "@zag-js/shared"
import * as toc from "@zag-js/toc"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: toc.Api } = {}

export default component$(() => {
  const controls = useControls(tocControls)
  const id = useId()

  const scrollRef = useSignal<HTMLDivElement>()

  const service = useMachine(
    toc.machine,
    () =>
      ({
        id,
        items: tocData,
        scrollEl: () => scrollRef.value ?? null,
        ...controls.values(),
      }) as toc.Props,
  )

  const api = toc.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="toc">
        <div {...api.getRootProps()}>
          <nav {...api.getNavProps()}>
            <h5 {...api.getTitleProps()}>On this page</h5>
            <ul {...api.getListProps()}>
              <div {...api.getIndicatorProps()} />
              {tocData.map((item) => (
                <li key={item.value} {...api.getItemProps({ item })}>
                  <a href={`#${item.value}`} {...api.getLinkProps({ item })}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <button type="button" onClick$={() => apiRef.current?.scrollTo("installation", { behavior: "instant" })}>
                Installation
              </button>
              <button type="button" onClick$={() => apiRef.current?.scrollTo("api-reference", { behavior: "smooth" })}>
                API Reference
              </button>
            </div>

            <div
              ref={scrollRef}
              style={{
                border: "1px solid hsl(219, 1%, 72%)",
                borderRadius: "4px",
                flex: 1,
                maxHeight: "20rem",
                overflow: "auto",
                padding: "1rem",
                scrollPaddingBlockStart: "1rem",
              }}
            >
              {tocData.map((item) => (
                <div key={item.value} style={{ marginBottom: "1rem" }}>
                  <h2
                    id={item.value}
                    style={{
                      fontSize: item.depth === 2 ? "1.25rem" : "1rem",
                      scrollMarginBlockStart: "0.5rem",
                    }}
                  >
                    {item.label}
                  </h2>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                  </p>
                  <p>
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                    pariatur. Excepteur sint occaecat cupidatat non proident.
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

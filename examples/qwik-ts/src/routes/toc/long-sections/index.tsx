import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { tocControls, tocData } from "@zag-js/shared"
import * as toc from "@zag-js/toc"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(tocControls)
  const id = useId()

  const service = useMachine(
    toc.machine,
    () =>
      ({
        id,
        items: tocData,
        ...controls.values(),
      }) as toc.Props,
  )

  const api = toc.connect(service, normalizeProps)

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

          <div style={{ maxHeight: "20rem", overflow: "auto", flex: 1 }}>
            {tocData.map((item) => (
              <div key={item.value} style={{ minHeight: "40rem" }}>
                <h2 id={item.value} style={{ fontSize: item.depth === 2 ? "1.25rem" : "1rem" }}>
                  {item.label}
                </h2>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

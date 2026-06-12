import { component$, useId } from "@qwik.dev/core"
import * as navigationMenu from "@zag-js/navigation-menu"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { navigationMenuControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(navigationMenuControls)
  const id = useId()

  const service = useMachine(navigationMenu.machine, () => ({
    id,
    ...controls.values(),
  }))

  const api = navigationMenu.connect(service, normalizeProps)

  const renderLinks = (opts: { value: string; items: string[] }) => {
    const { value, items } = opts
    return items.map((item, index) => (
      <a href="#" key={`${value}-${item}-${index}`} {...api.getLinkProps({ value })}>
        {item}
      </a>
    ))
  }

  return (
    <>
      <main class="navigation-menu basic">
        <div {...api.getRootProps()}>
          <div {...api.getListProps()}>
            <div {...api.getItemProps({ value: "products" })}>
              <button {...api.getTriggerProps({ value: "products" })}>
                Products
                <span>▾</span>
              </button>
              <div {...api.getContentProps({ value: "products" })}>
                <div {...api.getIndicatorProps()}>
                  <div {...api.getArrowProps()} />
                </div>
                {renderLinks({
                  value: "products",
                  items: [
                    "Analytics Platform",
                    "Customer Engagement",
                    "Marketing Automation",
                    "Data Integration",
                    "Enterprise Solutions",
                    "API Documentation",
                  ],
                })}
              </div>
            </div>

            <div {...api.getItemProps({ value: "company" })}>
              <button {...api.getTriggerProps({ value: "company" })}>
                Company
                <span>▾</span>
              </button>
              <div {...api.getContentProps({ value: "company" })}>
                <div {...api.getIndicatorProps()}>
                  <div {...api.getArrowProps()} />
                </div>
                {renderLinks({
                  value: "company",
                  items: ["About Us", "Leadership Team", "Careers", "Press Releases"],
                })}
              </div>
            </div>

            <div {...api.getItemProps({ value: "developers" })}>
              <button {...api.getTriggerProps({ value: "developers" })}>
                Developers
                <span>▾</span>
              </button>
              <div {...api.getContentProps({ value: "developers" })}>
                <div {...api.getIndicatorProps()}>
                  <div {...api.getArrowProps()} />
                </div>
                {renderLinks({
                  value: "developers",
                  items: ["Investors", "Partners", "Corporate Responsibility"],
                })}
              </div>
            </div>

            <div {...api.getItemProps({ value: "pricing" })}>
              <a href="#" {...api.getLinkProps({ value: "pricing" })}>
                Pricing
              </a>
            </div>
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref} viz>
        <StateVisualizer state={service} context={["value", "previousValue"]} />
      </Toolbar>
    </>
  )
})

import { component$, useId } from "@qwik.dev/core"
import * as navigationMenu from "@zag-js/navigation-menu"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import { navigationMenuControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"
import { usePresence } from "~/lib/menu-presence"

export default component$(() => {
  const controls = useControls(navigationMenuControls)
  const id = useId()

  const service = useMachine(navigationMenu.machine, () => ({
    id,
    ...controls.values(),
  }))

  const api = navigationMenu.connect(service, normalizeProps)

  // React: <Presence {...partProps}> — each part's `hidden` drives its presence
  const indicatorProps = api.getIndicatorProps()
  const viewportProps = api.getViewportProps()
  const productsProps = api.getContentProps({ value: "products" })
  const companyProps = api.getContentProps({ value: "company" })
  const developersProps = api.getContentProps({ value: "developers" })

  const indicator = usePresence(() => ({ present: !indicatorProps.hidden }))
  const viewport = usePresence(() => ({ present: !viewportProps.hidden }))
  const products = usePresence(() => ({ present: !productsProps.hidden }))
  const company = usePresence(() => ({ present: !companyProps.hidden }))
  const developers = usePresence(() => ({ present: !developersProps.hidden }))

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
      <main class="navigation-menu viewport">
        <div
          style={{
            position: "relative",
            display: "flex",
            boxSizing: "border-box",
            alignItems: "center",
            padding: "15px 20px",
            justifyContent: "space-between",
            width: "100%",
            backgroundColor: "white",
            boxShadow: "0 50px 100px -20px rgba(50,50,93,0.1),0 30px 60px -30px rgba(0,0,0,0.2)",
          }}
        >
          <button>Logo</button>
          <div {...api.getRootProps()}>
            <div {...api.getListProps()}>
              <div {...api.getItemProps({ value: "products" })}>
                <button {...api.getTriggerProps({ value: "products" })}>
                  Products
                  <span>▾</span>
                </button>
                <span {...api.getTriggerProxyProps({ value: "products" })} />
                <span {...api.getViewportProxyProps({ value: "products" })} />
              </div>

              <div {...api.getItemProps({ value: "company" })}>
                <button {...api.getTriggerProps({ value: "company" })}>
                  Company
                  <span>▾</span>
                </button>
                <span {...api.getTriggerProxyProps({ value: "company" })} />
                <span {...api.getViewportProxyProps({ value: "company" })} />
              </div>

              <div {...api.getItemProps({ value: "developers" })}>
                <button {...api.getTriggerProps({ value: "developers" })}>
                  Developers
                  <span>▾</span>
                </button>
                <span {...api.getTriggerProxyProps({ value: "developers" })} />
                <span {...api.getViewportProxyProps({ value: "developers" })} />
              </div>

              <div {...api.getItemProps({ value: "pricing" })}>
                <a href="#" {...api.getLinkProps({ value: "pricing" })}>
                  Pricing
                </a>
              </div>

              <div {...indicator.getProps(indicatorProps)}>
                <div {...api.getArrowProps()} />
              </div>
            </div>

            <div {...api.getViewportPositionerProps()}>
              <div {...viewport.getProps(viewportProps)}>
                <div
                  {...mergeProps(products.getProps(productsProps), {
                    style: {
                      gridTemplateColumns: "1fr 2fr",
                      width: "600px",
                    },
                  })}
                >
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

                  {renderLinks({
                    value: "products",
                    items: ["Case Studies", "Success Stories", "Integration Partners", "Security & Compliance"],
                  })}
                </div>

                <div
                  {...mergeProps(company.getProps(companyProps), {
                    style: {
                      gridTemplateColumns: "1fr 1fr",
                      width: "450px",
                    },
                  })}
                >
                  {renderLinks({
                    value: "company",
                    items: ["About Us", "Leadership Team", "Careers", "Press Releases"],
                  })}

                  {renderLinks({
                    value: "company",
                    items: ["Investors", "Partners", "Corporate Responsibility"],
                  })}
                </div>

                <div
                  {...mergeProps(developers.getProps(developersProps), {
                    style: {
                      gridTemplateColumns: "1.6fr 1fr",
                      width: "650px",
                    },
                  })}
                >
                  {renderLinks({
                    value: "developers",
                    items: [
                      "API Documentation",
                      "SDKs & Libraries",
                      "Developer Guides",
                      "Code Samples",
                      "Webhooks",
                      "GraphQL Explorer",
                    ],
                  })}
                  {renderLinks({
                    value: "developers",
                    items: ["Developer Community", "Changelog", "Status Page", "Rate Limits"],
                  })}
                </div>
              </div>
            </div>
          </div>
          <button>Login</button>
        </div>

        <header>
          <h1>Heading</h1>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
          <div>
            <button>Get Started</button>
            <a href="#">Learn More</a>
          </div>
        </header>
      </main>

      <Toolbar controls={controls.ref} viz>
        <StateVisualizer state={service} context={["value", "previousValue", "triggerRect", "viewportSize"]} />
      </Toolbar>
    </>
  )
})

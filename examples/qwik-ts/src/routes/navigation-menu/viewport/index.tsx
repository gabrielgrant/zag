import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as navigationMenu from "@zag-js/navigation-menu"
import { createMachineSerializer, normalizeProps, useMachine$, usePart$, type QwikMachineSignal } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

type NavigationMenuMachine = QwikMachineSignal<any>

const productsColumns = [
  [
    "Analytics Platform",
    "Customer Engagement",
    "Marketing Automation",
    "Data Integration",
    "Enterprise Solutions",
    "API Documentation",
  ],
  ["Case Studies", "Success Stories", "Integration Partners", "Security & Compliance"],
]

const companyColumns = [
  ["About Us", "Leadership Team", "Careers", "Press Releases"],
  ["Investors", "Partners", "Corporate Responsibility"],
]

const developersColumns = [
  ["API Documentation", "SDKs & Libraries", "Developer Guides", "Code Samples", "Webhooks", "GraphQL Explorer"],
  ["Developer Community", "Changelog", "Status Page", "Rate Limits"],
]

const viewportStyles = {
  company: {
    gridTemplateColumns: "1fr 1fr",
    width: "450px",
  },
  developers: {
    gridTemplateColumns: "1.6fr 1fr",
    width: "650px",
  },
  products: {
    gridTemplateColumns: "1fr 2fr",
    width: "600px",
  },
} satisfies Record<string, Record<string, string>>

const ChevronDown = component$(() => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
})

interface MachineProps {
  machine: NavigationMenuMachine
}

interface NavLinkProps extends MachineProps {
  text: string
  value: string
}

const NavLink = component$((props: NavLinkProps) => {
  const link = usePart$(
    () =>
      navigationMenu
        .connect(props.machine.controller.value.service, normalizeProps)
        .getLinkProps({ value: props.value }),
    props.machine,
  )

  return (
    <a href="#" ref={link.ref} {...link.props}>
      {props.text}
    </a>
  )
})

interface TriggerItemProps extends MachineProps {
  label: string
  value: string
}

const TriggerItem = component$((props: TriggerItemProps) => {
  const item = usePart$(
    () =>
      navigationMenu
        .connect(props.machine.controller.value.service, normalizeProps)
        .getItemProps({ value: props.value }),
    props.machine,
  )
  const trigger = usePart$(
    () =>
      navigationMenu
        .connect(props.machine.controller.value.service, normalizeProps)
        .getTriggerProps({ value: props.value }),
    props.machine,
  )
  const triggerProxy = usePart$(
    () =>
      navigationMenu
        .connect(props.machine.controller.value.service, normalizeProps)
        .getTriggerProxyProps({ value: props.value }),
    props.machine,
  )
  const viewportProxy = usePart$(
    () =>
      navigationMenu
        .connect(props.machine.controller.value.service, normalizeProps)
        .getViewportProxyProps({ value: props.value }),
    props.machine,
  )

  return (
    <div ref={item.ref} {...item.props}>
      <button ref={trigger.ref} {...trigger.props}>
        {props.label}
        <ChevronDown />
      </button>
      <span ref={triggerProxy.ref} {...triggerProxy.props} />
      <span ref={viewportProxy.ref} {...viewportProxy.props} />
    </div>
  )
})

interface RootLinkItemProps extends MachineProps {
  label: string
  value: string
}

const RootLinkItem = component$((props: RootLinkItemProps) => {
  const item = usePart$(
    () =>
      navigationMenu
        .connect(props.machine.controller.value.service, normalizeProps)
        .getItemProps({ value: props.value }),
    props.machine,
  )

  return (
    <div ref={item.ref} {...item.props}>
      <NavLink machine={props.machine} text={props.label} value={props.value} />
    </div>
  )
})

interface ContentPanelProps extends MachineProps {
  columns: string[][]
  style: Record<string, string>
  value: string
}

const ContentPanel = component$((props: ContentPanelProps) => {
  const content = usePart$(
    () =>
      navigationMenu
        .connect(props.machine.controller.value.service, normalizeProps)
        .getContentProps({ value: props.value }),
    props.machine,
  )

  return (
    <div ref={content.ref} style={props.style} {...content.props}>
      {props.columns.flatMap((column) =>
        column.map((item) => (
          <NavLink key={`${props.value}-${item}`} machine={props.machine} text={item} value={props.value} />
        )),
      )}
    </div>
  )
})

export default component$(() => {
  const id = useId()
  const machine = useMachine$(() =>
    createMachineSerializer(navigationMenu.machine, {
      props: () => ({ id }),
    }),
  )

  const root = usePart$(
    () => navigationMenu.connect(machine.controller.value.service, normalizeProps).getRootProps(),
    machine,
  )
  const list = usePart$(
    () => navigationMenu.connect(machine.controller.value.service, normalizeProps).getListProps(),
    machine,
  )
  const indicator = usePart$(
    () => navigationMenu.connect(machine.controller.value.service, normalizeProps).getIndicatorProps(),
    machine,
  )
  const arrow = usePart$(
    () => navigationMenu.connect(machine.controller.value.service, normalizeProps).getArrowProps(),
    machine,
  )
  const viewportPositioner = usePart$(
    () => navigationMenu.connect(machine.controller.value.service, normalizeProps).getViewportPositionerProps(),
    machine,
  )
  const viewport = usePart$(
    () => navigationMenu.connect(machine.controller.value.service, normalizeProps).getViewportProps(),
    machine,
  )

  return (
    <>
      <main class="navigation-menu viewport">
        <div
          style={{
            alignItems: "center",
            backgroundColor: "white",
            boxShadow: "0 50px 100px -20px rgba(50,50,93,0.1),0 30px 60px -30px rgba(0,0,0,0.2)",
            boxSizing: "border-box",
            display: "flex",
            justifyContent: "space-between",
            padding: "15px 20px",
            position: "relative",
            width: "100%",
          }}
        >
          <button>Logo</button>

          <div ref={root.ref} {...root.props}>
            <div ref={list.ref} {...list.props}>
              <TriggerItem label="Products" machine={machine} value="products" />
              <TriggerItem label="Company" machine={machine} value="company" />
              <TriggerItem label="Developers" machine={machine} value="developers" />
              <RootLinkItem label="Pricing" machine={machine} value="pricing" />

              <div ref={indicator.ref} {...indicator.props}>
                <div ref={arrow.ref} {...arrow.props} />
              </div>
            </div>

            <div ref={viewportPositioner.ref} {...viewportPositioner.props}>
              <div ref={viewport.ref} {...viewport.props}>
                <ContentPanel
                  columns={productsColumns}
                  machine={machine}
                  style={viewportStyles.products}
                  value="products"
                />
                <ContentPanel
                  columns={companyColumns}
                  machine={machine}
                  style={viewportStyles.company}
                  value="company"
                />
                <ContentPanel
                  columns={developersColumns}
                  machine={machine}
                  style={viewportStyles.developers}
                  value="developers"
                />
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

      <Toolbar viz>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Navigation Menu Viewport | Zag Qwik Examples",
}

import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as navigationMenu from "@zag-js/navigation-menu"
import { createMachineSerializer, normalizeProps, useMachine$, usePart$, type QwikMachineSignal } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

const productsLinks = [
  "Analytics Platform",
  "Customer Engagement",
  "Marketing Automation",
  "Data Integration",
  "Enterprise Solutions",
  "API Documentation",
]

const companyLinks = ["About Us", "Leadership Team", "Careers", "Press Releases"]

const developersLinks = ["Investors", "Partners", "Corporate Responsibility"]

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
      <polyline points="6,9 12,15 18,9" />
    </svg>
  )
})

interface NavigationMenuItemProps {
  label: string
  links: readonly string[]
  machine: QwikMachineSignal<any>
  value: string
}

interface NavigationMenuLinkProps {
  label: string
  machine: QwikMachineSignal<any>
  value: string
}

const NavigationMenuLink = component$<NavigationMenuLinkProps>(({ label, machine, value }) => {
  const link = usePart$(
    () => navigationMenu.connect(machine.controller.value.service, normalizeProps).getLinkProps({ value }),
    machine,
  )

  return (
    <a href="#" ref={link.ref} {...link.props}>
      {label}
    </a>
  )
})

const NavigationMenuItem = component$<NavigationMenuItemProps>(({ label, links, machine, value }) => {
  const item = usePart$(
    () => navigationMenu.connect(machine.controller.value.service, normalizeProps).getItemProps({ value }),
    machine,
  )
  const trigger = usePart$(
    () => navigationMenu.connect(machine.controller.value.service, normalizeProps).getTriggerProps({ value }),
    machine,
  )
  const content = usePart$(
    () => navigationMenu.connect(machine.controller.value.service, normalizeProps).getContentProps({ value }),
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

  return (
    <div ref={item.ref} {...item.props}>
      <button ref={trigger.ref} {...trigger.props}>
        {label}
        <ChevronDown />
      </button>
      <div ref={content.ref} {...content.props}>
        <div ref={indicator.ref} {...indicator.props}>
          <div ref={arrow.ref} {...arrow.props} />
        </div>
        {links.map((link) => (
          <NavigationMenuLink key={`${value}-${link}`} label={link} machine={machine} value={value} />
        ))}
      </div>
    </div>
  )
})

export default component$(() => {
  const id = useId()
  const machine = useMachine$(() =>
    createMachineSerializer(navigationMenu.machine, {
      props: () => ({
        id,
      }),
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
  const pricingItem = usePart$(
    () => navigationMenu.connect(machine.controller.value.service, normalizeProps).getItemProps({ value: "pricing" }),
    machine,
  )

  return (
    <>
      <main class="navigation-menu basic">
        <div ref={root.ref} {...root.props}>
          <div ref={list.ref} {...list.props}>
            <NavigationMenuItem label="Products" links={productsLinks} machine={machine} value="products" />
            <NavigationMenuItem label="Company" links={companyLinks} machine={machine} value="company" />
            <NavigationMenuItem label="Developers" links={developersLinks} machine={machine} value="developers" />

            <div ref={pricingItem.ref} {...pricingItem.props}>
              <NavigationMenuLink label="Pricing" machine={machine} value="pricing" />
            </div>
          </div>
        </div>
      </main>

      <Toolbar viz>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Navigation Menu | Zag Qwik Examples",
}

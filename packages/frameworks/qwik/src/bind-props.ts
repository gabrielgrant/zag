export type ZagProps = Record<string, unknown>

export interface SplitProps {
  eventProps: Record<string, EventListener>
  staticProps: ZagProps
}

interface Binding {
  cleanup: VoidFunction
}

const bindings = new WeakMap<Element, Binding>()
const styleVariables = new WeakMap<Element, Map<string, string>>()

function syncCompositeFocus(node: Element, props: ZagProps): VoidFunction {
  if (props.role !== "menu") return () => {}

  let frame = 0
  let timer = 0
  let attempts = 0
  const isOpen = () => node.getAttribute("data-state") === "open" || props["data-state"] === "open"
  const focus = () => {
    if (!node.isConnected) return
    if (!isOpen()) return
    if (node.hasAttribute("hidden")) return
    if (node.contains(node.ownerDocument.activeElement)) return
    const element = node as HTMLElement
    if (element.tabIndex < 0) element.tabIndex = 0
    element.focus({ preventScroll: true })
    attempts += 1
    if (node.ownerDocument.activeElement === node) return
    if (attempts >= 3) return
    timer = window.setTimeout(() => {
      frame = requestAnimationFrame(focus)
    })
  }
  const scheduleFocus = () => {
    cancelAnimationFrame(frame)
    clearTimeout(timer)
    attempts = 0
    frame = requestAnimationFrame(focus)
  }

  const observer = new MutationObserver(scheduleFocus)
  observer.observe(node, { attributeFilter: ["data-state", "hidden"] })
  scheduleFocus()

  return () => {
    observer.disconnect()
    cancelAnimationFrame(frame)
    clearTimeout(timer)
  }
}

function preserveStyleVariables(node: Element): VoidFunction {
  const style = (node as HTMLElement).style
  if (!style) return () => {}

  const variables = styleVariables.get(node) ?? new Map<string, string>()
  styleVariables.set(node, variables)
  const readVariables = () => {
    Array.from(style).forEach((name) => {
      if (name.startsWith("--")) variables.set(name, style.getPropertyValue(name))
    })
  }
  const restoreVariables = () => {
    variables.forEach((value, name) => {
      if (!style.getPropertyValue(name)) style.setProperty(name, value)
    })
  }

  readVariables()
  restoreVariables()
  const observer = new MutationObserver(() => {
    readVariables()
    restoreVariables()
  })
  observer.observe(node, { attributeFilter: ["style"] })

  return () => {
    observer.disconnect()
  }
}

export function splitProps(props: ZagProps): SplitProps {
  const eventProps: Record<string, EventListener> = {}
  const staticProps: ZagProps = {}

  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith("on") && typeof value === "function") {
      eventProps[key.slice(2).toLowerCase()] = value as EventListener
    } else {
      staticProps[key] = value
    }
  })

  return { eventProps, staticProps }
}

export function bindProps(node: Element, props: ZagProps): VoidFunction {
  bindings.get(node)?.cleanup()
  const { eventProps } = splitProps(props)
  const stopPreservingStyleVariables = preserveStyleVariables(node)
  const stopSyncingCompositeFocus = syncCompositeFocus(node, props)

  Object.entries(eventProps).forEach(([event, listener]) => {
    node.addEventListener(event, listener)
  })

  const binding: Binding = {
    cleanup() {
      stopPreservingStyleVariables()
      stopSyncingCompositeFocus()
      Object.entries(eventProps).forEach(([event, listener]) => {
        node.removeEventListener(event, listener)
      })
      if (bindings.get(node) === binding) bindings.delete(node)
    },
  }
  bindings.set(node, binding)

  return () => {
    binding.cleanup()
  }
}

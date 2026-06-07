export type ZagProps = Record<string, unknown>

export interface SplitProps {
  eventProps: Record<string, EventListener>
  staticProps: ZagProps
}

interface Binding {
  cleanup: VoidFunction
  eventBindings: Map<string, { listener: EventListener; wrapped: EventListener }>
  stopPreservingStyleVariables: VoidFunction
  version: number
}

const bindings = new WeakMap<Element, Binding>()
const styleVariables = new WeakMap<Element, Map<string, string>>()
const staticPropsByNode = new WeakMap<Element, Set<string>>()
const stylePropsByNode = new WeakMap<Element, Set<string>>()
const stringStyleNodes = new WeakSet<Element>()
const activelyEditedInputs = new WeakSet<Element>()
const inputEditVersions = new WeakMap<Element, number>()
const replayedInitialInputs = new WeakSet<Element>()
let activeInputNode: HTMLInputElement | HTMLTextAreaElement | undefined
let currentEventType: string | undefined

function preserveActiveInputValue(eventObject: Event) {
  const node = eventObject.currentTarget
  if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) return

  activelyEditedInputs.add(node)
  activeInputNode = node
  const version = (inputEditVersions.get(node) ?? 0) + 1
  inputEditVersions.set(node, version)

  const value = node.value
  const selectionStart = node.selectionStart
  const selectionEnd = node.selectionEnd

  queueMicrotask(() => {
    requestAnimationFrame(() => {
      if (!activelyEditedInputs.has(node)) return
      if (inputEditVersions.get(node) !== version) return
      if (node.value !== value) node.value = value
      if (selectionStart != null && selectionEnd != null && document.activeElement === node) {
        node.setSelectionRange(selectionStart, selectionEnd)
      }
    })
  })
}

function clearActiveInputValue(eventObject: Event) {
  const node = eventObject.currentTarget
  if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) return
  activelyEditedInputs.delete(node)
  inputEditVersions.delete(node)
  if (activeInputNode === node) activeInputNode = undefined
}

function clearActiveInputNode() {
  if (!activeInputNode) return
  activelyEditedInputs.delete(activeInputNode)
  inputEditVersions.delete(activeInputNode)
  activeInputNode = undefined
}

function replayMissedInitialInput(node: Element, eventProps: Record<string, EventListener>) {
  if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) return
  if (replayedInitialInputs.has(node)) return
  if (!eventProps.input) return
  replayedInitialInputs.add(node)
  if (node.value === node.defaultValue) return
  if (document.activeElement !== node) return

  node.dispatchEvent(new Event("input", { bubbles: true }))
}

function getAttributeName(key: string) {
  if (key === "className") return "class"
  if (key === "htmlFor") return "for"
  return key
}

function getStyleName(key: string) {
  return key.startsWith("--") ? key : key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
}

function restoreTrackedStyleVariables(node: Element) {
  const style = (node as HTMLElement).style
  if (!style) return

  styleVariables.get(node)?.forEach((value, name) => {
    if (!style.getPropertyValue(name)) style.setProperty(name, value)
  })
}

function setStyleProps(node: Element, value: unknown) {
  const style = (node as HTMLElement).style
  if (!style) return

  if (typeof value === "string") {
    style.cssText = value
    stylePropsByNode.delete(node)
    stringStyleNodes.add(node)
    restoreTrackedStyleVariables(node)
    return
  }

  if (stringStyleNodes.has(node)) {
    style.cssText = ""
    stringStyleNodes.delete(node)
  }

  const prevNames = stylePropsByNode.get(node) ?? new Set<string>()
  const nextNames = new Set<string>()
  const nextStyle = value && typeof value === "object" ? (value as Record<string, unknown>) : {}

  prevNames.forEach((name) => {
    if (!(name in nextStyle)) style.removeProperty(getStyleName(name))
  })

  Object.entries(nextStyle).forEach(([name, styleValue]) => {
    const styleName = getStyleName(name)
    nextNames.add(name)
    if (styleValue == null || styleValue === false) {
      style.removeProperty(styleName)
    } else {
      style.setProperty(styleName, String(styleValue))
    }
  })

  stylePropsByNode.set(node, nextNames)
  restoreTrackedStyleVariables(node)
}

function removeStaticProp(node: Element, key: string) {
  const attribute = getAttributeName(key)

  if (key === "style") {
    setStyleProps(node, undefined)
    return
  }

  node.removeAttribute(attribute)

  if (key in node && !key.startsWith("aria-") && !key.startsWith("data-") && typeof (node as any)[key] === "boolean") {
    try {
      ;(node as any)[key] = false
    } catch {
      // Some DOM properties are readonly.
    }
  }
}

function setStaticProp(node: Element, key: string, value: unknown) {
  const attribute = getAttributeName(key)
  const remove = value == null || (value === false && !key.startsWith("aria-") && !key.startsWith("data-"))

  if (key === "style") {
    setStyleProps(node, value)
    return
  }

  if (key === "defaultValue" && (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) {
    node.defaultValue = value == null ? "" : String(value)
    node.setAttribute(attribute, node.defaultValue)

    if (currentEventType === "input") {
      activelyEditedInputs.add(node)
      return
    }

    if (currentEventType !== undefined || !activelyEditedInputs.has(node)) {
      node.value = node.defaultValue
      activelyEditedInputs.delete(node)
      inputEditVersions.delete(node)
    }
    return
  }

  if (remove) {
    removeStaticProp(node, key)
    return
  }

  if (key in node && !key.startsWith("aria-") && !key.startsWith("data-")) {
    try {
      ;(node as any)[key] = value
    } catch {
      // Some DOM properties are readonly.
    }
  }

  node.setAttribute(
    attribute,
    value === true && !key.startsWith("aria-") && !key.startsWith("data-") ? "" : String(value),
  )
}

function syncStaticProps(node: Element, props: ZagProps) {
  const nextProps = splitProps(props).staticProps
  const prevKeys = staticPropsByNode.get(node) ?? new Set<string>()
  const nextKeys = new Set(Object.keys(nextProps))

  prevKeys.forEach((key) => {
    if (!nextKeys.has(key)) removeStaticProp(node, key)
  })

  Object.entries(nextProps).forEach(([key, value]) => {
    setStaticProp(node, key, value)
  })

  staticPropsByNode.set(node, nextKeys)
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
  let binding = bindings.get(node)
  if (!binding) {
    const eventBindings: Binding["eventBindings"] = new Map()
    const stopPreservingStyleVariables = preserveStyleVariables(node)
    binding = {
      eventBindings,
      stopPreservingStyleVariables,
      version: 0,
      cleanup() {
        stopPreservingStyleVariables()
        eventBindings.forEach(({ wrapped }, event) => {
          node.removeEventListener(event, wrapped)
        })
        eventBindings.clear()
        if (bindings.get(node) === activeBinding) bindings.delete(node)
      },
    }
    bindings.set(node, binding)
  }
  const activeBinding = binding

  activeBinding.version += 1
  const version = activeBinding.version

  syncStaticProps(node, props)
  const { eventProps } = splitProps(props)
  const nextEvents = new Set(Object.keys(eventProps))

  Object.entries(eventProps).forEach(([event, listener]) => {
    const current = activeBinding.eventBindings.get(event)
    if (current) {
      current.listener = listener
      return
    }

    const entry = {
      listener,
      wrapped(eventObject: Event) {
        const previousEventType = currentEventType
        currentEventType = eventObject.type
        try {
          entry.listener(eventObject)
        } finally {
          if (eventObject.type === "input") preserveActiveInputValue(eventObject)
          if (eventObject.type === "focusout" || eventObject.type === "blur") clearActiveInputValue(eventObject)
          if (!["beforeinput", "input", "keydown"].includes(eventObject.type)) clearActiveInputNode()
          currentEventType = previousEventType
        }
      },
    }
    activeBinding.eventBindings.set(event, entry)
    node.addEventListener(event, entry.wrapped)
  })

  activeBinding.eventBindings.forEach(({ wrapped }, event) => {
    if (nextEvents.has(event)) return
    node.removeEventListener(event, wrapped)
    activeBinding.eventBindings.delete(event)
  })

  replayMissedInitialInput(node, eventProps)

  return () => {
    if (bindings.get(node) === activeBinding && activeBinding.version === version) activeBinding.cleanup()
  }
}

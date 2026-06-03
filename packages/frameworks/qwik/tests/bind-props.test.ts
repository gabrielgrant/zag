import { bindProps, splitProps } from "../src"

describe("splitProps", () => {
  test("separates native handlers from JSX-safe static props", () => {
    const onPointerDown = vi.fn()
    const result = splitProps({ id: "trigger", "aria-expanded": false, onPointerDown })

    expect(result.staticProps).toEqual({ id: "trigger", "aria-expanded": false })
    expect(result.eventProps).toEqual({ pointerdown: onPointerDown })
  })
})

describe("bindProps", () => {
  test("keeps conditional preventDefault authored by the machine handler", () => {
    const button = document.createElement("button")
    const cleanup = bindProps(button, {
      onPointerDown(event: Event) {
        if ((event as PointerEvent).pointerType === "mouse") event.preventDefault()
      },
    })

    const mouse = new Event("pointerdown", { cancelable: true }) as PointerEvent
    const touch = new Event("pointerdown", { cancelable: true }) as PointerEvent
    Object.defineProperty(mouse, "pointerType", { value: "mouse" })
    Object.defineProperty(touch, "pointerType", { value: "touch" })
    button.dispatchEvent(mouse)
    button.dispatchEvent(touch)

    expect(mouse.defaultPrevented).toBe(true)
    expect(touch.defaultPrevented).toBe(false)
    cleanup()
  })

  test("cleanup detaches listeners deterministically", () => {
    const button = document.createElement("button")
    const onClick = vi.fn()
    const cleanup = bindProps(button, { onClick })

    button.click()
    cleanup()
    button.click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  test("rebinding replaces listeners without allowing stale cleanup to detach the replacement", () => {
    const button = document.createElement("button")
    const first = vi.fn()
    const second = vi.fn()
    const cleanupFirst = bindProps(button, { onClick: first })
    bindProps(button, { onClick: second })

    cleanupFirst()
    button.click()

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
  })

  test("preserves runtime CSS variables across declarative style replacements", async () => {
    const positioner = document.createElement("div")
    const cleanup = bindProps(positioner, {})

    positioner.style.setProperty("--x", "24px")
    await Promise.resolve()
    positioner.setAttribute("style", "transform: translate3d(var(--x), var(--y), 0)")
    await Promise.resolve()

    expect(positioner.style.getPropertyValue("--x")).toBe("24px")

    cleanup()
    positioner.setAttribute("style", "transform: none")
    await Promise.resolve()

    expect(positioner.style.getPropertyValue("--x")).toBe("")
  })

  test("refocuses an open composite menu after it is rebound", () => {
    const content = document.createElement("ul")
    const focus = vi.spyOn(content, "focus")
    let frame: FrameRequestCallback | undefined

    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
      frame = fn
      return 1
    })
    vi.stubGlobal("cancelAnimationFrame", vi.fn())

    document.body.append(content)

    const cleanup = bindProps(content, {
      role: "menu",
      tabIndex: 0,
      "data-state": "open",
    })
    frame?.(0)

    expect(focus).toHaveBeenCalledWith({ preventScroll: true })

    cleanup()
    content.remove()
    vi.unstubAllGlobals()
  })

  test("refocuses a composite menu when it opens after binding", async () => {
    const content = document.createElement("ul")
    const focus = vi.spyOn(content, "focus")
    const frames: FrameRequestCallback[] = []

    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
      frames.push(fn)
      return frames.length
    })
    vi.stubGlobal("cancelAnimationFrame", vi.fn())

    document.body.append(content)

    const cleanup = bindProps(content, {
      role: "menu",
      tabIndex: -1,
      "data-state": "closed",
    })
    frames.shift()?.(0)
    content.setAttribute("data-state", "open")
    await Promise.resolve()
    frames.shift()?.(0)

    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(content.tabIndex).toBe(0)

    cleanup()
    content.remove()
    vi.unstubAllGlobals()
  })
})

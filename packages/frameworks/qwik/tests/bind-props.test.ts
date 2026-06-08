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
  test("syncs static props onto the bound element immediately", () => {
    const content = document.createElement("ul")

    bindProps(content, {
      role: "menu",
      hidden: true,
      tabIndex: -1,
      "aria-hidden": true,
      "data-state": "closed",
    })

    expect(content.role).toBe("menu")
    expect(content.hidden).toBe(true)
    expect(content.tabIndex).toBe(-1)
    expect(content.getAttribute("aria-hidden")).toBe("true")
    expect(content.getAttribute("data-state")).toBe("closed")

    bindProps(content, {
      role: "menu",
      tabIndex: 0,
      "aria-hidden": false,
      "data-state": "open",
    })

    expect(content.hidden).toBe(false)
    expect(content.hasAttribute("hidden")).toBe(false)
    expect(content.tabIndex).toBe(0)
    expect(content.getAttribute("aria-hidden")).toBe("false")
    expect(content.getAttribute("data-state")).toBe("open")
  })

  test("removes stale static props after rebinding", () => {
    const item = document.createElement("div")

    bindProps(item, {
      id: "first",
      "data-highlighted": "",
      "aria-disabled": true,
    })
    bindProps(item, { id: "first" })

    expect(item.hasAttribute("data-highlighted")).toBe(false)
    expect(item.hasAttribute("aria-disabled")).toBe(false)
  })

  test("removing stale numeric props restores the native default", () => {
    const content = document.createElement("ul")

    bindProps(content, { tabIndex: 0 })
    expect(content.tabIndex).toBe(0)

    bindProps(content, {})
    expect(content.hasAttribute("tabindex")).toBe(false)
    expect(content.tabIndex).toBe(-1)
  })

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

  test("does not overwrite an active input value from defaultValue after text insertion events", () => {
    const input = document.createElement("input")
    const cleanup = bindProps(input, {
      defaultValue: "",
      onInput() {
        bindProps(input, { defaultValue: "$5,555.00" })
      },
    })

    input.value = "$5555.00"
    input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }))
    bindProps(input, { defaultValue: "$5,555.00" })

    expect(input.value).toBe("$5555.00")
    expect(input.defaultValue).toBe("$5,555.00")
    cleanup()
  })

  test("allows non-insertion input events to apply machine-driven defaultValue changes", () => {
    const input = document.createElement("input")
    const cleanup = bindProps(input, {
      defaultValue: "2",
      onInput() {
        bindProps(input, { defaultValue: "3" })
      },
    })

    input.value = ""
    input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward" }))
    bindProps(input, { defaultValue: "3" })

    expect(input.value).toBe("3")
    expect(input.defaultValue).toBe("3")
    cleanup()
  })

  test("reads inputType structurally for browser and cross-realm input events", () => {
    const input = document.createElement("input")
    const cleanup = bindProps(input, {
      defaultValue: "2",
      onInput() {
        bindProps(input, { defaultValue: "3" })
      },
    })

    input.value = ""
    const event = new Event("input", { bubbles: true })
    Object.defineProperty(event, "inputType", { value: "deleteContentBackward" })
    input.dispatchEvent(event)
    bindProps(input, { defaultValue: "3" })

    expect(input.value).toBe("3")
    expect(input.defaultValue).toBe("3")
    cleanup()
  })

  test("hydrates missing inputType on input events from the previous beforeinput event", () => {
    const input = document.createElement("input")
    const inputTypes: Array<string | undefined> = []
    const cleanup = bindProps(input, {
      defaultValue: "2",
      onBeforeInput() {},
      onInput(event: Event) {
        inputTypes.push((event as { inputType?: string }).inputType)
        bindProps(input, { defaultValue: "3" })
      },
    })

    const beforeInput = new Event("beforeinput", { bubbles: true })
    Object.defineProperty(beforeInput, "inputType", { value: "deleteByCut" })
    input.dispatchEvent(beforeInput)

    input.value = ""
    input.dispatchEvent(new Event("input", { bubbles: true }))
    bindProps(input, { defaultValue: "3" })

    expect(inputTypes).toEqual(["deleteByCut"])
    expect(input.value).toBe("3")
    expect(input.defaultValue).toBe("3")
    cleanup()
  })

  test("synthesizes a deleteByCut input event when cut changes a value without a native input event", async () => {
    const input = document.createElement("input")
    document.body.appendChild(input)
    input.value = "2"
    const inputTypes: Array<string | undefined> = []
    const cleanup = bindProps(input, {
      defaultValue: "2",
      onInput(event: Event) {
        inputTypes.push((event as { inputType?: string }).inputType)
      },
    })

    input.addEventListener("cut", () => {
      input.value = ""
    })

    input.dispatchEvent(new Event("cut", { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve))

    expect(inputTypes).toEqual(["deleteByCut"])
    cleanup()
    input.remove()
  })

  test("does not synthesize a cut input event when the browser already emitted input", async () => {
    const input = document.createElement("input")
    document.body.appendChild(input)
    input.value = "2"
    const inputTypes: Array<string | undefined> = []
    const cleanup = bindProps(input, {
      defaultValue: "2",
      onInput(event: Event) {
        inputTypes.push((event as { inputType?: string }).inputType)
      },
    })

    input.addEventListener("cut", () => {
      input.value = ""
      input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteByCut" }))
    })

    input.dispatchEvent(new Event("cut", { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve))

    expect(inputTypes).toEqual(["deleteByCut"])
    cleanup()
    input.remove()
  })

  test("synthesizes a deleteByCut input event when keyboard cut does not mutate the input", async () => {
    const input = document.createElement("input")
    document.body.appendChild(input)
    input.value = "123"
    input.setSelectionRange(1, 2)
    const inputTypes: Array<string | undefined> = []
    const cleanup = bindProps(input, {
      defaultValue: "123",
      onInput(event: Event) {
        inputTypes.push((event as { inputType?: string }).inputType)
      },
      onKeyDown() {},
    })

    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ctrlKey: true, key: "x" }))
    await new Promise((resolve) => setTimeout(resolve))

    expect(input.value).toBe("13")
    expect(inputTypes).toEqual(["deleteByCut"])
    cleanup()
    input.remove()
  })

  test("does not synthesize keyboard cut input when the browser already emitted input", async () => {
    const input = document.createElement("input")
    document.body.appendChild(input)
    input.value = "123"
    input.setSelectionRange(1, 2)
    const inputTypes: Array<string | undefined> = []
    const cleanup = bindProps(input, {
      defaultValue: "123",
      onInput(event: Event) {
        inputTypes.push((event as { inputType?: string }).inputType)
      },
      onKeyDown() {
        input.value = "13"
        input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteByCut" }))
      },
    })

    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ctrlKey: true, key: "x" }))
    await new Promise((resolve) => setTimeout(resolve))

    expect(input.value).toBe("13")
    expect(inputTypes).toEqual(["deleteByCut"])
    cleanup()
    input.remove()
  })

  test("clears stale active input preservation after non-insertion input events", () => {
    const input = document.createElement("input")
    const cleanup = bindProps(input, {
      defaultValue: "",
      onInput() {},
    })

    input.value = "2"
    input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }))

    input.value = ""
    input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward" }))
    bindProps(input, { defaultValue: "3" })

    expect(input.value).toBe("3")
    expect(input.defaultValue).toBe("3")
    cleanup()
  })

  test("does write defaultValue to the current input value after non-input events", () => {
    const input = document.createElement("input")
    const cleanup = bindProps(input, {
      defaultValue: "5",
      onKeyDown() {
        bindProps(input, { defaultValue: "6" })
      },
    })

    input.value = "5"
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }))

    expect(input.value).toBe("6")
    expect(input.defaultValue).toBe("6")
    cleanup()
  })

  test("preserves runtime CSS variables across declarative style replacements", async () => {
    const positioner = document.createElement("div")
    const cleanup = bindProps(positioner, { style: { transform: "translate3d(var(--x), var(--y), 0)" } })

    positioner.style.setProperty("--x", "24px")
    await Promise.resolve()
    bindProps(positioner, { style: { position: "absolute", transform: "translate3d(var(--x), var(--y), 0)" } })
    await Promise.resolve()

    expect(positioner.style.getPropertyValue("--x")).toBe("24px")
    expect(positioner.style.position).toBe("absolute")

    cleanup()
    bindProps(positioner, { style: { transform: "none" } })
    await Promise.resolve()

    expect(positioner.style.getPropertyValue("--x")).toBe("24px")
    expect(positioner.style.position).toBe("")
  })

  test("preserves runtime CSS variables across string style replacements", async () => {
    const positioner = document.createElement("div")

    const cleanup = bindProps(positioner, { style: "transform: translate3d(var(--x), var(--y), 0)" })
    positioner.style.setProperty("--x", "24px")
    await Promise.resolve()

    bindProps(positioner, { style: "transform: none" })

    expect(positioner.style.transform).toBe("none")
    expect(positioner.style.getPropertyValue("--x")).toBe("24px")

    cleanup()
  })

  test("removes stale string style props when rebinding object styles", () => {
    const positioner = document.createElement("div")

    bindProps(positioner, { style: "transform: none; color: red" })
    bindProps(positioner, { style: { position: "absolute" } })

    expect(positioner.style.position).toBe("absolute")
    expect(positioner.style.transform).toBe("")
    expect(positioner.style.color).toBe("")
  })
})

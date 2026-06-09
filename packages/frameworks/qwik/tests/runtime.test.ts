import { createMachine } from "@zag-js/core"
import { QwikMachine } from "../src"

async function tick() {
  await Promise.resolve()
  await Promise.resolve()
}

describe("QwikMachine", () => {
  test("keeps one live controller through a pointer and click chain", async () => {
    const machine = createMachine<any>({
      initialState() {
        return "closed"
      },
      states: {
        closed: {
          on: {
            OPEN: { target: "open" },
          },
        },
        open: {},
      },
    })
    const runtime = new QwikMachine(machine)
    const button = document.createElement("button")
    const cleanup = runtime.bind(button, {
      onPointerDown(event: Event) {
        event.preventDefault()
      },
      onClick() {
        runtime.send({ type: "OPEN" })
      },
    })

    runtime.start()
    button.dispatchEvent(new Event("pointerdown", { cancelable: true }))
    button.click()
    await tick()

    expect(runtime.state.get()).toBe("open")
    expect(runtime.toSnapshot().state).toBe("open")
    cleanup()
    runtime.stop()
  })

  test("coalesces serializer commits to one animation frame", () => {
    const runtime = new QwikMachine(
      createMachine<any>({
        initialState: () => "idle",
        states: { idle: {} },
      }),
    )
    const commit = vi.fn()
    let frame: FrameRequestCallback | undefined
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
      frame = fn
      return 1
    })
    vi.stubGlobal("cancelAnimationFrame", vi.fn())

    runtime.scheduleCommit(commit)
    runtime.scheduleCommit(commit)
    frame?.(0)

    expect(commit).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })

  test("allows a follow-up commit before the post-commit binding refresh frame", () => {
    const runtime = new QwikMachine(
      createMachine<any>({
        initialState: () => "idle",
        states: { idle: {} },
      }),
    )
    const commit = vi.fn()
    let frameId = 0
    const frames = new Map<number, FrameRequestCallback>()
    const runNextFrame = () => {
      const next = frames.entries().next().value
      if (!next) return
      const [id, callback] = next
      frames.delete(id)
      callback(0)
    }
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
      frameId += 1
      frames.set(frameId, fn)
      return frameId
    })
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      frames.delete(id)
    })

    runtime.scheduleCommit(commit)
    runNextFrame()
    expect(commit).toHaveBeenCalledOnce()

    runtime.scheduleCommit(commit)
    expect(commit).toHaveBeenCalledOnce()

    runNextFrame()
    expect(commit).toHaveBeenCalledTimes(2)

    vi.unstubAllGlobals()
  })

  test("refreshes bound DOM props from factories before animation frame work runs", () => {
    const runtime = new QwikMachine(
      createMachine<any>({
        initialState: () => "idle",
        states: { idle: {} },
      }),
    )
    const content = document.createElement("div")
    let open = false
    let frame: FrameRequestCallback | undefined
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
      frame = fn
      return 1
    })
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
    document.body.append(content)

    const cleanup = runtime.bind(content, () => ({
      hidden: !open,
      "data-state": open ? "open" : "closed",
    }))
    expect(content.hidden).toBe(true)
    expect(content.getAttribute("data-state")).toBe("closed")

    open = true
    const commit = vi.fn()
    runtime.scheduleCommit(commit)

    expect(content.hidden).toBe(false)
    expect(content.getAttribute("data-state")).toBe("open")
    expect(commit).not.toHaveBeenCalled()

    frame?.(0)
    expect(commit).toHaveBeenCalledOnce()

    cleanup()
    content.remove()
    vi.unstubAllGlobals()
  })

  test("requests a render commit after bound event handlers run", () => {
    const runtime = new QwikMachine(
      createMachine<any>({
        initialState: () => "idle",
        states: { idle: {} },
      }),
    )
    const button = document.createElement("button")
    const commit = vi.fn()
    let selected = true
    let frame: FrameRequestCallback | undefined
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
      frame = fn
      return 1
    })
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
    document.body.append(button)

    runtime.setCommit(commit)
    const cleanup = runtime.bind(button, () => ({
      "data-selected": selected ? "" : undefined,
      onClick() {
        selected = false
      },
    }))

    expect(button.hasAttribute("data-selected")).toBe(true)
    button.click()

    expect(button.hasAttribute("data-selected")).toBe(false)
    expect(commit).not.toHaveBeenCalled()

    frame?.(0)
    expect(commit).toHaveBeenCalledOnce()

    cleanup()
    runtime.setCommit(undefined)
    button.remove()
    vi.unstubAllGlobals()
  })

  test("refreshes DOM props and commits render state after pointer-driven machine updates", () => {
    const runtime = new QwikMachine(
      createMachine<any>({
        initialState: () => "idle",
        states: { idle: {} },
      }),
    )
    const item = document.createElement("div")
    const commit = vi.fn()
    let highlighted = false
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
      frames.push(fn)
      return frames.length
    })
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
    document.body.append(item)

    const cleanup = runtime.bind(item, () => ({
      "data-highlighted": highlighted ? "" : undefined,
      onPointerEnter() {
        highlighted = true
        runtime.scheduleCommit(commit)
      },
    }))

    item.dispatchEvent(new Event("pointerenter"))

    expect(item.hasAttribute("data-highlighted")).toBe(true)
    expect(commit).not.toHaveBeenCalled()

    frames.shift()?.(0)
    expect(commit).toHaveBeenCalledOnce()

    cleanup()
    item.remove()
    vi.unstubAllGlobals()
  })
})

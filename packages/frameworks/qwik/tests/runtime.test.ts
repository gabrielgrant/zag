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
})

import { normalizeProps } from "../src"

describe("normalizeProps", () => {
  test("preserves style objects so native positioning variables survive rerenders", () => {
    const style = {
      position: "absolute",
      transform: "translate3d(var(--x), var(--y), 0)",
    } as const

    expect(normalizeProps.element({ style })).toEqual({ style })
  })

  test("maps DOM aliases without converting props to vanilla attribute strings", () => {
    const onFocus = vi.fn()

    expect(normalizeProps.button({ className: "trigger", onFocus })).toEqual({
      class: "trigger",
      onFocusin: onFocus,
    })
  })
})

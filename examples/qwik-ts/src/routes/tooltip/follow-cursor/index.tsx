import { component$ } from "@qwik.dev/core"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import * as tooltip from "@zag-js/tooltip"

/** see pin-input example: live api handle for custom (non-zag) handlers */
const apiRef: { current?: tooltip.Api } = {}

/** React: `useRef<DOMRect | null>` — client-only, read by getAnchorRect */
const anchorRect: { current: DOMRect | null } = { current: null }

export default component$(() => {
  const id = "tip-1"

  const service = useMachine(tooltip.machine, {
    id: "1",
    openDelay: 0,
    closeDelay: 0,
    positioning: {
      gutter: 4,
      placement: "top-start",
      getAnchorRect: () => anchorRect.current,
    },
  })

  const api = tooltip.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <main class="tooltip">
      {/*
        React merges an onPointerMove into the trigger props. The trigger already
        carries the machine's own pointermove handler and a QRL cannot be merged
        with it, so the (bubbling) pointermove is handled here, for the trigger only.
      */}
      <div
        class="root"
        onPointerMove$={(event: PointerEvent) => {
          const target = event.target as Element | null
          if (!target?.closest("[data-scope=tooltip][data-part=trigger]")) return
          anchorRect.current = DOMRect.fromRect({
            x: event.clientX,
            y: event.clientY,
            width: 1,
            height: 1,
          })
          apiRef.current?.reposition()
        }}
      >
        <button
          data-testid={`${id}-trigger`}
          {...mergeProps(api.getTriggerProps(), { style: { width: "200px", height: "40px" } })}
        >
          Hover me
        </button>
        <div {...api.getPositionerProps()}>
          <div class="tooltip-content" data-testid={`${id}-tooltip`} {...api.getContentProps()}>
            Tooltip
          </div>
        </div>
      </div>
    </main>
  )
})

import { component$, useId, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import * as popover from "@zag-js/popover"
import { normalizeProps, useMachine } from "@zag-js/qwik"

/**
 * QRL handlers/tasks can't capture the (non-serializable) connect api
 * directly; a module-level holder, refreshed on every render, gives them a
 * live reference once the component is activated.
 */
const apiRef: { current?: popover.Api } = {}

function hasSelectionWithin(el?: Element | null) {
  if (!el) return false

  const selection = el.ownerDocument.getSelection()
  if (!selection?.rangeCount) return false

  const range = selection.getRangeAt(0)
  if (range.collapsed) return false

  return !!el.contains(range.commonAncestorContainer)
}

export default component$(() => {
  const id = useId()
  const divRef = useSignal<HTMLDivElement>()
  const contentRef = useSignal<HTMLDivElement>()

  const service = useMachine(popover.machine, () => ({
    id,
    autoFocus: false,
    positioning: {
      placement: "top" as const,
      getAnchorRect() {
        const selection = divRef.value?.ownerDocument.getSelection()
        if (!selection?.rangeCount) return null
        const range = selection.getRangeAt(0)
        return range.getBoundingClientRect()
      },
    },
  }))

  const api = popover.connect(service, normalizeProps)
  apiRef.current = api

  useVisibleTask$(({ cleanup }) => {
    const content = contentRef.value
    const node = divRef.value

    if (!content) return
    if (!node) return

    const doc = node.ownerDocument || document

    const onMouseUp = () => {
      if (!hasSelectionWithin(node)) return
      apiRef.current?.reposition()
      apiRef.current?.setOpen(true)
    }

    const onSelect = () => {
      if (hasSelectionWithin(node)) {
        return apiRef.current?.reposition()
      }
      apiRef.current?.setOpen(false)
    }

    doc.addEventListener("mouseup", onMouseUp)
    doc.addEventListener("selectionchange", onSelect)

    cleanup(() => {
      doc.removeEventListener("mouseup", onMouseUp)
      doc.removeEventListener("selectionchange", onSelect)
    })
  })

  return (
    <main class="popover">
      <div ref={divRef} style={{ maxWidth: "500px", fontSize: "20px" }}>
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Odio, sed fuga necessitatibus aliquid expedita atque?
        Doloremque ea sequi totam laudantium laboriosam repellat quasi commodi omnis aut nulla. Numquam, beatae maxime.
      </div>
      <div data-part="root">
        <div {...api.getPositionerProps()}>
          <div ref={contentRef} data-testid="popover-content" class="popover-content" {...api.getContentProps()}>
            <div {...api.getArrowProps()}>
              <div {...api.getArrowTipProps()} />
            </div>
            <button>Save</button>
            <button>Cancel</button>
            <button>Share</button>
          </div>
        </div>
      </div>
    </main>
  )
})

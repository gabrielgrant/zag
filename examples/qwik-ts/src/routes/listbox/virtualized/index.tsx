import { component$, noSerialize, useId, useSignal, useVisibleTask$, type NoSerialize } from "@qwik.dev/core"
import {
  Virtualizer,
  elementScroll,
  observeElementOffset,
  observeElementRect,
  type VirtualItem,
} from "@tanstack/virtual-core"
import { getComputedStyle } from "@zag-js/dom-query"
import * as listbox from "@zag-js/listbox"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"

interface Item {
  label: string
  value: string
}

const items: Item[] = new Array(10000).fill(0).map((_, index) => ({
  label: `Item ${index}`,
  value: `item-${index}`,
}))

// Created on first use rather than at module load (see tree-view/basic).
let collectionCache: ReturnType<typeof listbox.collection<Item>> | undefined
const getCollection = () => (collectionCache ??= listbox.collection({ items }))

const ESTIMATED_SIZE = 28

function getScrollPadding(el: HTMLElement, side: "start" | "end") {
  const style = getComputedStyle(el)
  return side === "start"
    ? Number.parseFloat(style.paddingBlockStart || style.paddingTop) +
        Number.parseFloat(style.borderBlockStartWidth || style.borderTopWidth) +
        Number.parseFloat(style.outlineWidth)
    : Number.parseFloat(style.paddingBlockEnd || style.paddingBottom) +
        Number.parseFloat(style.borderBlockEndWidth || style.borderBottomWidth) +
        Number.parseFloat(style.outlineWidth)
}

export default component$(() => {
  const id = useId()
  const contentRef = useSignal<HTMLElement>()

  // the virtualizer only exists on the client; what it computes is mirrored
  // into plain signals so rendering stays reactive
  const virtualizer = useSignal<NoSerialize<Virtualizer<HTMLElement, Element>>>()
  const virtualItems = useSignal<Pick<VirtualItem, "index" | "start">[]>([])
  const totalSize = useSignal(items.length * ESTIMATED_SIZE)

  useVisibleTask$(
    ({ cleanup }) => {
      const sync = (instance: Virtualizer<HTMLElement, Element>) => {
        virtualItems.value = instance.getVirtualItems().map(({ index, start }) => ({ index, start }))
        totalSize.value = instance.getTotalSize()
      }

      const instance = new Virtualizer<HTMLElement, Element>({
        count: items.length,
        getScrollElement: () => contentRef.value ?? null,
        estimateSize: () => ESTIMATED_SIZE,
        overscan: 12,
        scrollPaddingStart: contentRef.value ? getScrollPadding(contentRef.value, "start") : 0,
        scrollPaddingEnd: contentRef.value ? getScrollPadding(contentRef.value, "end") : 0,
        observeElementRect,
        observeElementOffset,
        scrollToFn: elementScroll,
        onChange: sync,
      })

      virtualizer.value = noSerialize(instance)
      const unmount = instance._didMount()
      instance._willUpdate()
      sync(instance)

      cleanup(() => {
        unmount()
        virtualizer.value = undefined
      })
    },
    { strategy: "document-ready" },
  )

  const service = useMachine(
    listbox.machine as listbox.Machine<Item>,
    () =>
      ({
        collection: getCollection(),
        id,
        scrollToIndexFn: (e: listbox.ScrollToIndexDetails) => {
          virtualizer.value?.scrollToIndex(e.index, { align: "auto" })
        },
      }) as listbox.Props<Item>,
  )

  const api = listbox.connect(service, normalizeProps)

  return (
    <>
      <main class="listbox">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Label</label>
          <div ref={contentRef} {...api.getContentProps()}>
            <div
              style={{
                height: `${totalSize.value}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualItems.value.map((virtualItem) => {
                const item = items[virtualItem.index]
                return (
                  <div
                    key={item.value}
                    {...mergeProps(api.getItemProps({ item }), {
                      style: {
                        position: "absolute",
                        top: "0",
                        insetBlockStart: "0",
                        transform: `translateY(${virtualItem.start}px)`,
                        overflowAnchor: "none",
                        width: "100%",
                      },
                    })}
                    data-index={virtualItem.index}
                    aria-setsize={items.length}
                    aria-posinset={virtualItem.index + 1}
                  >
                    <span {...api.getItemTextProps({ item })}>{item.label}</span>
                    <span {...api.getItemIndicatorProps({ item })}>✓</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  )
})

import { component$, noSerialize, useId, useSignal, useVisibleTask$, type NoSerialize } from "@qwik.dev/core"
import { elementScroll, observeElementOffset, observeElementRect, Virtualizer } from "@tanstack/virtual-core"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import * as select from "@zag-js/select"
import { selectData } from "@zag-js/shared"

interface Item {
  label: string
  value: string
}

interface VirtualRow {
  index: number
  start: number
  size: number
}

const ESTIMATE_SIZE = 32

export default component$(() => {
  const id = useId()
  const contentRef = useSignal<HTMLElement>()

  // @tanstack/virtual-core instance (client-only), rendering is driven by the
  // serializable signals below
  const virtualizer = useSignal<NoSerialize<Virtualizer<HTMLElement, Element>>>()
  const virtualItems = useSignal<VirtualRow[]>([])
  const totalSize = useSignal(selectData.length * ESTIMATE_SIZE)

  useVisibleTask$(
    ({ cleanup }) => {
      const sync = (instance: Virtualizer<HTMLElement, Element>) => {
        virtualItems.value = instance.getVirtualItems().map(({ index, start, size }) => ({ index, start, size }))
        totalSize.value = instance.getTotalSize()
      }
      const instance = new Virtualizer<HTMLElement, Element>({
        count: selectData.length,
        getScrollElement: () => contentRef.value ?? null,
        estimateSize: () => ESTIMATE_SIZE,
        scrollToFn: elementScroll,
        observeElementRect,
        observeElementOffset,
        onChange: sync,
      })
      virtualizer.value = noSerialize(instance)
      const unmount = instance._didMount()
      instance._willUpdate()
      sync(instance)
      cleanup(unmount)
    },
    { strategy: "document-ready" },
  )

  const collection = select.collection({
    items: selectData as Item[],
    itemToString: (item) => item.label,
    itemToValue: (item) => item.value,
  })

  const service = useMachine(
    select.machine as select.Machine<Item>,
    () =>
      ({
        id,
        collection,
        scrollToIndexFn(details: select.ScrollToIndexDetails) {
          virtualizer.value?.scrollToIndex(details.index, { align: "center", behavior: "auto" })
        },
      }) as select.Props<Item>,
  )

  const api = select.connect(service, normalizeProps)

  return (
    <main class="select">
      <div {...api.getRootProps()}>
        <div {...api.getControlProps()}>
          <label {...api.getLabelProps()}>Label</label>
          <button {...api.getTriggerProps()}>{api.valueAsString || "Select a country"}</button>
        </div>

        <div {...api.getPositionerProps()}>
          <div ref={contentRef} {...api.getContentProps()}>
            <div
              style={{
                height: `${totalSize.value}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualItems.value.map((virtualItem) => {
                const item = selectData[virtualItem.index]
                return (
                  <div
                    key={item.value}
                    {...mergeProps(api.getItemProps({ item }), {
                      style: {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    })}
                  >
                    <span>{item.label}</span>
                    <span {...api.getItemIndicatorProps({ item })}>✓</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
})

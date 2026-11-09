import { component$, noSerialize, useId, useSignal, useVisibleTask$, type NoSerialize } from "@qwik.dev/core"
import { elementScroll, observeElementOffset, observeElementRect, Virtualizer } from "@tanstack/virtual-core"
import * as combobox from "@zag-js/combobox"
import { createFilter } from "@zag-js/i18n-utils"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import { comboboxData } from "@zag-js/shared"

interface Item {
  code: string
  label: string
}

interface VirtualRow {
  index: number
  start: number
  size: number
}

const { contains } = createFilter({ sensitivity: "base" })

const ESTIMATE_SIZE = 32

export default component$(() => {
  const id = useId()
  const contentRef = useSignal<HTMLElement>()

  const options = useSignal<Item[]>(comboboxData)

  // @tanstack/virtual-core instance (client-only), rendering is driven by the
  // serializable signals below
  const virtualizer = useSignal<NoSerialize<Virtualizer<HTMLElement, Element>>>()
  const virtualItems = useSignal<VirtualRow[]>([])
  const totalSize = useSignal(comboboxData.length * ESTIMATE_SIZE)

  useVisibleTask$(
    ({ cleanup }) => {
      const sync = (instance: Virtualizer<HTMLElement, Element>) => {
        virtualItems.value = instance.getVirtualItems().map(({ index, start, size }) => ({ index, start, size }))
        totalSize.value = instance.getTotalSize()
      }
      const instance = new Virtualizer<HTMLElement, Element>({
        count: options.value.length,
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

  // keep the item count in sync with the filtered options
  useVisibleTask$(({ track }) => {
    const count = track(() => options.value.length)
    const instance = virtualizer.value
    if (!instance || instance.options.count === count) return
    instance.setOptions({ ...instance.options, count })
    instance._willUpdate()
    virtualItems.value = instance.getVirtualItems().map(({ index, start, size }) => ({ index, start, size }))
    totalSize.value = instance.getTotalSize()
  })

  const collection = combobox.collection({
    items: options.value,
    itemToValue: (item) => item.code,
    itemToString: (item) => item.label,
  })

  const service = useMachine(
    combobox.machine as combobox.Machine<Item>,
    () =>
      ({
        id,
        collection,
        scrollToIndexFn(details: combobox.ScrollToIndexDetails) {
          virtualizer.value?.scrollToIndex(details.index, { align: "center", behavior: "auto" })
        },
        onOpenChange() {
          options.value = comboboxData
        },
        onInputValueChange({ inputValue }: combobox.InputValueChangeDetails) {
          const filtered = comboboxData.filter((item) => contains(item.label, inputValue))
          options.value = filtered.length > 0 ? filtered : comboboxData
        },
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)

  return (
    <main class="combobox">
      <div {...api.getRootProps()}>
        <label {...api.getLabelProps()}>Select country</label>
        <div {...api.getControlProps()}>
          <input data-testid="input" {...api.getInputProps()} />
          <button data-testid="trigger" {...api.getTriggerProps()}>
            ▼
          </button>
          <button {...api.getClearTriggerProps()}>✕</button>
        </div>
      </div>

      <div {...api.getPositionerProps()}>
        <div data-testid="combobox-content" ref={contentRef} {...api.getContentProps()}>
          <div
            style={{
              height: `${totalSize.value}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.value.map((virtualItem) => {
              const item = options.value[virtualItem.index]
              if (!item) return null
              return (
                <div
                  data-testid={item.code}
                  key={item.code}
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
                  <span {...api.getItemIndicatorProps({ item })}>✅</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
})

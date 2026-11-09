import { component$, useId, useSignal, useTask$ } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { getCaretPosition, raf } from "@zag-js/dom-query"
import { createFilter } from "@zag-js/i18n-utils"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { comboboxData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { mergeQwikProps } from "~/lib/combobox-merge-props"

interface Item {
  code: string
  label: string
}

const { contains } = createFilter({ sensitivity: "base" })

// the React example's module-level `defaultTriggers` const is inlined into the
// default parameters: the Qwik optimizer copies these helper functions into
// the component's segment but misses identifiers used only in a default
// parameter (ReferenceError at runtime)

function getTriggerOffset(element: HTMLTextAreaElement | null, triggers = ["@", "#"]) {
  if (!element) return -1

  const { value, selectionStart } = element
  for (let i = selectionStart; i >= 0; i--) {
    const char = value[i]
    if (char && triggers.includes(char)) {
      return i
    }
  }

  return -1
}

function getTrigger(element: HTMLTextAreaElement, triggers = ["@", "#"]) {
  const { value, selectionStart } = element
  const previousChar = value[selectionStart - 1]
  if (!previousChar) return null
  const secondPreviousChar = value[selectionStart - 2]
  const isIsolated = !secondPreviousChar || /\s/.test(secondPreviousChar)
  if (!isIsolated) return null
  if (triggers.includes(previousChar)) return previousChar
  return null
}

function getSearchValue(element: HTMLTextAreaElement, triggers = ["@", "#"]) {
  const offset = getTriggerOffset(element, triggers)
  if (offset === -1) return ""
  return element.value.slice(offset + 1, element.selectionStart)
}

function getAnchorRect(element: HTMLTextAreaElement | null, triggers = ["@", "#"]) {
  if (!element) return null
  const offset = getTriggerOffset(element, triggers)
  const { left, top, height } = getCaretPosition(element, { position: offset + 1 })
  const { x, y } = element.getBoundingClientRect()
  return { x: x + left, y: y + top, height }
}

function replaceValue(offset: number, searchValue: string, displayValue: string) {
  return (inputValue: string) => {
    return `${inputValue.slice(0, offset) + displayValue} ${inputValue.slice(offset + searchValue.length + 1)}`
  }
}

export default component$(() => {
  const id = useId()
  const options = useSignal<Item[]>(comboboxData)
  const searchValue = useSignal("")

  const collection = combobox.collection({
    items: options.value,
    itemToValue: (item) => item.code,
    itemToString: (item) => item.label,
  })

  const ref = useSignal<HTMLTextAreaElement>()

  useTask$(({ track }) => {
    const value = track(() => searchValue.value)
    options.value = comboboxData.filter((item) => contains(item.label, value))
  })

  // the machine callbacks below run after this render, when `api` is assigned
  const apiRef: { current?: combobox.Api } = {}

  const service = useMachine(
    combobox.machine as combobox.Machine<Item>,
    () =>
      ({
        id,
        collection,
        onOpenChange() {
          options.value = comboboxData
        },
        inputBehavior: "autohighlight",
        selectionBehavior: "preserve",
        openOnKeyPress: false,
        openOnChange: false,
        allowCustomValue: true,
        positioning: {
          sameWidth: false,
          placement: "bottom-start",
          gutter: 16,
          getAnchorRect() {
            return getAnchorRect(ref.value ?? null)
          },
        },
        onValueChange({ value }: combobox.ValueChangeDetails) {
          const textarea = ref.value
          if (!textarea) return
          const valueAsString = collection.stringifyMany(value)
          const offset = getTriggerOffset(textarea)
          const inputValue = replaceValue(offset, searchValue.value, valueAsString)(textarea.value)
          raf(() => {
            apiRef.current?.setInputValue(inputValue)
          })
        },
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="combobox">
        <div {...api.getRootProps()}>
          <span>Search value: {searchValue.value || "-"}</span>
          <label {...api.getLabelProps()}>Select country</label>
          <textarea
            ref={ref}
            {...mergeQwikProps(api.getInputProps(), {
              rows: 5,
              placeholder: "Type @ to see completion",
              style: { width: "400px", padding: "4px" },
              onScroll$() {
                api.reposition()
              },
              onPointerDown$() {
                api.setOpen(false)
              },
              onKeyDown$(event: KeyboardEvent) {
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                  api.setOpen(false)
                }
              },
              // `onChange` in the React example (React's change == native input)
              onInput$(_event: Event, element: HTMLTextAreaElement) {
                const trigger = getTrigger(element)
                const nextSearchValue = getSearchValue(element)

                if (trigger) {
                  api.setOpen(true)
                } else if (!nextSearchValue) {
                  api.setOpen(false)
                }

                searchValue.value = nextSearchValue
              },
            })}
          />
        </div>

        <div {...api.getPositionerProps()}>
          <ul {...api.getContentProps()}>
            {options.value.map((item) => (
              <li key={item.code} {...api.getItemProps({ item })}>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Toolbar viz>
        <StateVisualizer state={service} omit={["collection", "nextEvents"]} />
      </Toolbar>
    </>
  )
})

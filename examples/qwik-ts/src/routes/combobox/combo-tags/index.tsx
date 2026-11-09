import { component$, useId, useSignal } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { contains } from "@zag-js/dom-query"
import { createFilter } from "@zag-js/i18n-utils"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { comboboxData } from "@zag-js/shared"
import * as tagsInput from "@zag-js/tags-input"
import { mergeQwikProps } from "~/lib/combobox-merge-props"

interface Item {
  code: string
  label: string
}

const { contains: matchContains } = createFilter({ sensitivity: "base" })

export default component$(() => {
  // id composition for tags input and combobox
  const ids = {
    root: useId(),
    input: useId(),
    control: useId(),
  }
  const comboboxId = useId()
  const tagsId = useId()

  const contentRef = useSignal<HTMLElement>()

  /* -----------------------------------------------------------------------------
   * Combobox
   * -----------------------------------------------------------------------------*/

  const options = useSignal<Item[]>(comboboxData)
  const value = useSignal<string[]>([])

  const collection = combobox.collection({
    items: options.value,
    itemToValue: (item) => item.code,
    itemToString: (item) => item.label,
  })

  const service = useMachine(
    combobox.machine as combobox.Machine<Item>,
    () =>
      ({
        id: comboboxId,
        collection,
        ids,
        allowCustomValue: true,
        multiple: true,
        selectionBehavior: "clear",
        value: value.value,
        onOpenChange() {
          options.value = comboboxData.filter((item) => !value.value.includes(item.code))
        },
        onInputValueChange({ inputValue }: combobox.InputValueChangeDetails) {
          options.value = comboboxData.filter((item) => matchContains(item.label, inputValue))
        },
        onValueChange(details: combobox.ValueChangeDetails) {
          // sync tags input value and options
          queueMicrotask(() => {
            value.value = details.value
            options.value = options.value.filter((item) => !details.value.includes(item.code))
            contentRef.value?.scrollTo(0, 0)
          })
        },
      }) as combobox.Props<Item>,
  )

  const comboboxApi = combobox.connect(service, normalizeProps)

  /* -----------------------------------------------------------------------------
   * Tags Input
   * -----------------------------------------------------------------------------*/

  const tagService = useMachine(
    tagsInput.machine,
    () =>
      ({
        id: tagsId,
        ids,
        editable: false,
        addOnPaste: false,
        onInteractOutside(event: tagsInput.InteractOutsideEvent) {
          const { target } = event.detail.originalEvent
          if (contains(contentRef.value, target)) {
            event.preventDefault()
          }
        },
        inputValue: comboboxApi.inputValue,
        value: value.value,
        onValueChange(details: tagsInput.ValueChangeDetails) {
          value.value = details.value
        },
        onInputValueChange({ inputValue }: tagsInput.InputValueChangeDetails) {
          comboboxApi.setInputValue(inputValue)
        },
      }) as tagsInput.Props,
  )

  const tagApi = tagsInput.connect(tagService, normalizeProps)

  /* -----------------------------------------------------------------------------
   * Render
   * -----------------------------------------------------------------------------*/

  return (
    <main class="combobox">
      <div {...mergeQwikProps(comboboxApi.getRootProps(), tagApi.getRootProps())}>
        <label {...comboboxApi.getLabelProps()}>Select country</label>

        <div {...mergeQwikProps(comboboxApi.getControlProps(), tagApi.getControlProps())}>
          {/* `null` rather than an empty mapped array: see tags-input/basic */}
          {tagApi.value.length === 0
            ? null
            : tagApi.value.map((value, index) => (
                <span key={value} {...tagApi.getItemProps({ index, value })}>
                  <div {...tagApi.getItemPreviewProps({ index, value })}>
                    <span {...tagApi.getItemTextProps({ index, value })}>{value} </span>
                    <button {...tagApi.getItemDeleteTriggerProps({ index, value })}>&#x2715;</button>
                  </div>
                  <input {...tagApi.getItemInputProps({ index, value })} />
                </span>
              ))}

          <input
            key="new-tag-input"
            data-testid="input"
            placeholder="add tag"
            {...mergeQwikProps(comboboxApi.getInputProps(), tagApi.getInputProps(), {
              onKeyDown$(event: KeyboardEvent) {
                // extra logic to add tag on Enter key
                if (event.key === "Enter" && options.value.length === 0) {
                  tagApi.addValue(comboboxApi.inputValue)
                }
              },
            })}
          />
        </div>
      </div>

      <div {...comboboxApi.getPositionerProps()}>
        {options.value.length > 0 && (
          <div data-testid="combobox-content" {...comboboxApi.getContentProps()} ref={contentRef}>
            {options.value.map((item) => (
              <div data-testid={item.code} key={item.code} {...comboboxApi.getItemProps({ item })}>
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
})

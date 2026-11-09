import { component$, useId, useSignal, type Signal } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { createFilter } from "@zag-js/i18n-utils"
import * as menu from "@zag-js/menu"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import { comboboxData } from "@zag-js/shared"

interface ComboboxProps {
  /**
   * The menu's open state. The React page closes the menu from the combobox's
   * `onValueChange` callback; a callback cannot cross a `component$` boundary,
   * so the menu is controlled and the combobox writes this signal instead.
   */
  menuOpen: Signal<boolean>
}

// its own component$ so that, like the React page, it mounts (fresh input) with the menu
const Combobox = component$<ComboboxProps>((props) => {
  const { contains } = createFilter({ sensitivity: "base" })
  const inputValue = useSignal("")

  const items = comboboxData.filter(
    (item) => contains(item.label, inputValue.value) || contains(item.code, inputValue.value),
  )

  const collection = combobox.collection({
    items,
    itemToValue: (item) => item.code,
    itemToString: (item) => item.label,
  })

  const id = useId()

  const comboService = useMachine(combobox.machine, () => ({
    id,
    disableLayer: true,
    open: true,
    placeholder: "Search items...",
    inputBehavior: "autohighlight" as const,
    selectionBehavior: "clear" as const,
    onInputValueChange(details: combobox.InputValueChangeDetails) {
      inputValue.value = details.inputValue
    },
    collection,
    onValueChange({ items }: combobox.ValueChangeDetails) {
      console.log(JSON.stringify(items[0].label))
      props.menuOpen.value = false
    },
  }))

  const comboApi = combobox.connect(comboService, normalizeProps)

  return (
    <div {...mergeProps(comboApi.getRootProps(), { style: { width: "100%" } })}>
      <input {...mergeProps(comboApi.getInputProps(), { style: { marginBottom: "12px" } })} />
      <div {...mergeProps(comboApi.getContentProps(), { style: { minHeight: "120px" } })}>
        {items.length === 0 && <div>No results found</div>}
        {items.map((item) => (
          <div key={item.label} {...comboApi.getItemProps({ item, persistFocus: true })}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
})

export default component$(() => {
  const id = useId()
  const open = useSignal(false)

  const menuService = useMachine(menu.machine, () => ({
    id,
    composite: false,
    open: open.value,
    onOpenChange(details: menu.OpenChangeDetails) {
      open.value = details.open
    },
  }))

  const menuApi = menu.connect(menuService, normalizeProps)

  return (
    <main>
      <div>
        <button {...menuApi.getTriggerProps()}>Actions ▾</button>
        {/* rendered inline: Qwik has no portal */}
        {menuApi.open && (
          <div {...menuApi.getPositionerProps()}>
            <ul {...menuApi.getContentProps()}>
              <Combobox menuOpen={open} />
            </ul>
          </div>
        )}
      </div>
    </main>
  )
})

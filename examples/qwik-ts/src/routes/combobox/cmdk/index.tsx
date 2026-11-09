import { component$, useComputed$, useId, useSignal, useVisibleTask$, type Signal } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import * as dialog from "@zag-js/dialog"
import { createFilter } from "@zag-js/i18n-utils"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import { commandData } from "@zag-js/shared"

type Command = commandData.Command

const { contains } = createFilter({ sensitivity: "base" })

function filter(value: string): Record<string, Command[]> {
  const { allItems, commands, applications, suggestions } = commandData

  if (!value) {
    return {
      Suggestions: suggestions,
      Commands: commands.filter((item) => !suggestions.includes(item)),
      Apps: applications.filter((item) => !suggestions.includes(item)),
    }
  }

  const results = allItems.filter((item) => contains(item.name, value) || contains(item.title, value))

  if (!results.length) return {}

  return { Results: results }
}

interface ComboboxProps {
  inputValue: Signal<string>
  selectedAction: Signal<string | null>
  dialogOpen: Signal<boolean>
}

// mounted with the dialog content, like the React example's `Combobox`; the
// page state it reads/writes comes in as (serializable) signals
const Combobox = component$<ComboboxProps>((props) => {
  const { inputValue, selectedAction, dialogOpen } = props
  const id = useId()

  const matches = useComputed$(() => filter(inputValue.value))
  const matchEntries = Object.entries(matches.value)

  const collection = combobox.collection({
    items: Object.values(matches.value).flat(),
    itemToValue: (item) => item.name,
    itemToString: (item) => item.title,
  })

  const service = useMachine(
    combobox.machine as combobox.Machine<Command>,
    () =>
      ({
        open: true,
        disableLayer: true,
        placeholder: "Type a command or search term...",
        loopFocus: false,
        collection,
        onValueChange({ items }: combobox.ValueChangeDetails<Command>) {
          selectedAction.value = JSON.stringify(items[0].title)
          dialogOpen.value = false
        },
        onInputValueChange(details: combobox.InputValueChangeDetails) {
          inputValue.value = details.inputValue
        },
        id,
        inputBehavior: "autohighlight",
        selectionBehavior: "clear",
      }) as combobox.Props<Command>,
  )

  const comboApi = combobox.connect(service, normalizeProps)

  return (
    <div {...mergeProps(comboApi.getRootProps(), { style: { width: "100%" } })}>
      <input {...mergeProps(comboApi.getInputProps(), { style: { marginBottom: "12px" } })} />
      <div {...mergeProps(comboApi.getContentProps(), { style: { minHeight: "120px" } })}>
        <div {...comboApi.getListProps()}>
          {matchEntries.length === 0 && <div>No results found</div>}
          {matchEntries.map(([group, items]) => (
            <div key={group} {...comboApi.getItemGroupProps({ id: group })}>
              <div {...comboApi.getItemGroupLabelProps({ htmlFor: group })}>{group}</div>
              {items.map((item) => (
                <div key={item.name} {...comboApi.getItemProps({ item, persistFocus: true })}>
                  {item.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default component$(() => {
  const dialogId = useId()
  const inputValue = useSignal("")
  const selectedAction = useSignal<string | null>(null)
  const dialogOpen = useSignal(false)

  /* -----------------------------------------------------------------------------
   * Dialog machine
   * -----------------------------------------------------------------------------*/

  const service = useMachine(dialog.machine, () => ({
    id: dialogId,
    open: dialogOpen.value,
    onOpenChange(details: dialog.OpenChangeDetails) {
      dialogOpen.value = details.open
    },
  }))

  const dialogApi = dialog.connect(service, normalizeProps)

  useVisibleTask$(
    ({ cleanup }) => {
      const fn = (event: KeyboardEvent) => {
        if (dialogOpen.value) return

        const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator?.platform)
        const hotkey = isMac ? "metaKey" : "ctrlKey"

        if (event.key?.toLowerCase() === "k" && event[hotkey]) {
          event.preventDefault()
          dialogOpen.value = true
        }
      }
      document.addEventListener("keydown", fn, true)
      cleanup(() => document.removeEventListener("keydown", fn, true))
    },
    { strategy: "document-ready" },
  )

  /* -----------------------------------------------------------------------------
   * Render
   * -----------------------------------------------------------------------------*/

  return (
    <main>
      <button {...dialogApi.getTriggerProps()}>Open Command Menu</button>
      <div style={{ background: "lightgray", padding: "12px" }}>
        or press <kbd> Cmd+K</kbd>
      </div>

      {selectedAction.value && (
        <div>
          <b>Selected Action:</b> {selectedAction.value}
        </div>
      )}

      {dialogApi.open && (
        <>
          <div {...dialogApi.getBackdropProps()} />
          <div {...dialogApi.getPositionerProps()}>
            <div {...dialogApi.getContentProps()}>
              <Combobox inputValue={inputValue} selectedAction={selectedAction} dialogOpen={dialogOpen} />
            </div>
          </div>
        </>
      )}
    </main>
  )
})

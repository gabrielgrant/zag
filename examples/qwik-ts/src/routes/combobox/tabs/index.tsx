import { component$, useComputed$, useId, useSignal } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { createFilter } from "@zag-js/i18n-utils"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import * as tabs from "@zag-js/tabs"
import { mergeQwikProps } from "~/lib/combobox-merge-props"

interface PageItem {
  value: string
  label: string
  category: string
}

const pages = {
  Page: [
    { value: "docs", label: "Docs" },
    { value: "examples", label: "Examples" },
    { value: "blog", label: "Blog" },
    { value: "community", label: "Community" },
    { value: "support", label: "Support" },
    { value: "contact", label: "Contact" },
    { value: "about", label: "About" },
    { value: "pricing", label: "Pricing" },
    { value: "login", label: "Login" },
    { value: "signup", label: "Signup" },
  ],
  Component: [
    { value: "select-tabs", label: "Select Tabs" },
    { value: "select-combobox", label: "Select Combobox" },
    { value: "combobox-tabs", label: "Combobox Tabs" },
    { value: "menu-button", label: "Menu Button" },
    { value: "menu-tabs", label: "Menu Tabs" },
    { value: "menu-combobox", label: "Menu Combobox" },
  ],
}

const flatPages: PageItem[] = Object.entries(pages).flatMap(([category, pages]) =>
  pages.map((page) => ({ ...page, category })),
)

function groupBy<T>(items: T[], key: keyof T): any {
  return items.reduce((acc: any, item) => {
    const value = item[key]
    if (!acc[value]) acc[value] = []
    acc[value].push(item)
    return acc
  }, {})
}

type SelectedTab = "Page" | "Component" | "All"
const categories: SelectedTab[] = ["All", "Page", "Component"]
const { contains } = createFilter({ sensitivity: "base" })

export default component$(() => {
  const comboboxId = useId()
  const tabsId = useId()
  const selectedTab = useSignal<SelectedTab>("All")
  const inputValue = useSignal("")
  // `useRef` in the React example: a plain (non-reactive) holder inside the signal value
  const selectedValueTab = useSignal<{ current: SelectedTab }>({ current: "Component" })

  const matches = useComputed$(() => {
    const allMatches = flatPages.filter((item) => contains(item.label, inputValue.value))
    const groups = groupBy(allMatches, "category")
    groups.All = allMatches
    return groups as Record<SelectedTab, PageItem[]>
  })

  const items = matches.value[selectedTab.value] || []
  const collection = combobox.collection({ items })

  const service = useMachine(
    combobox.machine as combobox.Machine<PageItem>,
    () =>
      ({
        collection,
        id: comboboxId,
        composite: false,
        openOnClick: true,
        inputBehavior: "autohighlight",
        positioning: {
          sameWidth: false,
        },
        onValueChange() {
          selectedValueTab.value.current = selectedTab.value
        },
        onInputValueChange(details: combobox.InputValueChangeDetails) {
          inputValue.value = details.inputValue
        },
        onOpenChange(details: combobox.OpenChangeDetails) {
          if (details.open) return
          inputValue.value = ""
          if (selectedValueTab.value.current === selectedTab.value) return
          selectedTab.value = selectedValueTab.value.current
        },
      }) as combobox.Props<PageItem>,
  )

  const comboboxApi = combobox.connect(service, normalizeProps)

  const tabService = useMachine(tabs.machine, () => ({
    id: tabsId,
    composite: false,
    value: selectedTab.value,
    onValueChange(details: tabs.ValueChangeDetails) {
      selectedTab.value = details.value as SelectedTab
    },
  }))

  const tabApi = tabs.connect(tabService, normalizeProps)

  return (
    <main>
      <div {...comboboxApi.getRootProps()}>
        <pre>{comboboxApi.value}</pre>
        <label {...comboboxApi.getLabelProps()}>Select country </label>
        <div {...comboboxApi.getControlProps()}>
          <input
            {...mergeQwikProps(comboboxApi.getInputProps(), {
              onKeyDown$(event: KeyboardEvent) {
                if (!comboboxApi.open) return

                if (event.key === "ArrowRight") {
                  tabApi.selectNext()
                  event.preventDefault()
                }

                if (event.key === "ArrowLeft") {
                  tabApi.selectPrev()
                  event.preventDefault()
                }
              },
            })}
          />
          <button {...comboboxApi.getTriggerProps()}>▼</button>
        </div>
      </div>
      <div {...comboboxApi.getPositionerProps()}>
        <ul {...comboboxApi.getContentProps()}>
          <div {...mergeProps(tabApi.getRootProps(), { style: { position: "relative" } })}>
            <div {...mergeProps(tabApi.getListProps(), { style: { position: "sticky", top: "0", insetInline: "0" } })}>
              {categories.map((category) => {
                const currentItems = matches.value[category]
                return (
                  <button
                    key={category}
                    {...tabApi.getTriggerProps({ value: category, disabled: !currentItems?.length })}
                  >
                    {category} ({currentItems?.length || 0})
                  </button>
                )
              })}
            </div>

            {!items.length && (
              <div class="no-results">
                No item found for &quot;<strong>{inputValue.value}</strong>
                &quot;
              </div>
            )}

            {categories.map((category) => (
              <div key={category} {...tabApi.getContentProps({ value: category })}>
                {selectedTab.value === category && (
                  <div {...comboboxApi.getListProps()}>
                    {items.map((item) => (
                      <li key={item.value} {...comboboxApi.getItemProps({ item, persistFocus: true })}>
                        {item.label}
                      </li>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ul>
      </div>
    </main>
  )
})

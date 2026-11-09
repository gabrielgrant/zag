import { component$, useId, useSignal } from "@qwik.dev/core"
import { raf } from "@zag-js/dom-query"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as select from "@zag-js/select"
import * as tabs from "@zag-js/tabs"
import { mergeQwikProps } from "~/lib/combobox-merge-props"

interface Item {
  value: string
  label: string
}

const branchData: Item[] = [
  { value: "master", label: "master" },
  { value: "feature", label: "feature" },
  { value: "bugfix", label: "bugfix" },
  { value: "hotfix", label: "hotfix" },
  { value: "release", label: "release" },
  { value: "rsc", label: "rsc" },
]

const tagData: Item[] = [
  { value: "v1.0.0", label: "v1.0.0" },
  { value: "v1.0.1", label: "v1.0.1" },
  { value: "v1.0.2", label: "v1.0.2" },
  { value: "v1.0.3", label: "v1.0.3" },
  { value: "v1.0.4", label: "v1.0.4" },
  { value: "v1.0.5", label: "v1.0.5" },
]

type SelectedTab = "branch" | "tag"

const getItems = (tab: SelectedTab) => (tab === "branch" ? branchData : tagData)

// lucide's GitBranchIcon / TagIcon in the React example
const GitBranchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="6" x2="6" y1="3" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
)

const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
    <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
  </svg>
)

export default component$(() => {
  const selectId = useId()
  const tabsId = useId()

  const selectedTab = useSignal<SelectedTab>("branch")
  const highlighted = useSignal<string | null>(null)

  const collection = select.collection({ items: getItems(selectedTab.value) })

  // the React example syncs these from `useEffect`s; here the machine callbacks
  // schedule them after the next commit (zag's `raf` waits for Qwik's render)
  const apis: { select?: select.Api; tabs?: tabs.Api } = {}

  const selectService = useMachine(
    select.machine as select.Machine<Item>,
    () =>
      ({
        collection,
        id: selectId,
        composite: false,
        highlightedValue: highlighted.value,
        onHighlightChange({ highlightedValue }: select.HighlightChangeDetails) {
          highlighted.value = highlightedValue
        },
        // (the React example also re-sets `selectedTab` to itself on value
        // change and close, which is a no-op)
        onOpenChange(details: select.OpenChangeDetails) {
          if (!details.open) return
          raf(() => apis.tabs?.syncTabIndex())
        },
      }) as select.Props<Item>,
  )

  const selectApi = select.connect(selectService, normalizeProps)
  apis.select = selectApi

  const tabService = useMachine(tabs.machine, () => ({
    id: tabsId,
    value: selectedTab.value,
    onValueChange(details: tabs.ValueChangeDetails) {
      const tab = details.value as SelectedTab
      selectedTab.value = tab
      if (!apis.select?.open) return
      // highlight the first item of the new collection once it's rendered
      // (`highlightValue` in the React example, which the select api doesn't have)
      raf(() => apis.select?.setHighlightValue(getItems(tab)[0].value))
    },
  }))

  const tabApi = tabs.connect(tabService, normalizeProps)
  apis.tabs = tabApi

  return (
    <main class="select">
      <div {...selectApi.getRootProps()}>
        <div {...selectApi.getControlProps()}>
          <button {...selectApi.getTriggerProps()}>
            {selectedTab.value === "branch" ? <GitBranchIcon /> : <TagIcon />}
            <span>{selectApi.valueAsString || "Select option"}</span>
            <span {...selectApi.getIndicatorProps()}>▼</span>
          </button>
        </div>

        <div {...selectApi.getPositionerProps()}>
          <ul {...selectApi.getContentProps()}>
            <div {...tabApi.getRootProps()}>
              <div
                {...mergeQwikProps(tabApi.getListProps(), {
                  onKeyDown$(event: KeyboardEvent) {
                    if (event.key === "Home" || event.key === "End") {
                      event.preventDefault()
                    }
                  },
                })}
              >
                <button {...tabApi.getTriggerProps({ value: "branch" })}>Branch</button>
                <button {...tabApi.getTriggerProps({ value: "tag" })}>Tags</button>
              </div>

              <div {...tabApi.getContentProps({ value: "branch" })}>
                {selectedTab.value === "branch" && (
                  <div {...selectApi.getListProps()}>
                    {branchData.map((item) => (
                      <li key={item.value} {...selectApi.getItemProps({ item, persistFocus: true })}>
                        {item.label}
                      </li>
                    ))}
                  </div>
                )}
              </div>

              <div {...tabApi.getContentProps({ value: "tag" })}>
                {selectedTab.value === "tag" && (
                  <div {...selectApi.getListProps()}>
                    {tagData.map((item) => (
                      <li key={item.value} {...selectApi.getItemProps({ item, persistFocus: true })}>
                        {item.label}
                      </li>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ul>
        </div>
      </div>
    </main>
  )
})

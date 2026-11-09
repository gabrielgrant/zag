import { component$, useId, useSignal } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import * as tree from "@zag-js/tree-view"

interface Node {
  id: string
  name: string
  children?: Node[]
}

const rootNode: Node = {
  id: "ROOT",
  name: "",
  children: [
    {
      id: "furniture",
      name: "Furniture",
      children: [
        { id: "furniture/tables-chairs", name: "tables & chairs" },
        { id: "furniture/sofas", name: "sofas" },
        { id: "furniture/occasional", name: "occasional furniture" },
        { id: "furniture/childrens", name: "childrens furniture" },
        { id: "furniture/beds", name: "beds" },
      ],
    },
    {
      id: "decor",
      name: "Decor",
      children: [
        { id: "decor/bed-linen", name: "bed linen" },
        { id: "decor/throws", name: "throws" },
        { id: "decor/curtains-blinds", name: "curtains & blinds" },
        { id: "decor/rugs", name: "rugs" },
        { id: "decor/cushions", name: "cushions" },
      ],
    },
    {
      id: "lighting",
      name: "Lighting",
      children: [
        { id: "lighting/ceiling", name: "ceiling lights" },
        { id: "lighting/lamps", name: "lamps" },
        { id: "lighting/outdoor", name: "outdoor lighting" },
      ],
    },
    {
      id: "storage",
      name: "Storage",
      children: [
        { id: "storage/shelving", name: "shelving" },
        { id: "storage/wardrobes", name: "wardrobes" },
        { id: "storage/boxes", name: "boxes & baskets" },
      ],
    },
  ],
}

type Collection = ReturnType<typeof tree.collection<Node>>

// Created on first use rather than at module load (see tree-view/basic).
let initialCollection: Collection | undefined
const getInitialCollection = () =>
  (initialCollection ??= tree.collection<Node>({
    nodeToValue: (node) => node.id,
    nodeToString: (node) => node.name,
    rootNode,
  }))

// the (serializable) search text is the state; the filtered collection is
// derived from it, memoized so every read in a render sees the same instance
let filtered: { query: string; collection: Collection } | undefined
const getCollection = (query: string): Collection => {
  if (query.length === 0) return getInitialCollection()
  if (filtered?.query !== query) {
    filtered = {
      query,
      collection: getInitialCollection().filter((node) => node.name.toLowerCase().includes(query.toLowerCase())),
    }
  }
  return filtered.collection
}

// Collect every leaf value once. `checkedValue` only ever contains leaf
// values (branch checked-state is derived), so this drives "select all".
const collectLeafValues = (node: Node): string[] => {
  if (!node.children) return [node.id]
  return node.children.flatMap(collectLeafValues)
}
const allLeafValues = (rootNode.children ?? []).flatMap(collectLeafValues)

// text glyphs stand in for the React page's lucide icons
const iconMap = {
  true: "☑",
  false: "☐",
  indeterminate: "⊟",
}

/** see pin-input example: live api handle for custom (non-zag) handlers */
const treeApiRef: { current?: tree.Api } = {}

interface TreeNodeProps {
  node: Node
  indexPath: number[]
  api: tree.Api
}

const TreeNodeCheckbox = (props: TreeNodeProps) => {
  const { api, ...nodeProps } = props
  const nodeState = api.getNodeState(nodeProps)
  const checkboxProps = api.getNodeCheckboxProps(nodeProps)
  const icon = iconMap[nodeState.checked.toString() as keyof typeof iconMap]
  return <span {...checkboxProps}>{icon}</span>
}

const TreeNode = (props: TreeNodeProps) => {
  const { node, indexPath, api } = props
  const nodeProps = { indexPath, node }
  const nodeState = api.getNodeState(nodeProps)

  if (nodeState.isBranch) {
    return (
      <div {...api.getBranchProps(nodeProps)}>
        <div {...api.getBranchControlProps(nodeProps)}>
          <TreeNodeCheckbox {...props} />
          <span {...api.getBranchTextProps(nodeProps)}>{node.name}</span>
          <span {...api.getBranchIndicatorProps(nodeProps)}>{"›"}</span>
        </div>
        <div {...api.getBranchContentProps(nodeProps)}>
          <div {...api.getBranchIndentGuideProps(nodeProps)} />
          {node.children?.map((childNode, index) => (
            <TreeNode key={childNode.id} node={childNode} indexPath={[...indexPath, index]} api={api} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div {...api.getItemProps(nodeProps)}>
      <TreeNodeCheckbox {...props} /> {node.name}
    </div>
  )
}

export default component$(() => {
  const dialogId = useId()
  const treeId = useId()

  // `committed` is the applied selection; `draft` is the in-dialog working
  // selection. They only sync on OK (commit) or on open/cancel/dismiss (revert).
  const committed = useSignal<string[]>([])
  const draft = useSignal<string[]>([])

  const open = useSignal(false)
  const query = useSignal("")
  const searchRef = useSignal<HTMLInputElement>()

  const dialogService = useMachine(dialog.machine, () => ({
    id: dialogId,
    open: open.value,
    // Focus-trap would otherwise grab the first tabbable node (which, with the
    // tree's roving tabindex, can be unpredictable). Point initial focus at the
    // search input instead.
    initialFocusEl: () => searchRef.value ?? null,
    onOpenChange(details: dialog.OpenChangeDetails) {
      open.value = details.open
      // Fires only for user-driven open (trigger) and dismiss (Esc/backdrop/X).
      // Both start the working state fresh from the committed selection; a
      // dismiss therefore discards uncommitted edits.
      draft.value = committed.value
      query.value = ""
    },
  }))
  const dialogApi = dialog.connect(dialogService, normalizeProps)

  const collection = getCollection(query.value)

  const treeService = useMachine(
    tree.machine as tree.Machine<Node>,
    () =>
      ({
        id: treeId,
        collection: getCollection(query.value),
        checkedValue: draft.value,
        onCheckedChange(details) {
          draft.value = details.checkedValue
        },
      }) as tree.Props<Node>,
  )
  const treeApi = tree.connect(treeService, normalizeProps)
  treeApiRef.current = treeApi

  const selectedCount = draft.value.length
  const allSelected = selectedCount === allLeafValues.length && selectedCount > 0
  const someSelected = selectedCount > 0
  const selectAllIcon = iconMap[allSelected ? "true" : someSelected ? "indeterminate" : "false"]

  return (
    <main>
      <button {...dialogApi.getTriggerProps()}>Select categories</button>
      <p>Applied: {committed.value.length > 0 ? committed.value.join(", ") : "none"}</p>

      {dialogApi.open && (
        <>
          <div {...dialogApi.getBackdropProps()} />
          <div {...dialogApi.getPositionerProps()}>
            <div
              {...mergeProps(dialogApi.getContentProps(), {
                style: { display: "flex", flexDirection: "column", gap: "16px", maxHeight: "80vh", padding: "20px" },
              })}
            >
              <header
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <h2 {...mergeProps(dialogApi.getTitleProps(), { style: { margin: 0 } })}>Categories</h2>
                <button {...dialogApi.getCloseTriggerProps()} aria-label="Close">
                  ✕
                </button>
              </header>

              <input
                ref={searchRef}
                type="text"
                placeholder="Search categories"
                onInput$={(_, el) => {
                  query.value = el.value
                  if (el.value.length > 0) {
                    treeApiRef.current?.setExpandedValue(getCollection(el.value).getBranchValues())
                  }
                }}
                style={{ padding: "8px 12px" }}
              />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button
                  type="button"
                  onClick$={() => {
                    const all = draft.value.length === allLeafValues.length && draft.value.length > 0
                    draft.value = all ? [] : allLeafValues
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <span>{selectAllIcon}</span> Select All
                </button>
                <span style={{ color: "#64748b" }}>{selectedCount} categories selected</span>
              </div>

              <div
                class="tree-view"
                style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px" }}
              >
                <div {...mergeProps(treeApi.getTreeProps(), { style: { width: "100%", marginTop: 0 } })}>
                  {collection.rootNode.children?.map((node, index) => (
                    <TreeNode key={node.id} node={node} indexPath={[index]} api={treeApi} />
                  ))}
                </div>
              </div>

              <footer
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <button
                  type="button"
                  onClick$={() => {
                    draft.value = committed.value
                    query.value = ""
                    open.value = false
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick$={() => {
                    committed.value = draft.value
                    open.value = false
                  }}
                >
                  Ok
                </button>
              </footer>
            </div>
          </div>
        </>
      )}
    </main>
  )
})

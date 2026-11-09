import { component$, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as tree from "@zag-js/tree-view"

interface Node {
  id: string
  name: string
  children?: Node[]
}

type Collection = ReturnType<typeof tree.collection<Node>>

// Created on first use rather than at module load (see tree-view/basic).
let initialCollection: Collection | undefined
const getInitialCollection = () =>
  (initialCollection ??= tree.collection<Node>({
    nodeToValue: (node) => node.id,
    nodeToString: (node) => node.name,
    rootNode: {
      id: "ROOT",
      name: "",
      children: [
        {
          id: "node_modules",
          name: "node_modules",
          children: [
            { id: "node_modules/zag-js", name: "zag-js" },
            { id: "node_modules/pandacss", name: "panda" },
            {
              id: "node_modules/@types",
              name: "@types",
              children: [
                { id: "node_modules/@types/react", name: "react" },
                { id: "node_modules/@types/react-dom", name: "react-dom" },
              ],
            },
          ],
        },
        {
          id: "src",
          name: "src",
          children: [
            { id: "src/app.tsx", name: "app.tsx" },
            { id: "src/index.ts", name: "index.ts" },
          ],
        },
        { id: "panda.config", name: "panda.config.ts" },
        { id: "package.json", name: "package.json" },
        { id: "renovate.json", name: "renovate.json" },
        { id: "readme.md", name: "README.md" },
      ],
    },
  }))

// the (serializable) filter text is the state; the filtered collection is
// derived from it, memoized so every read in a render sees the same instance
let filtered: { query: string; collection: Collection } | undefined
const getCollection = (query: string): Collection => {
  if (query.length === 0) return getInitialCollection()
  if (filtered?.query !== query) {
    filtered = { query, collection: getInitialCollection().filter((node) => node.name.includes(query)) }
  }
  return filtered.collection
}

/** see pin-input example: live api handle for custom (non-zag) buttons */
const apiRef: { current?: tree.Api } = {}

interface TreeNodeProps {
  node: Node
  indexPath: number[]
  api: tree.Api
}

const TreeNode = (props: TreeNodeProps) => {
  const { node, indexPath, api } = props

  const nodeProps = { indexPath, node }
  const nodeState = api.getNodeState(nodeProps)

  if (nodeState.isBranch) {
    return (
      <div {...api.getBranchProps(nodeProps)}>
        <div {...api.getBranchControlProps(nodeProps)}>
          <span>📁</span>
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
      <span>📄</span> {node.name}
    </div>
  )
}

export default component$(() => {
  const id = useId()
  const query = useSignal("")

  const service = useMachine(
    tree.machine as tree.Machine<Node>,
    () =>
      ({
        id,
        collection: getCollection(query.value),
      }) as tree.Props<Node>,
  )

  const api = tree.connect(service, normalizeProps)
  apiRef.current = api

  const collection = getCollection(query.value)

  return (
    <main class="tree-view">
      <div {...api.getRootProps()}>
        <input
          type="text"
          onInput$={(_, el) => {
            query.value = el.value
            if (el.value.length > 0) {
              apiRef.current?.setExpandedValue(getCollection(el.value).getBranchValues())
            }
          }}
        />
        <h3 {...api.getLabelProps()}>My Documents</h3>
        <div {...api.getTreeProps()}>
          {collection.rootNode.children?.map((node, index) => (
            <TreeNode key={node.id} node={node} indexPath={[index]} api={api} />
          ))}
        </div>
      </div>
    </main>
  )
})

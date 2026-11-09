import { component$, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as tree from "@zag-js/tree-view"

interface Node {
  id: string
  name: string
  children?: Node[]
  childrenCount?: number
}

const apiResult: Record<string, Node[]> = {
  node_modules: [
    { id: "zag-js", name: "zag-js" },
    { id: "pandacss", name: "panda" },
    { id: "@types", name: "@types", childrenCount: 2 },
  ],
  "node_modules/@types": [
    { id: "@types/react", name: "react" },
    { id: "@types/react-dom", name: "react-dom" },
  ],
  src: [
    { id: "src/app.tsx", name: "app.tsx" },
    { id: "src/index.ts", name: "index.ts" },
  ],
}

function loadChildren(details: tree.LoadChildrenDetails<Node>): Promise<Node[]> {
  const value = details.valuePath.join("/")
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(apiResult[value] ?? [])
    }, 1200)
  })
}

const initialRootNode: Node = {
  id: "ROOT",
  name: "",
  children: [
    { id: "node_modules", name: "node_modules", childrenCount: 3 },
    { id: "src", name: "src", childrenCount: 2 },
    { id: "panda.config", name: "panda.config.ts" },
    { id: "package.json", name: "package.json" },
    { id: "renovate.json", name: "renovate.json" },
    { id: "readme.md", name: "README.md" },
  ],
}

// The collection is derived from the (serializable) root node kept in a
// signal, and built lazily — never at module load (see tree-view/basic).
type Collection = ReturnType<typeof tree.collection<Node>>
const collections = new WeakMap<Node, Collection>()
const toCollection = (rootNode: Node): Collection => {
  let collection = collections.get(rootNode)
  if (!collection) {
    collection = tree.collection<Node>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.name,
      rootNode,
    })
    collections.set(rootNode, collection)
  }
  return collection
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
          {nodeState.loading ? "..." : <span>📁</span>}
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
  const rootNode = useSignal<Node>(initialRootNode)

  const service = useMachine(
    tree.machine as tree.Machine<Node>,
    () =>
      ({
        id,
        collection: toCollection(rootNode.value),
        loadChildren,
        onLoadChildrenComplete({ collection }) {
          rootNode.value = collection.rootNode
        },
      }) as tree.Props<Node>,
  )

  const api = tree.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <main class="tree-view">
      <div {...api.getRootProps()}>
        <h3 {...api.getLabelProps()}>My Documents</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick$={() => apiRef.current?.collapse()}>Collapse All</button>
          <button onClick$={() => apiRef.current?.expand()}>Expand All</button>
          <button onClick$={() => apiRef.current?.expand(["node_modules"])}>Expand node_modules</button>
          <button onClick$={() => apiRef.current?.collapse(["node_modules"])}>Collapse node_modules</button>
        </div>
        <div {...api.getTreeProps()}>
          {rootNode.value.children?.map((node, index) => (
            <TreeNode key={node.id} node={node} indexPath={[index]} api={api} />
          ))}
        </div>
      </div>
    </main>
  )
})

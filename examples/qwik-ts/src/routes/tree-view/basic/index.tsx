import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { treeviewControls } from "@zag-js/shared"
import * as tree from "@zag-js/tree-view"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

interface Node {
  id: string
  name: string
  children?: Node[]
  disabled?: boolean
}

const collection = tree.collection<Node>({
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
})

/** see pin-input example: live api handle for custom (non-zag) buttons */
const apiRef: { current?: tree.Api } = {}

interface TreeNodeProps {
  node: Node
  indexPath: number[]
  api: tree.Api
}

// inline (lite) component: runs in the parent's render, so it can receive
// the non-serializable api as a prop
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
  const controls = useControls(treeviewControls)
  const id = useId()

  const service = useMachine(
    tree.machine,
    () =>
      ({
        id,
        collection,
        ...controls.values(),
      }) as tree.Props,
  )

  const api = tree.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="tree-view">
        <div {...api.getRootProps()}>
          <h3 {...api.getLabelProps()}>My Documents</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick$={() => apiRef.current?.collapse()}>Collapse All</button>
            <button onClick$={() => apiRef.current?.expand()}>Expand All</button>
            {controls.state.selectionMode === "multiple" && (
              <>
                <button onClick$={() => apiRef.current?.select()}>Select All</button>
                <button onClick$={() => apiRef.current?.deselect()}>Deselect All</button>
              </>
            )}
          </div>
          <div {...api.getTreeProps()}>
            {collection.rootNode.children?.map((node, index) => (
              <TreeNode key={node.id} node={node} indexPath={[index]} api={api} />
            ))}
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

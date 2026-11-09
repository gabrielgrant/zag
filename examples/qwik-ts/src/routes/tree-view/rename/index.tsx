import { component$, useId, useSignal } from "@qwik.dev/core"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import * as tree from "@zag-js/tree-view"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

interface Node {
  id: string
  name: string
  children?: Node[]
}

const initialRootNode: Node = {
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
          {nodeState.renaming ? (
            <input {...api.getNodeRenameInputProps(nodeProps)} />
          ) : (
            <>
              <span>📁</span>
              <span
                {...mergeProps(api.getBranchTextProps(nodeProps), {
                  style: { display: nodeState.renaming ? "none" : "inline" },
                })}
              >
                {node.name}
              </span>
              <span {...api.getBranchIndicatorProps(nodeProps)}>{"›"}</span>
            </>
          )}
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
      {nodeState.renaming ? (
        <input {...api.getNodeRenameInputProps(nodeProps)} />
      ) : (
        <>
          <span>📄</span>
          <span
            {...mergeProps(api.getItemTextProps(nodeProps), {
              style: { display: nodeState.renaming ? "none" : "inline" },
            })}
          >
            {node.name}
          </span>
        </>
      )}
    </div>
  )
}

export default component$(() => {
  const controls = useControls({})
  const id = useId()
  const rootNode = useSignal<Node>(initialRootNode)

  const service = useMachine(
    tree.machine as tree.Machine<Node>,
    () =>
      ({
        id,
        collection: toCollection(rootNode.value),
        canRename: (node: Node) => {
          // Only allow renaming leaf nodes (files), not branches (folders)
          return !node.children
        },
        onRenameComplete: (details: tree.RenameCompleteDetails) => {
          console.log("Rename complete:", details)
          const collection = toCollection(rootNode.value)
          const node = collection.at(details.indexPath)!
          const updatedCollection = collection.replace(details.indexPath, {
            ...node,
            name: details.label,
          })
          rootNode.value = updatedCollection.rootNode
        },
        ...controls.values(),
      }) as tree.Props<Node>,
  )
  const api = tree.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="tree-view">
        <div {...api.getRootProps()}>
          <h3 {...api.getLabelProps()}>My Documents (Renameable)</h3>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
            Press F2 on any <strong>file</strong> to rename it (folders cannot be renamed). Empty names and duplicates
            are prevented.
          </p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button onClick$={() => apiRef.current?.collapse()}>Collapse All</button>
            <button onClick$={() => apiRef.current?.expand()}>Expand All</button>
          </div>
          <div {...api.getTreeProps()}>
            {rootNode.value.children?.map((node, index) => (
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

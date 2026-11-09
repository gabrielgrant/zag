import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as tree from "@zag-js/tree-view"

interface Node {
  id: string
  name: string
  children?: Node[]
}

// Created on first use rather than at module load (see tree-view/basic).
let collectionCache: ReturnType<typeof tree.collection<Node>> | undefined
const getCollection = () =>
  (collectionCache ??= tree.collection<Node>({
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

interface TreeNodeProps {
  node: Node
  indexPath: number[]
  api: tree.Api
}

// text glyphs stand in for the React page's lucide icons
const iconMap = {
  true: "☑",
  false: "☐",
  indeterminate: "⊟",
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
  const id = useId()

  const service = useMachine(
    tree.machine as tree.Machine<Node>,
    () =>
      ({
        id,
        collection: getCollection(),
        defaultCheckedValue: [],
      }) as tree.Props<Node>,
  )

  const api = tree.connect(service, normalizeProps)

  return (
    <main class="tree-view">
      <div {...api.getRootProps()}>
        <h3 {...api.getLabelProps()}>My Documents</h3>
        <div {...api.getTreeProps()}>
          {api.collection.rootNode.children?.map((node: Node, index: number) => (
            <TreeNode key={node.id} node={node} indexPath={[index]} api={api} />
          ))}
        </div>
      </div>
      <pre>{JSON.stringify(api.checkedValue, null, 2)}</pre>
    </main>
  )
})

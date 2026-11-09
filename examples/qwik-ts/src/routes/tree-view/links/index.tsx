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
  href?: string
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
          id: "docs",
          name: "Documentation",
          children: [
            { id: "docs/getting-started", name: "Getting Started", href: "/docs/getting-started" },
            { id: "docs/installation", name: "Installation", href: "/docs/installation" },
            {
              id: "docs/components",
              name: "Components",
              children: [
                { id: "docs/components/accordion", name: "Accordion", href: "/docs/components/accordion" },
                { id: "docs/components/dialog", name: "Dialog", href: "/docs/components/dialog" },
                { id: "docs/components/menu", name: "Menu", href: "/docs/components/menu" },
              ],
            },
          ],
        },
        {
          id: "examples",
          name: "Examples",
          children: [
            { id: "examples/react", name: "React Examples", href: "/examples/react" },
            { id: "examples/vue", name: "Vue Examples", href: "/examples/vue" },
            { id: "examples/solid", name: "Solid Examples", href: "/examples/solid" },
          ],
        },
        {
          id: "external",
          name: "External Links",
          children: [
            { id: "external/github", name: "GitHub Repository", href: "https://github.com/chakra-ui/zag" },
            { id: "external/npm", name: "NPM Package", href: "https://www.npmjs.com/package/@zag-js/core" },
            { id: "external/docs", name: "Official Docs", href: "https://zagjs.com" },
          ],
        },
        { id: "readme.md", name: "README.md", href: "/readme" },
        { id: "license", name: "LICENSE", href: "/license" },
      ],
    },
  }))

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

  // Render as link if node has href
  if (node.href) {
    return (
      <a href={node.href} {...api.getItemProps(nodeProps)}>
        <span>📄</span>
        <span {...api.getItemTextProps(nodeProps)}>{node.name}</span>
        {node.href.startsWith("http") && <span style={{ fontSize: "12px" }}>↗</span>}
      </a>
    )
  }

  return (
    <div {...api.getItemProps(nodeProps)}>
      <span>📄</span>
      <span {...api.getItemTextProps(nodeProps)}>{node.name}</span>
    </div>
  )
}

export default component$(() => {
  const controls = useControls(treeviewControls)
  const id = useId()

  const service = useMachine(
    tree.machine as tree.Machine<Node>,
    () =>
      ({
        id,
        collection: getCollection(),
        ...controls.values(),
      }) as tree.Props<Node>,
  )
  const api = tree.connect(service, normalizeProps)

  return (
    <>
      <main class="tree-view">
        <div {...api.getRootProps()}>
          <h3 {...api.getLabelProps()}>Docs</h3>
          <div {...api.getTreeProps()}>
            {getCollection().rootNode.children?.map((node, index) => (
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

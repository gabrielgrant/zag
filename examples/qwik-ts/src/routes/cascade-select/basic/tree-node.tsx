import { component$ } from "@qwik.dev/core"
import * as cascadeSelect from "@zag-js/cascade-select"
import { cascadeSelectData } from "@zag-js/shared"
import { bindPart$, normalizeProps, useConnectedParts$, usePart$, type QwikMachineSignal } from "@zag-js/qwik"

export interface Node {
  label: string
  value: string
  continents?: Node[]
  countries?: Node[]
  code?: string
  states?: Node[]
}

export const collection = cascadeSelect.collection<Node>({
  nodeToValue: (node) => node.value,
  nodeToString: (node) => node.label,
  nodeToChildren: (node) => node.continents ?? node.countries ?? node.states ?? [],
  rootNode: cascadeSelectData,
})

interface TreeItemProps {
  index: number
  indexPath: number[]
  machine: QwikMachineSignal<any>
  revision: number
  value: string[]
  item: Node
}

const TreeItem = component$<TreeItemProps>((props) => {
  props.revision
  const itemProps = {
    indexPath: [...props.indexPath, props.index],
    value: [...props.value, collection.getNodeValue(props.item)],
    item: props.item,
  }

  const item = usePart$(
    () => cascadeSelect.connect(props.machine.controller.value.service, normalizeProps).getItemProps(itemProps),
    props.machine,
  )
  const itemText = usePart$(
    () => cascadeSelect.connect(props.machine.controller.value.service, normalizeProps).getItemTextProps(itemProps),
    props.machine,
  )
  const itemIndicator = usePart$(
    () =>
      cascadeSelect.connect(props.machine.controller.value.service, normalizeProps).getItemIndicatorProps(itemProps),
    props.machine,
  )

  props.machine.revision.value
  const api = cascadeSelect.connect(props.machine.controller.value.service, normalizeProps)
  const itemState = api.getItemState(itemProps)

  return (
    <li ref={item.ref} {...item.props}>
      <span ref={itemText.ref} {...itemText.props}>
        {props.item.label}
      </span>
      <span ref={itemIndicator.ref} {...itemIndicator.props}>
        ✓
      </span>
      {itemState.hasChildren && <span>{">"}</span>}
    </li>
  )
})

interface TreeNodeProps {
  indexPath?: number[]
  machine: QwikMachineSignal<any>
  node: Node
  revision: number
  value?: string[]
}

export const TreeNode = component$<TreeNodeProps>((props) => {
  props.revision
  const indexPath = props.indexPath ?? []
  const value = props.value ?? []
  const nodeProps = { indexPath, value, item: props.node }

  const parts = useConnectedParts$(
    () => cascadeSelect.connect(props.machine.controller.value.service, normalizeProps),
    props.machine,
  )
  const list = bindPart$((api) => api.getListProps(nodeProps), parts)

  props.machine.revision.value
  const api = cascadeSelect.connect(props.machine.controller.value.service, normalizeProps)
  const nodeState = api.getItemState(nodeProps)
  const children = collection.getNodeChildren(props.node)

  return (
    <>
      <ul ref={list.ref} {...list.props}>
        {children.map((item, index) => (
          <TreeItem
            index={index}
            indexPath={indexPath}
            item={item}
            key={item.value}
            machine={props.machine}
            revision={props.revision}
            value={value}
          />
        ))}
      </ul>
      {nodeState.highlightedChild && collection.isBranchNode(nodeState.highlightedChild) && (
        <TreeNode
          indexPath={[...indexPath, nodeState.highlightedIndex]}
          machine={props.machine}
          node={nodeState.highlightedChild}
          revision={props.revision}
          value={[...value, collection.getNodeValue(nodeState.highlightedChild)]}
        />
      )}
    </>
  )
})

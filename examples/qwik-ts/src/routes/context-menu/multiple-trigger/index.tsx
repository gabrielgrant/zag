import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as menu from "@zag-js/menu"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  type QwikMachineSignal,
} from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

interface FileItem {
  id: number
  name: string
  type: "folder" | "file"
  icon: string
}

const files: FileItem[] = [
  { id: 1, name: "Documents", type: "folder", icon: "📁" },
  { id: 2, name: "Photos", type: "folder", icon: "📁" },
  { id: 3, name: "report.pdf", type: "file", icon: "📄" },
  { id: 4, name: "presentation.pptx", type: "file", icon: "📊" },
  { id: 5, name: "notes.txt", type: "file", icon: "📝" },
  { id: 6, name: "Downloads", type: "folder", icon: "📁" },
]

interface FileTriggerProps {
  file: FileItem
  machine: QwikMachineSignal<any>
}

const FileTrigger = component$<FileTriggerProps>(({ file, machine }) => {
  const parts = useConnectedParts$(() => menu.connect(machine.controller.value.service, normalizeProps), machine)
  const contextTrigger = bindPart$((api) => api.getContextTriggerProps({ value: `${file.id}` }), parts)

  return (
    <div
      ref={contextTrigger.ref}
      style="display: flex; flex-direction: column; align-items: center; padding: 16px; background-color: white; border-radius: 8px; border: 1px solid #e5e7eb; cursor: context-menu; user-select: none; min-height: 108px; justify-content: center;"
      {...contextTrigger.props}
    >
      <span style="font-size: 32px; margin-bottom: 8px;">{file.icon}</span>
      <span style="font-size: 14px; text-align: center; word-break: break-word;">{file.name}</span>
    </div>
  )
})

export default component$(() => {
  const id = useId()

  const machine = useMachine$(() =>
    createMachineSerializer(menu.machine, {
      props: () => ({
        id,
      }),
    }),
  )

  const parts = useConnectedParts$(() => menu.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const triggerValue = api?.triggerValue ?? "-"
  const positioner = bindPart$((api) => api.getPositionerProps(), parts)
  const content = bindPart$((api) => api.getContentProps(), parts)
  const open = bindPart$((api) => api.getItemProps({ value: "open" }), parts)
  const rename = bindPart$((api) => api.getItemProps({ value: "rename" }), parts)
  const copy = bindPart$((api) => api.getItemProps({ value: "copy" }), parts)
  const cut = bindPart$((api) => api.getItemProps({ value: "cut" }), parts)
  const remove = bindPart$((api) => api.getItemProps({ value: "delete" }), parts)
  const activeFile = files.find((file) => `${file.id}` === triggerValue) ?? null
  const openLabel = activeFile?.type === "folder" ? "Open Folder" : "Open File"

  return (
    <>
      <main style="padding: 40px;">
        <h2>File Explorer - Right-click on any item</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Right-click on different files or folders to open the context menu. The menu will reposition to the active
          trigger.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          {files.map((file) => (
            <FileTrigger key={file.id} file={file} machine={machine} />
          ))}
        </div>

        <div style="margin-top: 20px; padding: 12px; background-color: #f9fafb; border-radius: 6px;">
          <strong>Active Trigger:</strong> {triggerValue} <br />
          <strong>Active File:</strong>{" "}
          {activeFile ? `${activeFile.icon} ${activeFile.name} (${activeFile.type})` : "-"}
        </div>

        <div ref={positioner.ref} {...positioner.props}>
          <ul
            ref={content.ref}
            style="list-style: none; margin: 0; padding: 4px; background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); min-width: 160px;"
            {...content.props}
          >
            <li ref={open.ref} style="padding: 8px 12px; cursor: pointer; border-radius: 4px;" {...open.props}>
              {openLabel}
            </li>
            <li ref={rename.ref} style="padding: 8px 12px; cursor: pointer; border-radius: 4px;" {...rename.props}>
              Rename
            </li>
            <li ref={copy.ref} style="padding: 8px 12px; cursor: pointer; border-radius: 4px;" {...copy.props}>
              Copy
            </li>
            <li ref={cut.ref} style="padding: 8px 12px; cursor: pointer; border-radius: 4px;" {...cut.props}>
              Cut
            </li>
            <li style="height: 1px; background-color: #e5e7eb; margin: 4px 0;" />
            <li
              ref={remove.ref}
              style="padding: 8px 12px; cursor: pointer; border-radius: 4px; color: #dc2626;"
              {...remove.props}
            >
              Delete
            </li>
          </ul>
        </div>
      </main>

      <Toolbar>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Context Menu Multiple Trigger | Zag Qwik Examples",
}

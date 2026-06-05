import { component$, useId, useSignal } from "@qwik.dev/core"
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

interface Document {
  id: number
  name: string
  type: string
  size: string
  modified: string
}

const documents: Document[] = [
  { id: 1, name: "Project Proposal.pdf", type: "PDF", size: "2.4 MB", modified: "2024-01-15" },
  { id: 2, name: "Budget 2024.xlsx", type: "Excel", size: "856 KB", modified: "2024-01-14" },
  { id: 3, name: "Meeting Notes.docx", type: "Word", size: "124 KB", modified: "2024-01-13" },
  { id: 4, name: "Design Mockups.fig", type: "Figma", size: "4.2 MB", modified: "2024-01-12" },
  { id: 5, name: "Code Review.md", type: "Markdown", size: "45 KB", modified: "2024-01-11" },
]

interface DocumentTriggerButtonProps {
  label: string
  machine: QwikMachineSignal<any>
  value: string
}

const DocumentTriggerButton = component$<DocumentTriggerButtonProps>(({ label, machine, value }) => {
  const parts = useConnectedParts$(() => menu.connect(machine.controller.value.service, normalizeProps), machine)
  const trigger = bindPart$((api) => api.getTriggerProps({ value }), parts)

  return (
    <button
      aria-label={`Open actions for ${label}`}
      ref={trigger.ref}
      style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px;"
      type="button"
      {...trigger.props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    </button>
  )
})

export default component$(() => {
  const id = useId()
  const activeDocument = useSignal<Document | null>(null)

  const machine = useMachine$(() =>
    createMachineSerializer(menu.machine, {
      props: () => ({
        id,
        onTriggerValueChange({ value }) {
          activeDocument.value = documents.find((doc) => `${doc.id}` === value) ?? null
        },
      }),
    }),
  )

  const parts = useConnectedParts$(() => menu.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const triggerValue = api?.triggerValue ?? "-"
  const positioner = bindPart$((api) => api.getPositionerProps(), parts)
  const content = bindPart$((api) => api.getContentProps(), parts)
  const rename = bindPart$((api) => api.getItemProps({ value: "rename" }), parts)
  const remove = bindPart$((api) => api.getItemProps({ value: "delete" }), parts)

  return (
    <>
      <main>
        <section style="margin-bottom: 40px;">
          <h2>Document Manager</h2>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6; text-align: left;">
                <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Name</th>
                <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Type</th>
                <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Size</th>
                <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Modified</th>
                <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px;">{doc.name}</td>
                  <td style="padding: 12px;">{doc.type}</td>
                  <td style="padding: 12px;">{doc.size}</td>
                  <td style="padding: 12px;">{doc.modified}</td>
                  <td style="padding: 12px;">
                    <DocumentTriggerButton label={doc.name} machine={machine} value={`${doc.id}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style="margin-top: 20px; padding: 12px; background-color: #f9fafb; border-radius: 6px;">
            <strong>Active Trigger:</strong> {triggerValue} <br />
            <strong>Active Document:</strong>{" "}
            {activeDocument.value ? `${activeDocument.value.name} (${activeDocument.value.type})` : "-"}
          </div>
        </section>

        <div ref={positioner.ref} {...positioner.props}>
          <ul ref={content.ref} {...content.props}>
            <li ref={rename.ref} {...rename.props}>
              Rename (value: {triggerValue})
            </li>
            <li ref={remove.ref} {...remove.props}>
              Delete (value: {triggerValue})
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
  title: "Menu Multiple Trigger | Zag Qwik Examples",
}

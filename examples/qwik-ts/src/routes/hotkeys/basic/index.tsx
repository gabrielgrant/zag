import { component$, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import { createHotkeyStore, formatHotkey } from "@zag-js/hotkeys"

interface CommandItem {
  id: string
  hotkey: string
  label?: string
}

export default component$(() => {
  const logs = useSignal<string[]>([])
  const commands = useSignal<CommandItem[]>([])

  useVisibleTask$(
    ({ cleanup }) => {
      const addLog = (message: string) => {
        logs.value = [`${new Date().toLocaleTimeString()}: ${message}`, ...logs.value.slice(0, 9)]
      }

      // created on the client: the store holds listeners and DOM targets
      const store = createHotkeyStore()
      store.register([
        {
          id: "save",
          hotkey: "mod+S",
          label: "Save",
          action: () => addLog("mod+S: Save"),
          options: { preventDefault: true },
        },
        { id: "undo", hotkey: "mod+Z", label: "Undo", action: () => addLog("mod+Z: Undo") },
        { id: "redo", hotkey: "mod+shift+Z", label: "Redo", action: () => addLog("mod+shift+Z: Redo") },
        { id: "escape", hotkey: "Escape", label: "Close", action: () => addLog("Escape: Close") },
      ])

      store.init({ target: document })
      commands.value = Array.from(store.getState().commands.values()).map(({ id, hotkey, label }) => ({
        id,
        hotkey,
        label,
      }))

      cleanup(() => store.destroy())
    },
    { strategy: "document-ready" },
  )

  return (
    <main style={{ padding: "2rem", maxWidth: "42rem", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Hotkeys Example</h1>

      <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "0.5rem" }}>
        <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
          {commands.value.map((cmd) => (
            <li key={cmd.id}>
              <code>{formatHotkey(cmd.hotkey, { platform: "mac" })}</code> : {cmd.label || cmd.id}
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          backgroundColor: "#000",
          color: "#00ff00",
          padding: "1rem",
          borderRadius: "0.5rem",
          fontFamily: "monospace",
        }}
      >
        <div style={{ marginBottom: "0.5rem", color: "#888" }}>Event Log:</div>
        {logs.value.map((log, i) => (
          <div key={i} style={{ fontSize: "0.8rem" }}>
            {log}
          </div>
        ))}
        {logs.value.length === 0 && (
          <div style={{ color: "#666", fontStyle: "italic" }}>Press any hotkey to see events...</div>
        )}
      </div>
    </main>
  )
})

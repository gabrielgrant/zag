import { $, component$, Slot, useSignal, useVisibleTask$, type QRL } from "@qwik.dev/core"
import { createHotkeyStore, type HotkeyStore } from "@zag-js/hotkeys"

type PanelName = "editor" | "terminal"

/**
 * The store is created on the client (in a visible task); QRL handlers reach
 * it through this module-level holder.
 */
const storeRef: { current?: HotkeyStore } = {}

const kbdStyle = {
  display: "inline-block",
  padding: "2px 6px",
  fontSize: "0.8rem",
  fontFamily: "monospace",
  backgroundColor: "#f0f0f0",
  border: "1px solid #ccc",
  borderRadius: "4px",
  boxShadow: "0 1px 0 #ccc",
}

const Tab = component$<{ active: boolean; onClick$: QRL<() => void> }>((props) => {
  return (
    <button
      onClick$={props.onClick$}
      style={{
        padding: "6px 16px",
        fontSize: "0.8rem",
        fontWeight: props.active ? 600 : 400,
        backgroundColor: props.active ? "#1e1e1e" : "#e5e5e5",
        color: props.active ? "#fff" : "#666",
        border: "none",
        borderRadius: "6px 6px 0 0",
        cursor: "pointer",
      }}
    >
      <Slot />
    </button>
  )
})

const Panel = component$<{
  active: boolean
  label: string
  hints: string[]
  logs: string[]
  onClick$: QRL<() => void>
}>((props) => {
  const { active } = props
  return (
    <div
      onClick$={props.onClick$}
      style={{
        flex: 1,
        padding: "12px",
        backgroundColor: active ? "#1e1e1e" : "#f5f5f5",
        color: active ? "#d4d4d4" : "#999",
        borderRadius: "0 0 6px 6px",
        fontFamily: "monospace",
        fontSize: "0.8rem",
        cursor: "pointer",
        border: active ? "1px solid #333" : "1px solid #ddd",
        transition: "all 0.15s",
      }}
    >
      <div style={{ marginBottom: "8px", color: active ? "#888" : "#bbb" }}>
        {props.hints.map((h, i) => (
          <div key={i}>{h}</div>
        ))}
      </div>
      {props.logs.map((log, i) => (
        <div key={i} style={{ color: active ? "#00ff00" : "#aaa" }}>
          {log}
        </div>
      ))}
      {props.logs.length === 0 && <div style={{ fontStyle: "italic", color: "#666" }}>No events yet...</div>}
    </div>
  )
})

export default component$(() => {
  const activePanel = useSignal<PanelName>("editor")
  const editorLogs = useSignal<string[]>([])
  const terminalLogs = useSignal<string[]>([])

  useVisibleTask$(
    ({ cleanup }) => {
      const logTo = (target: PanelName, message: string) => {
        const entry = `${new Date().toLocaleTimeString()}: ${message}`
        if (target === "editor") {
          editorLogs.value = [entry, ...editorLogs.value.slice(0, 4)]
        } else {
          terminalLogs.value = [entry, ...terminalLogs.value.slice(0, 4)]
        }
      }

      const store = createHotkeyStore({
        activeScopes: ["editor"],
        conflictBehavior: "allow",
      })
      storeRef.current = store

      store.register([
        // Same hotkey, different scopes
        {
          id: "editor-run",
          hotkey: "mod+Enter",
          label: "Run",
          action: () => logTo("editor", "Run code in editor"),
          scopes: ["editor"],
        },
        {
          id: "terminal-run",
          hotkey: "mod+Enter",
          label: "Run",
          action: () => logTo("terminal", "Execute command in terminal"),
          scopes: ["terminal"],
        },

        // Scope-specific shortcuts
        {
          id: "editor-format",
          hotkey: "Alt+Shift+F",
          label: "Format",
          action: () => logTo("editor", "Format code"),
          scopes: ["editor"],
        },
        {
          id: "terminal-clear",
          hotkey: "mod+K",
          label: "Clear",
          action: () => {
            terminalLogs.value = []
            logTo("terminal", "Terminal cleared")
          },
          scopes: ["terminal"],
        },
      ])

      store.init({ target: document })

      cleanup(() => {
        store.destroy()
        storeRef.current = undefined
      })
    },
    { strategy: "document-ready" },
  )

  const switchPanel = $((panel: PanelName) => {
    activePanel.value = panel
    storeRef.current?.setScope(panel)
  })

  return (
    <main style={{ padding: "2rem", maxWidth: "42rem", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Hotkey Scopes</h1>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        <kbd style={kbdStyle}>⌘ Enter</kbd> does different things depending on which panel is focused.
      </p>

      <div style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
        <Tab active={activePanel.value === "editor"} onClick$={() => switchPanel("editor")}>
          Editor
        </Tab>
        <Tab active={activePanel.value === "terminal"} onClick$={() => switchPanel("terminal")}>
          Terminal
        </Tab>
      </div>

      <div style={{ display: "flex", gap: "2px", minHeight: "220px" }}>
        <Panel
          active={activePanel.value === "editor"}
          label="Editor"
          hints={["⌘Enter — Run code", "Alt+Shift+F — Format"]}
          logs={editorLogs.value}
          onClick$={() => switchPanel("editor")}
        />
        <Panel
          active={activePanel.value === "terminal"}
          label="Terminal"
          hints={["⌘Enter — Execute command", "⌘K — Clear"]}
          logs={terminalLogs.value}
          onClick$={() => switchPanel("terminal")}
        />
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#888" }}>
        Active scope: <strong style={{ color: "#333" }}>{activePanel.value}</strong>
      </div>
    </main>
  )
})

import { component$, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import { autoresizeTextarea } from "@zag-js/auto-resize"

export default component$(() => {
  const textareaRef = useSignal<HTMLTextAreaElement>()
  const value = useSignal("")

  useVisibleTask$(({ cleanup }) => {
    const dispose = autoresizeTextarea(textareaRef.value ?? null)
    cleanup(() => dispose?.())
  })

  return (
    <main style={{ padding: "20px", maxWidth: "600px" }}>
      <h1>Autoresize Controlled Textarea</h1>
      <p>
        Test: Type a character, click Clear, then type the same character again. The onChange should fire each time.
      </p>

      <textarea
        ref={textareaRef}
        value={value.value}
        onInput$={(_, el) => {
          console.log("onChange fired:", el.value)
          value.value = el.value
        }}
        placeholder="Type something..."
        rows={2}
        style={{
          width: "100%",
          resize: "none",
          padding: "12px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />

      <div style={{ marginTop: "12px", display: "flex", gap: "12px" }}>
        <button
          onClick$={() => {
            console.log("Clear button clicked")
            value.value = ""
          }}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Clear the field
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <strong>Value from state:</strong>
        <pre
          data-testid="value"
          style={{
            background: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            minHeight: "40px",
          }}
        >
          {JSON.stringify(value.value)}
        </pre>
      </div>

      <div style={{ marginTop: "20px", color: "#666", fontSize: "14px" }}>
        <strong>Instructions:</strong>
        <ol>
          <li>Type any single character (e.g., "a")</li>
          <li>Click "Clear the field" button</li>
          <li>Type the same character again</li>
          <li>
            <strong>Expected:</strong> onChange fires, state updates to "a"
          </li>
          <li>
            <strong>Bug (before fix):</strong> onChange doesn't fire, state stays empty
          </li>
        </ol>
        <p>Check the browser console for onChange logs.</p>
      </div>
    </main>
  )
})

import { component$ } from "@qwik.dev/core"
import { PanelGroup } from "~/components/splitter-panel-group"

export default component$(() => {
  return (
    <main>
      <div style={{ marginBottom: "20px" }}>
        <h2>Nested Splitters with Multi-Drag</h2>
        <p>
          Try dragging at the intersection of the horizontal and vertical resize handles. When your cursor is at the
          intersection, both splitters will resize simultaneously!
        </p>
      </div>

      <PanelGroup
        multiDrag
        orientation="horizontal"
        defaultSize={[20, 60, 20]}
        panels={[{ id: "left" }, { id: "center" }, { id: "right" }]}
      >
        <div q:slot="left" style={{ background: "#f0f8ff", padding: "20px", width: "100%", height: "100%" }}>
          <h3>Left Panel</h3>
          <p>This is a fixed horizontal panel.</p>
        </div>
        <PanelGroup
          q:slot="center"
          multiDrag
          orientation="vertical"
          panels={[{ id: "top" }, { id: "middle" }, { id: "bottom" }]}
        >
          <div q:slot="top" style={{ background: "#fff0f5", padding: "20px", width: "100%", height: "100%" }}>
            <h3>Top Panel</h3>
            <p>This is the top section of the vertical splitter.</p>
          </div>
          <div q:slot="middle" style={{ background: "#f0fff0", padding: "20px", width: "100%", height: "100%" }}>
            <h3>Middle Panel</h3>
            <p>
              <strong>Multi-drag intersection zone:</strong> Move your cursor to the left edge of this panel where it
              meets the horizontal resize handle. You'll see the cursor change to a "move" cursor, allowing you to
              resize both dimensions at once!
            </p>
          </div>
          <div q:slot="bottom" style={{ background: "#fffacd", padding: "20px", width: "100%", height: "100%" }}>
            <h3>Bottom Panel</h3>
            <p>This is the bottom section.</p>
          </div>
        </PanelGroup>
        <div q:slot="right" style={{ background: "#f5f5dc", padding: "20px", width: "100%", height: "100%" }}>
          <h3>Right Panel</h3>
          <p>This is a fixed horizontal panel.</p>
        </div>
      </PanelGroup>

      <p style={{ marginTop: "20px" }}>
        Drag at the intersection of resize handles to resize both directions simultaneously.
      </p>
    </main>
  )
})

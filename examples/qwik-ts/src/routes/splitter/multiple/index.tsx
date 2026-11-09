import { component$ } from "@qwik.dev/core"
import { PanelGroup } from "~/components/splitter-panel-group"

// Panel content is projected into the group's named slots; text content is
// wrapped in a <span q:slot> (Qwik can only project elements by slot name).
export default component$(() => {
  return (
    <main>
      <PanelGroup
        orientation="horizontal"
        defaultSize={[20, 60, 20]}
        panels={[
          { id: "a", order: 0, minSize: 20 },
          { id: "b", order: 1, collapsible: true },
          { id: "c", order: 2, minSize: 20 },
        ]}
      >
        <span q:slot="a">Left</span>
        <PanelGroup
          q:slot="b"
          orientation="vertical"
          panels={[
            { id: "b1", order: 0 },
            { id: "b2", order: 1, collapsible: true },
          ]}
        >
          <span q:slot="b1">top</span>
          <PanelGroup
            q:slot="b2"
            orientation="horizontal"
            panels={[
              { id: "b21", order: 0 },
              { id: "b22", order: 1, collapsible: true },
            ]}
          >
            <span q:slot="b21">left</span>
            <span q:slot="b22">right</span>
          </PanelGroup>
        </PanelGroup>
        <span q:slot="c">right</span>
      </PanelGroup>
    </main>
  )
})

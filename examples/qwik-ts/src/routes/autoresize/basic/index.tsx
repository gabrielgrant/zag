import { component$, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import { autoresizeTextarea } from "@zag-js/auto-resize"

export default component$(() => {
  const textareaRef = useSignal<HTMLTextAreaElement>()

  useVisibleTask$(({ cleanup }) => {
    const dispose = autoresizeTextarea(textareaRef.value ?? null)
    cleanup(() => dispose?.())
  })

  return (
    <main>
      <textarea
        ref={textareaRef}
        rows={4}
        style={{
          width: "100%",
          resize: "none",
          padding: "20px",
          scrollPaddingBlock: "20px",
          maxHeight: "180px",
        }}
      />
    </main>
  )
})

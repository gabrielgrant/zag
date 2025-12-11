import { component$ } from "@builder.io/qwik"
import { useDocumentHead } from "@builder.io/qwik-city"

export const RouterHead = component$(() => {
  const head = useDocumentHead()

  return (
    <>
      <title>{head.title || "Zag.js Qwik Examples"}</title>
      <meta name="description" content={head.meta.find((m) => m.name === "description")?.content} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </>
  )
})

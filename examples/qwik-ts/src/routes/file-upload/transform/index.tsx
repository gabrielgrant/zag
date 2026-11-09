import { component$, useId } from "@qwik.dev/core"
import * as fileUpload from "@zag-js/file-upload"
import { normalizeProps, useMachine } from "@zag-js/qwik"

// image-conversion is CommonJS (no named exports under SSR) and browser-only,
// so it is loaded on first use, on the client
async function loadCompressAccurately() {
  const mod: any = await import("image-conversion")
  return (mod.compressAccurately ??
    mod.default?.compressAccurately) as typeof import("image-conversion").compressAccurately
}

export default component$(() => {
  const id = useId()

  const service = useMachine(fileUpload.machine, () => ({
    id,
    accept: ["image/jpeg", "image/png"],
    transformFiles: async (files: File[]) => {
      const compressAccurately = await loadCompressAccurately()
      return Promise.all(
        files.map(async (file) => {
          const blob = await compressAccurately(file, 200)
          return new File([blob], file.name, { type: blob.type })
        }),
      )
    },
  }))

  const api = fileUpload.connect(service, normalizeProps)

  return (
    <main class="file-upload">
      <div {...api.getRootProps()}>
        <input data-testid="input" {...api.getHiddenInputProps()} />
        <div {...api.getDropzoneProps()}>Drag your files here</div>

        <button {...api.getTriggerProps()}>Choose Files...</button>

        <ul {...api.getItemGroupProps()}>
          {api.acceptedFiles.map((file) => {
            return (
              <li class="file" key={file.name} {...api.getItemProps({ file })}>
                <div>
                  <b>{file.name}</b>
                </div>
                <div {...api.getItemSizeTextProps({ file })}>{api.getFileSize(file)}</div>
                <div>{file.type}</div>
                <button {...api.getItemDeleteTriggerProps({ file })}>X</button>
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
})

import { component$, useId, useSignal } from "@qwik.dev/core"
import * as fileUpload from "@zag-js/file-upload"
import { normalizeProps, useMachine } from "@zag-js/qwik"

const REQUIRED_MESSAGE = "This is required"

/**
 * The React page registers the hidden input with react-hook-form
 * (`validate: (value) => Boolean(value.length) || "This is required"`).
 * Here a native form does the same: validate on submit, then re-validate
 * whenever the files change, and log the form data when valid.
 */
export default component$(() => {
  const id = useId()
  const error = useSignal<string>()
  const submitted = useSignal(false)

  const service = useMachine(fileUpload.machine, () => ({
    id,
    name: "file",
    onFileChange(details: fileUpload.FileChangeDetails) {
      if (submitted.value) {
        error.value = details.acceptedFiles.length ? undefined : REQUIRED_MESSAGE
      }
    },
  }))

  const api = fileUpload.connect(service, normalizeProps)

  return (
    <main>
      <form
        preventdefault:submit
        onSubmit$={(_, form) => {
          submitted.value = true
          const input = form.elements.namedItem("file") as HTMLInputElement | null
          const files = input?.files
          if (!files?.length) {
            error.value = REQUIRED_MESSAGE
            return
          }
          error.value = undefined
          console.log({ file: files })
        }}
        style={{ width: "100%" }}
      >
        <div {...api.getRootProps()}>
          <input {...api.getHiddenInputProps()} />
          <div {...api.getDropzoneProps()}>
            <span>Drag your files here</span>
            <button {...api.getTriggerProps()}>Open Dialog</button>
          </div>

          <div>
            {api.acceptedFiles.map((file) => (
              <div {...api.getItemProps({ file })} key={file.name}>
                <div>
                  {file.name} {api.getFileSize(file)}
                </div>
                <button {...api.getItemDeleteTriggerProps({ file })}>✕</button>
              </div>
            ))}
          </div>

          <button type="submit">Submit</button>

          {error.value}
        </div>
      </form>
    </main>
  )
})

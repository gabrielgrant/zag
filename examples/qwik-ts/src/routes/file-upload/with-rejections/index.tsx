import { component$, useId } from "@qwik.dev/core"
import * as fileUpload from "@zag-js/file-upload"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { fileUploadControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  // shown in the toolbar only (the React page does not spread them either)
  const controls = useControls(fileUploadControls)
  const id = useId()

  const service = useMachine(fileUpload.machine, {
    id,
    maxFiles: 2,
  })

  const api = fileUpload.connect(service, normalizeProps)

  return (
    <>
      <main class="file-upload">
        <div {...api.getRootProps()}>
          <input data-testid="input" {...api.getHiddenInputProps()} />
          <div {...api.getDropzoneProps()}>Drag your files here</div>

          <button {...api.getTriggerProps()}>Choose Files...</button>

          <ul {...api.getItemGroupProps()}>
            <li>Accepted files</li>
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

          <ul {...api.getItemGroupProps({ type: "rejected" })}>
            <li>Rejected files</li>
            {api.rejectedFiles.map(({ file, errors }) => {
              return (
                <li class="file" key={file.name} {...api.getItemProps({ file, type: "rejected" })}>
                  <div>
                    <b>{file.name}</b>
                    {errors.map((error) => (
                      <span key={error}>{error}</span>
                    ))}
                  </div>
                  <div {...api.getItemSizeTextProps({ file, type: "rejected" })}>{api.getFileSize(file)}</div>
                  <div>{file.type}</div>
                  <button {...api.getItemDeleteTriggerProps({ file, type: "rejected" })}>X</button>
                </li>
              )
            })}
          </ul>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

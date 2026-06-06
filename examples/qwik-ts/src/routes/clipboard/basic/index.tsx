import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as clipboard from "@zag-js/clipboard"
import { bindPart$, createMachineSerializer, normalizeProps, useConnectedParts$, useMachine$ } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

const CopyIcon = component$(() => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
})

const CheckIcon = component$(() => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
})

export default component$(() => {
  const id = useId()
  const machine = useMachine$(() =>
    createMachineSerializer(clipboard.machine, {
      props: () => ({
        id,
        value: "https://github.com/chakra-ui/zag",
      }),
    }),
  )

  const parts = useConnectedParts$(() => clipboard.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const root = bindPart$((api) => api.getRootProps(), parts)
  const label = bindPart$((api) => api.getLabelProps(), parts)
  const control = bindPart$((api) => api.getControlProps(), parts)
  const input = bindPart$((api) => api.getInputProps(), parts)
  const trigger = bindPart$((api) => api.getTriggerProps(), parts)
  const copiedIndicator = bindPart$((api) => api.getIndicatorProps({ copied: true }), parts)
  const copyIndicator = bindPart$((api) => api.getIndicatorProps({ copied: false }), parts)

  return (
    <>
      <main class="clipboard">
        <div ref={root.ref} {...root.props}>
          <label ref={label.ref} {...label.props}>
            Copy this link
          </label>
          <div ref={control.ref} {...control.props}>
            <input ref={input.ref} style="width: 100%;" {...input.props} />
            <button ref={trigger.ref} {...trigger.props}>
              {api?.copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
          <div ref={copiedIndicator.ref} {...copiedIndicator.props}>
            Copied!
          </div>
          <div ref={copyIndicator.ref} {...copyIndicator.props}>
            Copy
          </div>
        </div>
      </main>

      <Toolbar>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Clipboard | Zag Qwik Examples",
}

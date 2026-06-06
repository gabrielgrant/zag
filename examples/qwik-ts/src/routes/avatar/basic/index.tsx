import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as avatar from "@zag-js/avatar"
import { createMachineSerializer, normalizeProps, useMachine$, usePart$ } from "@zag-js/qwik"
import { avatarData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

const images = avatarData.full

const getRandomImage = () => images[Math.floor(Math.random() * images.length)]

export default component$(() => {
  const id = useId()
  const src = useSignal(images[0])
  const showImage = useSignal(true)
  const machine = useMachine$(() =>
    createMachineSerializer(avatar.machine, {
      props: () => ({ id }),
    }),
  )

  const root = usePart$(() => avatar.connect(machine.controller.value.service, normalizeProps).getRootProps(), machine)
  const fallback = usePart$(
    () => avatar.connect(machine.controller.value.service, normalizeProps).getFallbackProps(),
    machine,
  )
  const image = usePart$(
    () => avatar.connect(machine.controller.value.service, normalizeProps).getImageProps(),
    machine,
  )

  return (
    <>
      <main class="avatar">
        <div ref={root.ref} {...root.props}>
          <span ref={fallback.ref} {...fallback.props}>
            PA
          </span>
          {showImage.value && (
            <img alt="" ref={image.ref} referrerPolicy="no-referrer" src={src.value} {...image.props} />
          )}
        </div>

        <div class="controls">
          <button onClick$={() => (src.value = getRandomImage())}>Change Image</button>
          <button onClick$={() => (src.value = avatarData.broken)}>Broken Image</button>
          <button onClick$={() => (showImage.value = !showImage.value)}>Toggle Image</button>
        </div>
      </main>

      <Toolbar>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Avatar | Zag Qwik Examples",
}

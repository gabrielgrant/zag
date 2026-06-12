import { component$, useId, useSignal } from "@qwik.dev/core"
import * as avatar from "@zag-js/avatar"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { avatarData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

const images = avatarData.full
const getRandomImage = () => images[Math.floor(Math.random() * images.length)]

export default component$(() => {
  const id = useId()
  const service = useMachine(avatar.machine, { id })
  const src = useSignal(images[0])
  const showImage = useSignal(true)

  const api = avatar.connect(service, normalizeProps)

  return (
    <>
      <main class="avatar">
        <div {...api.getRootProps()}>
          <span {...api.getFallbackProps()}>PA</span>
          {showImage.value && <img alt="" referrerPolicy="no-referrer" src={src.value} {...api.getImageProps()} />}
        </div>

        <div class="controls">
          <button onClick$={() => (src.value = getRandomImage())}>Change Image</button>
          <button onClick$={() => (src.value = avatarData.broken)}>Broken Image</button>
          <button onClick$={() => (showImage.value = !showImage.value)}>Toggle Image</button>
        </div>
      </main>

      <Toolbar>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

import { component$, useId, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import { useLocation } from "@qwik.dev/router"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { tabsData } from "@zag-js/shared"
import * as tabs from "@zag-js/tabs"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

/** see pin-input example: live api handle for custom (non-zag) buttons */
const apiRef: { current?: tabs.Api } = {}

export default component$(() => {
  const loc = useLocation()
  const query = {
    controlled: loc.url.searchParams.get("controlled"),
    automatic: loc.url.searchParams.get("automatic"),
    native: loc.url.searchParams.get("native"),
    cancel: loc.url.searchParams.get("cancel"),
  }

  const value = useSignal("nils")
  const id = useId()

  const service = useMachine(
    tabs.machine,
    () =>
      ({
        id,
        defaultValue: "nils",
        value: query.controlled ? value.value : undefined,
        onValueChange(details) {
          value.value = details.value
        },
        activationMode: query.automatic ? "automatic" : "manual",
        ...(!query.native && {
          navigate(details: tabs.NavigateDetails) {
            // the React page pushes the hash through the Next router
            window.location.hash = details.value
          },
        }),
      }) as tabs.Props,
  )

  const api = tabs.connect(service, normalizeProps)
  apiRef.current = api

  // `onClick$` QRLs cannot `preventDefault()` reliably (they may load after
  // the event), so cancelation uses a native listener on the root
  const rootRef = useSignal<HTMLElement>()
  const cancel = !!query.cancel
  useVisibleTask$(
    ({ cleanup }) => {
      const root = rootRef.value
      if (!root || !cancel) return
      const onClick = (event: Event) => event.preventDefault()
      root.addEventListener("click", onClick)
      cleanup(() => root.removeEventListener("click", onClick))
    },
    { strategy: "document-ready" },
  )

  return (
    <>
      <main class="tabs" data-ready={String(!service.context.get("ssr"))}>
        <div>
          <button onClick$={() => apiRef.current?.setValue("agnes")}>Select Agnes with API</button>
          <button onClick$={() => (value.value = "joke")}>Select Joke with prop</button>
        </div>
        <p>
          Selected: <output data-testid="value">{api.value ?? "none"}</output>
        </p>
        <div ref={rootRef} {...api.getRootProps()}>
          <div {...api.getIndicatorProps()} />
          <div {...api.getListProps()}>
            {tabsData.map((data) => (
              <a href={`#${data.id}`} {...(api.getTriggerProps({ value: data.id }) as any)} key={data.id}>
                {data.label}
              </a>
            ))}
          </div>
          {tabsData.map((data) => (
            <div {...api.getContentProps({ value: data.id })} key={data.id}>
              <p>{data.content}</p>
              {data.id === "agnes" ? <input placeholder="Agnes" /> : null}
            </div>
          ))}
        </div>
      </main>
      <Toolbar>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})

import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as pagination from "@zag-js/pagination"
import { paginationData } from "@zag-js/shared"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  type QwikMachineSignal,
} from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

interface PageItemProps {
  machine: QwikMachineSignal<any>
  page: any
}

const PageItem = component$<PageItemProps>(({ machine, page }) => {
  const parts = useConnectedParts$(() => pagination.connect(machine.controller.value.service, normalizeProps), machine)
  const item = bindPart$((api) => api.getItemProps(page), parts)

  return (
    <li>
      <button data-testid={`item-${page.value}`} ref={item.ref} {...item.props}>
        {page.value}
      </button>
    </li>
  )
})

interface EllipsisItemProps {
  index: number
  machine: QwikMachineSignal<any>
}

const EllipsisItem = component$<EllipsisItemProps>(({ index, machine }) => {
  const parts = useConnectedParts$(() => pagination.connect(machine.controller.value.service, normalizeProps), machine)
  const ellipsis = bindPart$((api) => api.getEllipsisProps({ index }), parts)

  return (
    <li>
      <span ref={ellipsis.ref} {...ellipsis.props}>
        &#8230;
      </span>
    </li>
  )
})

export default component$(() => {
  const id = useId()
  const output = useSignal("")
  const machine = useMachine$(() =>
    createMachineSerializer(pagination.machine, {
      props: () => ({
        id,
        count: paginationData.length,
        boundaryCount: 5,
        onPageChange(details: { page: number }) {
          output.value = `page: ${details.page}`
        },
        siblingCount: 5,
      }),
    }),
  )

  const parts = useConnectedParts$(() => pagination.connect(machine.controller.value.service, normalizeProps), machine)
  machine.revision.value
  const api = parts.api
  const rows = api?.slice(paginationData) ?? []
  const pages = api?.pages ?? []
  const root = bindPart$((api) => api.getRootProps(), parts)
  const prevTrigger = bindPart$((api) => api.getPrevTriggerProps(), parts)
  const nextTrigger = bindPart$((api) => api.getNextTriggerProps(), parts)

  return (
    <>
      <main class="pagination">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>FIRST NAME</th>
              <th>LAST NAME</th>
              <th>EMAIL</th>
              <th>PHONE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.first_name}</td>
                <td>{item.last_name}</td>
                <td>{item.email}</td>
                <td>{item.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {api && api.totalPages > 1 && (
          <nav ref={root.ref} {...root.props}>
            <ul>
              <li>
                <button ref={prevTrigger.ref} {...prevTrigger.props}>
                  Previous
                </button>
              </li>
              {pages.map((page, index) => {
                if (page.type === "page") {
                  return <PageItem key={`${page.type}-${page.value}`} machine={machine} page={page} />
                }

                return <EllipsisItem key={`${page.type}-${index}`} index={index} machine={machine} />
              })}
              <li>
                <button ref={nextTrigger.ref} {...nextTrigger.props}>
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}

        <output data-testid="output">{output.value}</output>
      </main>

      <Toolbar>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Pagination | Zag Qwik Examples",
}

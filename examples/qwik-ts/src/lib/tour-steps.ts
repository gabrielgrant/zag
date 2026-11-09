import { registerValueSerializer } from "@zag-js/qwik"
import type * as tour from "@zag-js/tour"

/**
 * The tour machine keeps its steps (which carry `target()`/`effect()` closures)
 * in context, which Qwik cannot serialize for SSR resume. Encode each step by
 * reference to the page's own step list and rehydrate it by id (see tour/basic).
 *
 * Call it in the route body, before `useMachine`: registration replaces any
 * codec with the same id, so repeating it per render is harmless, and it runs
 * before the machine's signals are read on both the server and the client.
 */
export function registerTourSteps(id: string, steps: tour.StepDetails[]) {
  registerValueSerializer({
    id: `tour-step:${id}`,
    match: (v): v is tour.StepDetails => typeof v === "object" && v !== null && steps.includes(v as tour.StepDetails),
    serialize: (v) => v.id,
    deserialize: (stepId) => steps.find((s) => s.id === stepId)!,
  })
}

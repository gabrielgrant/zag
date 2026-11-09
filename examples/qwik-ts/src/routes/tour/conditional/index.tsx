import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as tour from "@zag-js/tour"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { registerTourSteps } from "~/lib/tour-steps"

const steps: tour.StepDetails[] = [
  {
    id: "choose",
    type: "dialog",
    title: "Choose Your Path",
    description: "Are you new here or a returning user?",
    actions: [
      {
        label: "I'm new",
        action: (actionMap) => actionMap.goto("beginner"),
      },
      {
        label: "I know the basics",
        action: (actionMap) => actionMap.goto("advanced"),
      },
    ],
  },
  {
    id: "beginner",
    type: "tooltip",
    target: () => document.querySelector<HTMLElement>("#option-beginner"),
    title: "Welcome!",
    description: "We'll start with the fundamentals to get you up and running.",
    actions: [{ label: "Next", action: "next" }],
  },
  {
    id: "basics",
    type: "tooltip",
    target: () => document.querySelector<HTMLElement>("#feature-basics"),
    title: "Getting Started",
    description: "Create your first project and invite your team.",
    actions: [
      { label: "Prev", action: "prev" },
      { label: "Done", action: "dismiss" },
    ],
  },
  {
    id: "advanced",
    type: "tooltip",
    target: () => document.querySelector<HTMLElement>("#option-advanced"),
    title: "Welcome Back!",
    description: "Let's skip the basics and show you what's new.",
    actions: [{ label: "Next", action: "next" }],
  },
  {
    id: "power",
    type: "tooltip",
    target: () => document.querySelector<HTMLElement>("#feature-power"),
    title: "Power Features",
    description: "Set up automations, API keys, and custom workflows.",
    actions: [
      { label: "Prev", action: "prev" },
      { label: "Done", action: "dismiss" },
    ],
  },
]

/** see pin-input example: live api handle for custom (non-zag) buttons */
const apiRef: { current?: tour.Api } = {}

export default component$(() => {
  const id = useId()

  registerTourSteps("conditional", steps)

  const service = useMachine(tour.machine, {
    id,
    steps,
  })

  const api = tour.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="tour">
        <div>
          <button onClick$={() => apiRef.current?.start()}>Start Tour</button>
          <div class="steps__container">
            <div id="option-beginner" class="tour-card">
              <h4>Beginner</h4>
              <p>New to the platform? Start here.</p>
            </div>
            <div id="option-advanced" class="tour-card">
              <h4>Advanced</h4>
              <p>Already familiar? Jump to power features.</p>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div id="feature-basics" class="tour-card">
                <h4>Getting Started</h4>
                <p>Create your first project.</p>
              </div>
              <div id="feature-power" class="tour-card">
                <h4>Power Features</h4>
                <p>Automations and API access.</p>
              </div>
            </div>
          </div>
        </div>

        {/* rendered inline: Qwik has no portal */}
        {api.step && api.open && (
          <>
            {api.step.backdrop && <div {...api.getBackdropProps()} />}
            <div {...api.getSpotlightProps()} />
            <div {...api.getPositionerProps()}>
              <div {...api.getContentProps()}>
                {api.step.arrow && (
                  <div {...api.getArrowProps()}>
                    <div {...api.getArrowTipProps()} />
                  </div>
                )}

                <p {...api.getTitleProps()}>{api.step.title}</p>
                <div {...api.getDescriptionProps()}>{api.step.description}</div>
                <div {...api.getProgressTextProps()}>{api.getProgressText()}</div>

                {api.step.actions && (
                  <div class="tour button__group">
                    {api.step.actions.map((action) => (
                      <button key={action.label} {...api.getActionTriggerProps({ action })}>
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                <button {...api.getCloseTriggerProps()}>✕</button>
              </div>
            </div>
          </>
        )}
      </main>

      <Toolbar controls={null} viz>
        <StateVisualizer state={service} omit={["steps"]} />
      </Toolbar>
    </>
  )
})

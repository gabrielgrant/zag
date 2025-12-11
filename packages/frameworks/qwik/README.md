# @zag-js/qwik

Qwik adapter for Zag.js state machines.

## Installation

```bash
npm install @zag-js/qwik @builder.io/qwik
# or
pnpm add @zag-js/qwik @builder.io/qwik
```

## Overview

This package provides Qwik integration for Zag.js, with special handling for Qwik's unique event system and preventDefault limitations.

## Basic Usage

```tsx
import { component$, useSignal } from "@builder.io/qwik"
import * as toggle from "@zag-js/toggle-group"
import { useMachine, normalizeProps } from "@zag-js/qwik"

export default component$(() => {
  const service = useMachine(toggle.machine, {
    id: "toggle-1",
  })

  const api = toggle.connect(service, normalizeProps)

  return (
    <div {...api.getRootProps()}>
      <button {...api.getItemProps({ value: "bold" })}>B</button>
      <button {...api.getItemProps({ value: "italic" })}>I</button>
      <button {...api.getItemProps({ value: "underline" })}>U</button>
    </div>
  )
})
```

## The preventDefault Challenge

Qwik has unique constraints around `event.preventDefault()`:

1. **Event handlers are lazy-loaded**: By default, Qwik loads event handlers asynchronously
2. **preventDefault must be synchronous**: Browser default actions happen immediately
3. **Handlers can't access component state**: Synchronous handlers (`sync$()`) have limited capabilities

This package provides multiple strategies to handle these constraints.

## Implementation Approaches

### Approach 1: Basic (normalizePropsBasic)

The simplest approach - just wraps event handlers in QRLs.

**Pros:**
- Simple and predictable
- No magic behavior
- Full control

**Cons:**
- preventDefault won't work in handlers
- Requires manual preventDefault attribute addition

**Usage:**

```tsx
import { normalizePropsBasic } from "@zag-js/qwik"

const api = component.connect(service, normalizePropsBasic)

// You must manually add preventdefault attributes:
<button 
  {...api.getTriggerProps()}
  preventdefault:click
>
  Click me
</button>
```

### Approach 2: Auto-detect (normalizePropsAutoPrevent) - Default

Automatically detects when handlers call preventDefault and adds the necessary attributes.

**Pros:**
- Automatic detection of preventDefault usage
- Works for most common cases
- Best balance of convenience and functionality

**Cons:**
- Detection via string matching (may have false positives/negatives)
- Adds preventDefault for all invocations (can't be conditional)

**Usage:**

```tsx
import { normalizeProps } from "@zag-js/qwik" // This is the auto-detect version

const api = component.connect(service, normalizeProps)

// preventDefault will be automatically added if detected in handlers
return <div {...api.getRootProps()}>...</div>
```

This is the **default export** and recommended for most use cases.

### Approach 3: Manual (normalizePropsManual)

Requires explicit metadata to control preventDefault behavior.

**Pros:**
- Full explicit control
- No surprises
- Can specify exact events

**Cons:**
- More verbose
- Requires understanding of which events need preventDefault

**Usage:**

```tsx
import { normalizePropsManual } from "@zag-js/qwik"

const api = component.connect(service, normalizePropsManual)

return (
  <button 
    {...api.getTriggerProps()}
    data-prevent-default="click"
  >
    Click me
  </button>
)
```

## Advanced: Conditional preventDefault

For cases where preventDefault should only happen under certain conditions, use the helper functions:

### Using Event Properties

```tsx
import { createConditionalPreventDefault } from "@zag-js/qwik"

const handler = createConditionalPreventDefault(
  (event, target) => event.ctrlKey, // Only prevent if Ctrl is pressed
  (event) => {
    // Async handler logic
    console.log("Clicked with Ctrl!")
  }
)

return <button onClick$={handler}>Click me</button>
```

### Using Element Attributes

```tsx
import { component$, useSignal } from "@builder.io/qwik"
import { createAttributePreventDefault } from "@zag-js/qwik"

export default component$(() => {
  const shouldPrevent = useSignal(true)

  const handler = createAttributePreventDefault(
    "data-prevent",
    (event) => {
      console.log("Clicked!")
    }
  )

  return (
    <button
      onClick$={handler}
      data-prevent={shouldPrevent.value ? "true" : undefined}
    >
      Click me
    </button>
  )
})
```

## Comparison with Other Frameworks

### React/Vue/Solid/Svelte

```tsx
// Other frameworks - preventDefault works directly in handlers
onClick(event) {
  event.preventDefault()
  // ... logic
}
```

### Qwik - Option 1: Declarative

```tsx
// Qwik - declarative (always prevents)
preventdefault:click
onClick$={() => {
  // ... logic
}}
```

### Qwik - Option 2: Conditional with sync$

```tsx
// Qwik - conditional prevention
onClick$={[
  sync$((event, target) => {
    if (target.hasAttribute('data-prevent')) {
      event.preventDefault()
    }
  }),
  $(() => {
    // ... async logic
  })
]}
```

## Known Limitations

1. **State Access in sync$ handlers**: Synchronous preventDefault handlers cannot directly access component signals or state. Use element attributes to pass state.

2. **preventDefault detection**: The auto-detect approach uses string matching, which may not catch all cases (e.g., conditionals inside handlers).

3. **Import limitations**: sync$ handlers cannot use imported functions. All logic must be inline.

## Recommendations

1. **Start with the default (auto-detect)**: Works for 90% of use cases
2. **Use manual approach for complex cases**: When you need fine-grained control
3. **Use helper functions for conditional logic**: When preventDefault depends on runtime conditions
4. **Consider component redesign**: If you find yourself fighting Qwik's model, consider whether there's a better approach

## Examples

See the `examples/qwik-ts` directory for complete working examples of all approaches.

## Troubleshooting

### Event handlers not firing

Make sure handlers are wrapped in QRLs (this happens automatically with normalizeProps):

```tsx
// ❌ Wrong - plain function
onClick: () => console.log("clicked")

// ✅ Correct - wrapped by normalizeProps
{...api.getButtonProps()}
```

### preventDefault not working

Try adding the attribute explicitly:

```tsx
<button
  {...api.getButtonProps()}
  preventdefault:click
>
  Click
</button>
```

Or use a conditional helper:

```tsx
import { createAttributePreventDefault } from "@zag-js/qwik"

const handler = createAttributePreventDefault("data-prevent", handleClick)
```

## Contributing

See the main [Zag.js contributing guide](../../../CONTRIBUTING.md).

## License

MIT © Segun Adebayo

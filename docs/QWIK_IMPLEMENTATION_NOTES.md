# Qwik Implementation Notes

This document explains the implementation approach taken to add Qwik support to Zag.js, the challenges faced, and the tradeoffs made.

## Background

Qwik is a modern web framework with unique characteristics:
- **Resumable**: Applications resume where the server left off, without hydration
- **Lazy-loaded**: Code loads on-demand when actually needed
- **Fine-grained**: Only the code for user interactions loads

These characteristics create a unique challenge for libraries like Zag that need to call `event.preventDefault()`.

## The Core Challenge

### Traditional Approach (React/Vue/Solid/Svelte)
```tsx
onClick(event) {
  event.preventDefault()  // Works fine
  // ... handler logic
}
```

### Qwik Challenge
In Qwik, event handlers are loaded asynchronously. By the time your handler runs:
1. The browser has already processed the event's default action
2. Calling `event.preventDefault()` is too late

### Qwik's Solutions

1. **Declarative Prevention**:
   ```tsx
   <button preventdefault:click onClick$={handler}>
   ```
   Qwik's loader calls preventDefault synchronously before loading the handler.

2. **Synchronous Handlers**:
   ```tsx
   <button onClick$={sync$((e, target) => e.preventDefault())}>
   ```
   `sync$()` creates handlers that run before hydration, but with severe limitations:
   - Cannot access component state/signals
   - Cannot use imported functions
   - Must be tiny and inline

## Implementation Approaches Considered

### Approach 1: Always Add preventDefault Attributes ❌

**Idea**: Automatically add `preventdefault:eventname` to all event props.

**Pros**:
- Simple implementation
- Always works

**Cons**:
- Would prevent default for ALL events
- Breaks navigation, form submission when wanted
- Too aggressive

**Decision**: Rejected - too many false positives

### Approach 2: Never Add preventDefault Attributes ❌

**Idea**: Require users to manually add all preventDefault attributes.

**Pros**:
- Maximum control
- No surprises

**Cons**:
- Too verbose
- Easy to forget
- Poor developer experience

**Decision**: Rejected as sole option - but included as "Basic" strategy for learning/debugging

### Approach 3: Auto-detect with String Matching ✅ (Default)

**Idea**: Analyze handler code to detect `preventDefault()` calls.

```typescript
const hasPreventDefault = handlerStr.includes("preventDefault")
if (hasPreventDefault) {
  normalized[`preventdefault:${eventName}`] = true
}
```

**Pros**:
- Works automatically for most cases
- Good developer experience
- No extra code needed

**Cons**:
- String matching isn't perfect
- May have false positives/negatives
- Always prevents (can't be conditional)

**Decision**: Selected as default - best balance of convenience and correctness

### Approach 4: Explicit Metadata ✅ (Manual Strategy)

**Idea**: Users specify which events need preventDefault via metadata.

```tsx
<button {...props} data-prevent-default={["click", "mousedown"]}>
```

**Pros**:
- Explicit and clear
- No surprises
- Good for libraries

**Cons**:
- More verbose
- Requires knowing which events need it

**Decision**: Included as "Manual" strategy for advanced users

### Approach 5: QRL Rewriting ❌

**Idea**: Parse and rewrite handler code to wrap preventDefault calls in sync$().

**Pros**:
- Could handle conditional preventDefault

**Cons**:
- Extremely complex
- Fragile (code parsing is hard)
- Would need AST manipulation
- Breaks with minification

**Decision**: Rejected - too complex and fragile

## Final Implementation: Three Strategies

We implemented THREE strategies, giving users choice based on their needs:

### 1. Basic Strategy (`normalizePropsBasic`)
- Just wraps handlers in QRLs
- No preventDefault handling
- **Use case**: Learning, debugging, maximum control

### 2. Auto-detect Strategy (`normalizeProps`) - DEFAULT
- Detects preventDefault via string matching
- Automatically adds attributes
- **Use case**: Most applications (90% of cases)

### 3. Manual Strategy (`normalizePropsManual`)
- Requires explicit `data-prevent-default` metadata
- No auto-detection
- **Use case**: Libraries, predictable behavior needed

## Advanced Helpers

For conditional preventDefault (based on runtime state), we provide helpers:

### createConditionalPreventDefault
```tsx
const handler = createConditionalPreventDefault(
  (event, target) => event.ctrlKey,  // condition
  (event) => { /* async logic */ }
)
```

Uses `sync$()` for synchronous check, then runs async handler.

### createAttributePreventDefault
```tsx
const handler = createAttributePreventDefault(
  "data-prevent",
  (event) => { /* logic */ }
)

<button onClick$={handler} data-prevent={shouldPrevent.value ? "true" : undefined}>
```

Passes state via element attributes (since sync$ can't access signals).

## Comparison with React/Vue/Solid/Svelte

| Feature | React/Vue/Solid/Svelte | Qwik |
|---------|------------------------|------|
| Handler wrapping | Not needed | QRL required |
| preventDefault | Direct call | Declarative attribute or sync$() |
| State access | Always | Not in sync$() |
| Complexity | Simple | More complex |

## Trade-offs Made

### What We Gained
- ✅ Qwik support for Zag.js
- ✅ Multiple strategies for different needs
- ✅ Good developer experience for common cases
- ✅ Advanced options for complex cases

### What We Compromised
- ⚠️ Not as simple as other frameworks
- ⚠️ Auto-detection isn't perfect
- ⚠️ Users need to understand Qwik's model
- ⚠️ Conditional preventDefault requires helpers

### What We Avoided
- ✅ No complex code rewriting
- ✅ No AST manipulation
- ✅ No fragile string parsing
- ✅ No breaking Qwik's model

## Alternative Implementations Considered

### Option A: Single Strategy Only
Just ship auto-detect, no alternatives.

**Rejected because**:
- Doesn't serve all use cases
- No escape hatch for edge cases
- Libraries need predictable behavior

### Option B: Only Sync$ Wrappers
Always use sync$() for preventDefault.

**Rejected because**:
- Requires inline code for every handler
- Can't access component state
- Too limiting

### Option C: Server-side Code Analysis
Analyze code at build time to inject preventDefault.

**Rejected because**:
- Extremely complex
- Build step dependency
- Would break with dynamic code

## Recommendations for Users

1. **Start with default (auto-detect)**: Works for 90% of cases
2. **Use manual for libraries**: Predictable for consumers
3. **Use basic for learning**: Understand what's happening
4. **Use helpers for conditional logic**: When preventDefault depends on state

## Future Improvements

Potential enhancements if Qwik evolves:

1. **If Qwik adds conditional preventdefault**:
   - Could simplify auto-detect strategy
   - Remove need for sync$() helpers

2. **If Qwik adds async preventDefault**:
   - Could remove all special handling
   - Just work like other frameworks

3. **AST-based detection**:
   - More accurate than string matching
   - Could detect conditional cases
   - But requires build step

## Testing Strategy

Testing approach for Qwik adapter:

1. **Unit tests**: Test each strategy independently
2. **Integration tests**: Test with real machines
3. **Example app**: Visual verification
4. **Documentation**: Comprehensive guides

## Conclusion

The three-strategy approach provides:
- **Convenience** (auto-detect) for most users
- **Control** (basic) for learning and debugging
- **Predictability** (manual) for libraries

This balances developer experience with the constraints of Qwik's unique architecture.

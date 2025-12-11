# Qwik Integration Guide

For complete documentation on using Zag.js with Qwik, including:
- Three implementation strategies with detailed tradeoffs
- Advanced conditional preventDefault patterns
- Examples and troubleshooting

See: [packages/frameworks/qwik/README.md](../packages/frameworks/qwik/README.md)

## Quick Reference

```tsx
import { useMachine, normalizeProps } from "@zag-js/qwik"
import * as checkbox from "@zag-js/checkbox"

const service = useMachine(checkbox.machine, { id: "checkbox" })
const api = checkbox.connect(service, normalizeProps)
```

Strategies:
1. `normalizePropsBasic` - Manual control
2. `normalizeProps` - Auto-detect (Recommended)
3. `normalizePropsManual` - Metadata-driven

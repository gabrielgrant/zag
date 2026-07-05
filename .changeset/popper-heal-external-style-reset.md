---
"@zag-js/popper": patch
---

Re-write positioning CSS variables (`--x`, `--y`, `--available-width/height`,
`--reference-width/height`, `--z-index`) when a framework render has reset the
floating element's style attribute, instead of skipping them via the
unchanged-value cache. Fixes floating elements rendering unpositioned in
frameworks that re-serialize the style attribute wholesale (e.g. Qwik).

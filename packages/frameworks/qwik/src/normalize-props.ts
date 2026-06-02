import { createNormalizer } from "@zag-js/types"

const propMap: Record<string, string> = {
  onFocus: "onFocusin",
  onBlur: "onFocusout",
  onChange: "onInput",
  onDoubleClick: "onDblclick",
  htmlFor: "for",
  className: "class",
  defaultValue: "value",
  defaultChecked: "checked",
}

export const normalizeProps = createNormalizer((props: Record<string, unknown>) => {
  return Object.entries(props).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value === undefined) return acc
    acc[propMap[key] ?? key] = value
    return acc
  }, {})
})

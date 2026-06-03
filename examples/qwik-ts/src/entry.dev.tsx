import { render } from "@qwik.dev/core"
import Root from "./root"

const root = document.getElementById("root")

if (root) {
  render(root, <Root />)
}

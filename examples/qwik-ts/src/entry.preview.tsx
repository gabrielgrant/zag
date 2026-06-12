/*
 * Bundle entry point for `vite preview`: serves the app built in production
 * mode (used by the e2e suite).
 */
import { createQwikRouter } from "@qwik.dev/router/middleware/node"
import render from "./entry.ssr"

export default createQwikRouter({ render })

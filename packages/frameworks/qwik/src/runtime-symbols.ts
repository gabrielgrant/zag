import {
  _chk,
  _eaC,
  _eaT,
  _reC,
  _reR,
  _reT,
  _regSymbol,
  _res,
  _rsc,
  _run,
  _suC,
  _suT,
  _task,
  _val,
} from "@qwik.dev/core/internal"

export function registerQwikRuntimeSymbols() {
  // Qwik v2 beta preview builds can omit the core handlers chunk that maps
  // captured document events and visible tasks during SSR. Register the same
  // internal handlers here so adapter users do not need Playwright startup waits.
  _regSymbol(_chk, "chk")
  _regSymbol(_rsc, "rsc")
  _regSymbol(_res, "res")
  _regSymbol(_run, "run")
  _regSymbol(_task, "task")
  _regSymbol(_val, "val")
  _regSymbol(_eaC, "eaC")
  _regSymbol(_eaT, "eaT")
  _regSymbol(_suC, "suC")
  _regSymbol(_suT, "suT")
  _regSymbol(_reR, "reR")
  _regSymbol(_reC, "reC")
  _regSymbol(_reT, "reT")
}

import type { Machine, MachineSchema } from "@zag-js/core"
import {
  implicit$FirstArg,
  noSerialize,
  useSignal,
  useVisibleTask$,
  type NoSerialize,
  type QRL,
  type ReadonlySignal,
  type Signal,
} from "@qwik.dev/core"
import { useSerializerQrl } from "@qwik.dev/core/internal"
import { VanillaMachine, type VanillaMachineSnapshot } from "@zag-js/vanilla"
import { bindProps, splitProps, type ZagProps } from "./bind-props"

export class QwikMachine<T extends MachineSchema> extends VanillaMachine<T> {
  private frame = 0

  scheduleCommit(commit: VoidFunction) {
    if (this.frame) return
    this.frame = requestAnimationFrame(() => {
      this.frame = 0
      commit()
    })
  }

  cancelCommit() {
    cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  bind(node: Element, props: ZagProps) {
    return bindProps(node, props)
  }
}

export interface UseMachineOptions<T extends MachineSchema> {
  props?: Partial<T["props"]> | (() => Partial<T["props"]>)
  snapshot?: VanillaMachineSnapshot<T>
}

export interface QwikMachineSignal<T extends MachineSchema> {
  controller: ReadonlySignal<QwikMachine<T>>
  revision: Signal<number>
}

export function createMachineSerializer<T extends MachineSchema>(
  machine: Machine<T>,
  options: UseMachineOptions<T> = {},
): {
  deserialize: (snapshot: VanillaMachineSnapshot<T>) => QwikMachine<T>
  initial?: VanillaMachineSnapshot<T>
  serialize: (runtime: QwikMachine<T>) => VanillaMachineSnapshot<T>
} {
  return {
    ...(options.snapshot && { initial: options.snapshot }),
    deserialize: (snapshot) => new QwikMachine(machine, options.props, snapshot),
    serialize: (runtime) => runtime.toSnapshot(),
  }
}

export function useMachineQrl<T extends MachineSchema>(
  serializer: QRL<() => ReturnType<typeof createMachineSerializer<T>>>,
): QwikMachineSignal<T> {
  const controller = useSerializerQrl(serializer)
  const revision = useSignal(0)

  useVisibleTask$(
    ({ cleanup }) => {
      const runtime = controller.value
      runtime.start()
      const unsubscribe = runtime.subscribe(() => {
        runtime.scheduleCommit(() => {
          revision.value += 1
        })
      })

      cleanup(() => {
        unsubscribe()
        runtime.cancelCommit()
        runtime.stop()
      })
    },
    { strategy: "document-ready" },
  )

  return {
    controller,
    revision,
  }
}

export const useMachine$ = implicit$FirstArg(useMachineQrl)

export interface ZagPart {
  props: ZagProps
  ref: Signal<Element | undefined>
}

export interface ConnectedParts<T extends MachineSchema, A extends object> {
  api: A
  getApi: QRL<() => A>
  machine: QwikMachineSignal<T>
}

function callQrlSync<Args extends unknown[], Result>(qrl: QRL<(...args: Args) => Result>, ...args: Args): Result {
  const fn = qrl.resolved ?? qrl
  return fn(...args) as Result
}

export function usePartQrl<T extends MachineSchema>(
  getProps: QRL<() => ZagProps>,
  machine: QwikMachineSignal<T>,
  props: ZagProps,
): ZagPart {
  machine.revision.value
  const ref = useSignal<Element>()

  useVisibleTask$(
    async ({ track, cleanup }) => {
      track(() => machine.revision.value)
      const node = ref.value
      if (!node) return
      cleanup(machine.controller.value.bind(node, await getProps()))
    },
    { strategy: "document-ready" },
  )

  return {
    ref,
    props: splitProps(props).staticProps,
  }
}

export function useConnectedPartsQrl<T extends MachineSchema, A extends object>(
  getApi: QRL<() => A>,
  machine: QwikMachineSignal<T>,
): ConnectedParts<T, A> {
  machine.revision.value

  return {
    api: noSerialize(callQrlSync(getApi)) as NoSerialize<A> as A,
    getApi,
    machine,
  }
}

export function bindPartQrl<T extends MachineSchema, A extends object>(
  getProps: QRL<(api: A) => ZagProps>,
  parts: ConnectedParts<T, A>,
): ZagPart {
  parts.machine.revision.value
  const ref = useSignal<Element>()

  useVisibleTask$(
    async ({ track, cleanup }) => {
      track(() => parts.machine.revision.value)
      const node = ref.value
      if (!node) return
      const nextApi = await parts.getApi()
      cleanup(parts.machine.controller.value.bind(node, await getProps(nextApi)))
    },
    { strategy: "document-ready" },
  )

  return {
    ref,
    props: splitProps(callQrlSync(getProps, parts.api)).staticProps,
  }
}

export const useConnectedParts$ = implicit$FirstArg(useConnectedPartsQrl)
export const bindPart$ = implicit$FirstArg(bindPartQrl)
export const usePart$ = implicit$FirstArg(usePartQrl)

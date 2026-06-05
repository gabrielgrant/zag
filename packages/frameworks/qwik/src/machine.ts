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
  private bindings = new Map<Element, { cleanup?: VoidFunction; getProps: () => ZagProps }>()

  scheduleCommit(commit: VoidFunction) {
    if (this.frame) return
    this.frame = requestAnimationFrame(() => {
      this.frame = 0
      this.refreshBindings()
      commit()
    })
  }

  cancelCommit() {
    cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  refreshBindings() {
    this.bindings.forEach((binding, node) => {
      if (!node.isConnected) {
        binding.cleanup?.()
        this.bindings.delete(node)
        return
      }

      binding.cleanup = bindProps(node, binding.getProps())
    })
  }

  bind(node: Element, props: ZagProps | (() => ZagProps)) {
    const getProps = typeof props === "function" ? props : () => props
    const binding = { getProps, cleanup: bindProps(node, getProps()) }
    this.bindings.set(node, binding)

    return () => {
      binding.cleanup?.()
      if (this.bindings.get(node) === binding) this.bindings.delete(node)
    }
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

function callQrlRender<Args extends unknown[], Result>(
  qrl: QRL<(...args: Args) => Result>,
  ...args: Args
): Result | undefined {
  if (qrl.resolved) {
    return qrl.resolved(...args) as Result
  }

  if (typeof window === "undefined") {
    return qrl(...args) as Result
  }

  return
}

export function usePartQrl<T extends MachineSchema>(
  getProps: QRL<() => ZagProps>,
  machine: QwikMachineSignal<T>,
  props?: ZagProps,
): ZagPart {
  machine.revision.value
  const ref = useSignal<Element>()
  const staticProps = useSignal<ZagProps>(splitProps(props ?? callQrlRender(getProps) ?? {}).staticProps)

  useVisibleTask$(
    async ({ track, cleanup }) => {
      track(() => machine.revision.value)
      track(() => Boolean(ref.value))
      const node = ref.value
      if (!node) return
      const resolvedGetProps = await getProps.resolve()
      const getNextProps = () => resolvedGetProps()
      const nextProps = getNextProps()
      staticProps.value = splitProps(props ?? nextProps).staticProps
      cleanup(machine.controller.value.bind(node, () => props ?? getNextProps()))
    },
    { strategy: "document-ready" },
  )

  return {
    ref,
    props: getProps.resolved ? splitProps(props ?? getProps.resolved()).staticProps : staticProps.value,
  }
}

export function useConnectedPartsQrl<T extends MachineSchema, A extends object>(
  getApi: QRL<() => A>,
  machine: QwikMachineSignal<T>,
): ConnectedParts<T, A> {
  machine.revision.value
  const api = useSignal<NoSerialize<A>>()
  const nextApi = callQrlRender(getApi)
  if (nextApi) {
    api.value = noSerialize(nextApi) as NoSerialize<A>
  }

  useVisibleTask$(
    async ({ track }) => {
      track(() => machine.revision.value)
      const resolvedGetApi = await getApi.resolve()
      api.value = noSerialize(resolvedGetApi()) as NoSerialize<A>
    },
    { strategy: "document-ready" },
  )

  return {
    api: api.value as A,
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
  const initialProps = parts.api ? callQrlRender(getProps, parts.api) : undefined
  const staticProps = useSignal<ZagProps>(splitProps(initialProps ?? {}).staticProps)

  useVisibleTask$(
    async ({ track, cleanup }) => {
      track(() => parts.machine.revision.value)
      track(() => Boolean(ref.value))
      const node = ref.value
      if (!node) return
      const [resolvedGetApi, resolvedGetProps] = await Promise.all([parts.getApi.resolve(), getProps.resolve()])
      const getNextProps = () => resolvedGetProps(resolvedGetApi())
      const nextProps = getNextProps()
      staticProps.value = splitProps(nextProps).staticProps
      cleanup(parts.machine.controller.value.bind(node, getNextProps))
    },
    { strategy: "document-ready" },
  )

  return {
    ref,
    props: getProps.resolved ? splitProps(getProps.resolved(parts.api)).staticProps : staticProps.value,
  }
}

export const useConnectedParts$ = implicit$FirstArg(useConnectedPartsQrl)
export const bindPart$ = implicit$FirstArg(bindPartQrl)
export const usePart$ = implicit$FirstArg(usePartQrl)

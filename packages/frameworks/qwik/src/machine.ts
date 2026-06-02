import type { Machine, MachineSchema } from "@zag-js/core"
import {
  implicit$FirstArg,
  useSignal,
  useVisibleTask$,
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
  props?: Partial<T["props"]>
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

  useVisibleTask$(({ cleanup }) => {
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
  })

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

export function usePartQrl<T extends MachineSchema>(
  getProps: QRL<() => ZagProps>,
  machine: QwikMachineSignal<T>,
  props: ZagProps,
): ZagPart {
  machine.revision.value
  const ref = useSignal<Element>()

  useVisibleTask$(async ({ track, cleanup }) => {
    track(() => machine.revision.value)
    const node = ref.value
    if (!node) return
    cleanup(machine.controller.value.bind(node, await getProps()))
  })

  return {
    ref,
    props: splitProps(props).staticProps,
  }
}

export const usePart$ = implicit$FirstArg(usePartQrl)

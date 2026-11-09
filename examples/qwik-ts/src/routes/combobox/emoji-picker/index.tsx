import {
  component$,
  noSerialize,
  useComputed$,
  useId,
  useSignal,
  useTask$,
  useVisibleTask$,
  type NoSerialize,
} from "@qwik.dev/core"
import { elementScroll, observeElementOffset, observeElementRect, Virtualizer } from "@tanstack/virtual-core"
import * as listbox from "@zag-js/listbox"
import * as popover from "@zag-js/popover"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import { EmojiLoader, validateSkinTone, type EmojiData, type SkinTone } from "~/lib/combobox-emoji-loader"
import { mergeQwikProps } from "~/lib/combobox-merge-props"

interface EmojiItem {
  label: string
  value: string
  emoji: string
  category: number
  tags: string[]
  skins?: Record<Exclude<SkinTone, "none">, string>
}

const EMOJI_CATEGORIES = [
  { id: 0, label: "Smileys & Emotion", icon: "😀" },
  { id: 1, label: "People & Body", icon: "👋" },
  { id: 2, label: "Animals & Nature", icon: "🐱" },
  { id: 3, label: "Food & Drink", icon: "🍎" },
  { id: 4, label: "Travel & Places", icon: "🚗" },
  { id: 5, label: "Activities", icon: "⚽" },
  { id: 6, label: "Objects", icon: "📱" },
  { id: 7, label: "Symbols", icon: "❤️" },
  { id: 8, label: "Flags", icon: "🏳️" },
]

const SKIN_TONE_EMOJIS: Record<SkinTone, string> = {
  none: "🖐️",
  light: "🖐🏻",
  "medium-light": "🖐🏼",
  medium: "🖐🏽",
  "medium-dark": "🖐🏾",
  dark: "🖐🏿",
}

const COLUMN_COUNT = 8
const CELL_SIZE = 46

interface VirtualRow {
  index: number
  start: number
}

const css = `
  .emoji-picker-container {
    position: relative;
    display: inline-block;
  }

  .emoji-picker-popover {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    padding: 16px;
    z-index: 1000;
  }

  .emoji-picker-header {
    margin-bottom: 16px;
  }

  .search-input-container {
    position: relative;
    margin-bottom: 12px;
  }

  .emoji-search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    padding-right: 40px;
  }

  .emoji-search-input.searching {
    border-color: #3b82f6;
  }

  .search-indicator {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    pointer-events: none;
  }

  .emoji-skin-tone-selector {
    display: flex;
    gap: 4px;
    justify-content: center;
  }

  .emoji-grid-container {
    height: 300px;
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }

  .skin-tone-button {
    width: 32px;
    height: 32px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 16px;
  }

  .skin-tone-button.selected {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .emoji-picker-categories {
    display: flex;
    gap: 4px;
    margin-top: 16px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .category-button {
    min-width: 32px;
    height: 32px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .category-button.selected {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .emoji-picker-loading,
  .emoji-picker-empty {
    text-align: center;
    padding: 32px;
    color: #6b7280;
    font-size: 14px;
  }

  .emoji-item {
    border: none;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    transition: background-color 0.15s ease;
    box-sizing: border-box;
  }

  .emoji-item:hover {
    background: #f8fafc;
  }

  .emoji-item-empty {
    width: 100%;
    height: 100%;
  }

  .emoji-item[data-selected] {
    background: #eff6ff;
    outline: 2px solid #3b82f6;
  }
`

export default component$(() => {
  const popoverId = useId()
  const listboxId = useId()

  /* -----------------------------------------------------------------------------
   * Emoji picker state (`useEmojiPicker` in the React example)
   * -----------------------------------------------------------------------------*/

  // loaded on the client only; not serialized
  const emojiData = useSignal<NoSerialize<EmojiData>>()
  const loading = useSignal(false)
  const searchQuery = useSignal("")
  const debouncedSearchQuery = useSignal("")
  const selectedCategory = useSignal<number | null>(null)
  const selectedSkinTone = useSignal<SkinTone>("none")
  const selectedEmoji = useSignal<string | null>(null)
  const popoverOpen = useSignal(false)

  useVisibleTask$(
    async () => {
      loading.value = true
      try {
        const data = await new EmojiLoader({ locale: "en" }).load()
        emojiData.value = noSerialize(data)
      } catch (error) {
        console.error("Failed to load emoji data:", error)
      } finally {
        loading.value = false
      }
    },
    { strategy: "document-ready" },
  )

  // Debounce search query
  useTask$(({ track, cleanup }) => {
    const query = track(() => searchQuery.value)
    const timer = setTimeout(() => {
      debouncedSearchQuery.value = query
    }, 150)
    cleanup(() => clearTimeout(timer))
  })

  const filteredEmojis = useComputed$(() => {
    const data = emojiData.value
    if (!data) return noSerialize([] as EmojiItem[])

    const skinTone = selectedSkinTone.value
    let emojis: EmojiItem[] = data.emojis.map((emoji) => {
      let displayEmoji = emoji.emoji
      if (skinTone !== "none" && emoji.skins && skinTone in emoji.skins) {
        displayEmoji = emoji.skins[skinTone as Exclude<SkinTone, "none">]
      }
      return {
        label: emoji.label,
        value: displayEmoji,
        emoji: displayEmoji,
        category: emoji.category,
        tags: emoji.tags,
        skins: emoji.skins,
      }
    })

    const category = selectedCategory.value
    const query = debouncedSearchQuery.value

    if (query.trim()) {
      const q = query.toLowerCase()
      return noSerialize(
        emojis.filter(
          (emoji) =>
            (category === null || emoji.category === category) &&
            `${emoji.label.toLowerCase()} ${emoji.tags.join(" ").toLowerCase()}`.includes(q),
        ),
      )
    }

    if (category !== null) {
      emojis = emojis.filter((emoji) => emoji.category === category)
    }

    return noSerialize(emojis)
  })

  const isSearching = searchQuery.value !== debouncedSearchQuery.value

  /* -----------------------------------------------------------------------------
   * Machines
   * -----------------------------------------------------------------------------*/

  const popoverService = useMachine(popover.machine, () => ({
    id: popoverId,
    // content renders inline (Qwik has no portal)
    portalled: false,
    open: popoverOpen.value,
    onOpenChange(details: popover.OpenChangeDetails) {
      popoverOpen.value = details.open
    },
  }))
  const popoverApi = popover.connect(popoverService, normalizeProps)

  const items = filteredEmojis.value ?? []
  const collection = listbox.gridCollection({
    items,
    columnCount: COLUMN_COUNT,
  })

  const listboxService = useMachine(
    listbox.machine as listbox.Machine<EmojiItem>,
    () =>
      ({
        collection,
        id: listboxId,
        onSelect(details: listbox.SelectionDetails) {
          selectedEmoji.value = details.value
          // the React example closes the popover through an `emoji:select` event
          popoverOpen.value = false
        },
      }) as listbox.Props<EmojiItem>,
  )
  const listboxApi = listbox.connect(listboxService, normalizeProps)

  /* -----------------------------------------------------------------------------
   * Grid virtualization (virtua's `VGrid` in the React example): rows of
   * COLUMN_COUNT cells, virtualized with @tanstack/virtual-core
   * -----------------------------------------------------------------------------*/

  const scrollRef = useSignal<HTMLElement>()
  const virtualizer = useSignal<NoSerialize<{ instance: Virtualizer<HTMLElement, Element>; unmount: () => void }>>()
  const virtualRows = useSignal<VirtualRow[]>([])
  const totalSize = useSignal(0)

  useVisibleTask$(({ track }) => {
    const count = track(() => Math.ceil((filteredEmojis.value?.length ?? 0) / COLUMN_COUNT))
    const element = track(() => scrollRef.value)
    if (!element) return

    const sync = (instance: Virtualizer<HTMLElement, Element>) => {
      virtualRows.value = instance.getVirtualItems().map(({ index, start }) => ({ index, start }))
      totalSize.value = instance.getTotalSize()
    }

    let instance = virtualizer.value?.instance
    if (!instance) {
      instance = new Virtualizer<HTMLElement, Element>({
        count,
        getScrollElement: () => scrollRef.value ?? null,
        estimateSize: () => CELL_SIZE,
        overscan: 4,
        scrollToFn: elementScroll,
        observeElementRect,
        observeElementOffset,
        onChange: sync,
      })
      const unmount = instance._didMount()
      virtualizer.value = noSerialize({ instance, unmount })
    } else {
      instance.setOptions({ ...instance.options, count })
    }
    instance._willUpdate()
    sync(instance)
  })

  useVisibleTask$(({ cleanup }) => {
    cleanup(() => virtualizer.value?.unmount())
  })

  /* -----------------------------------------------------------------------------
   * Render
   * -----------------------------------------------------------------------------*/

  const selectCategory = (categoryId: number) => {
    selectedCategory.value = categoryId === selectedCategory.value ? null : categoryId
  }

  const cycleCategory = (direction: "next" | "previous") => {
    const currentIndex =
      selectedCategory.value === null ? -1 : EMOJI_CATEGORIES.findIndex((cat) => cat.id === selectedCategory.value)
    if (direction === "next") {
      const nextIndex = currentIndex + 1
      selectCategory(EMOJI_CATEGORIES[nextIndex < EMOJI_CATEGORIES.length ? nextIndex : 0].id)
    } else {
      const nextIndex = currentIndex - 1
      selectCategory(EMOJI_CATEGORIES[nextIndex >= 0 ? nextIndex : EMOJI_CATEGORIES.length - 1].id)
    }
  }

  return (
    <main class="emoji-picker-container">
      <button {...popoverApi.getTriggerProps()} class="emoji-picker-trigger">
        {selectedEmoji.value || "😀"} Pick Emoji
      </button>
      <div {...popoverApi.getPositionerProps()}>
        <div {...mergeProps(popoverApi.getContentProps(), { style: { width: "100%" } })} class="emoji-picker-popover">
          <div class="emoji-picker-header">
            <div class="emoji-picker-search">
              <div class="search-input-container">
                <input
                  type="text"
                  placeholder="Search emojis..."
                  value={searchQuery.value}
                  class={`emoji-search-input ${isSearching ? "searching" : ""}`}
                  {...mergeQwikProps(listboxApi.getInputProps({ autoHighlight: true }), {
                    // `onChange` in the React example (React's change == native input)
                    onInput$(_event: Event, element: HTMLInputElement) {
                      searchQuery.value = element.value
                    },
                    onKeyDown$(event: KeyboardEvent, element: HTMLInputElement) {
                      if (event.key === "Tab") {
                        event.preventDefault()
                        cycleCategory(event.shiftKey ? "previous" : "next")
                        element.focus()
                      }
                    },
                  })}
                />
                {isSearching && <div class="search-indicator">⏳</div>}
              </div>
            </div>

            <div class="emoji-skin-tone-selector">
              {Object.keys(emojiData.value?.skinTones || {}).map((skinTone) => (
                <button
                  key={skinTone}
                  onClick$={() => (selectedSkinTone.value = validateSkinTone(skinTone))}
                  class={`skin-tone-button ${selectedSkinTone.value === skinTone ? "selected" : ""}`}
                  title={emojiData.value?.skinTones[skinTone as SkinTone] || skinTone}
                >
                  {SKIN_TONE_EMOJIS[skinTone as SkinTone]}
                </button>
              ))}
            </div>
          </div>

          {loading.value ? (
            <div class="emoji-picker-loading">Loading emojis...</div>
          ) : (
            <div {...listboxApi.getRootProps()} class="emoji-picker-listbox">
              <div
                {...mergeProps(listboxApi.getContentProps(), { style: { padding: 0, textAlign: "center" } })}
                class="emoji-grid-container"
              >
                <div ref={scrollRef} style={{ height: "100%", width: "400px", padding: "4px", overflow: "auto" }}>
                  <div style={{ position: "relative", height: `${totalSize.value}px`, width: "100%" }}>
                    {virtualRows.value.map((row) => (
                      <div
                        key={row.index}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          display: "flex",
                          transform: `translateY(${row.start}px)`,
                        }}
                      >
                        {Array.from({ length: COLUMN_COUNT }, (_, colIndex) => {
                          const item = items[row.index * COLUMN_COUNT + colIndex]
                          return (
                            <div key={colIndex} style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}>
                              {item ? (
                                <div {...listboxApi.getItemProps({ item })} class="emoji-item" title={item.label}>
                                  <span {...listboxApi.getItemTextProps({ item })}>{item.emoji}</span>
                                </div>
                              ) : (
                                <div class="emoji-item-empty" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {listboxApi.collection.size === 0 && !loading.value && (
                <div class="emoji-picker-empty">{searchQuery.value ? "No emojis found" : "No emojis available"}</div>
              )}
            </div>
          )}

          <div class="emoji-picker-categories">
            {EMOJI_CATEGORIES.map((category) => (
              <div
                key={category.id}
                onClick$={() => {
                  selectedCategory.value = category.id === selectedCategory.value ? null : category.id
                }}
                class={`category-button ${selectedCategory.value === category.id ? "selected" : ""}`}
                title={category.label}
              >
                {category.icon}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={css} />
    </main>
  )
})

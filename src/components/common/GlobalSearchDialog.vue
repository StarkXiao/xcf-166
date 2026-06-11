<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/searchStore'
import { Search, Clock, X, ArrowRight, Trash2, Sparkles } from 'lucide-vue-next'

const searchStore = useSearchStore()
const router = useRouter()
const inputRef = ref<HTMLInputElement | null>(null)
const scrollContainerRef = ref<HTMLDivElement | null>(null)

const showHistory = computed(() => {
  return searchStore.query.trim() === '' && searchStore.searchHistory.length > 0
})

const showSuggestions = computed(() => {
  return searchStore.query.trim() !== '' && searchStore.suggestions.length > 0
})

const showResults = computed(() => {
  return searchStore.query.trim() !== '' && searchStore.categorizedResults.length > 0
})

const showEmpty = computed(() => {
  return searchStore.query.trim() !== '' && searchStore.categorizedResults.length === 0 && searchStore.suggestions.length === 0
})

watch(() => searchStore.isOpen, async (val) => {
  if (val) {
    await nextTick()
    inputRef.value?.focus()
    searchStore.buildIndex()
  }
})

watch(() => searchStore.query, () => {
  searchStore.resetSelection()
})

function handleKeydown(e: KeyboardEvent) {
  if (!searchStore.isOpen) return

  if (e.key === 'Escape') {
    e.preventDefault()
    searchStore.closeSearch()
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    searchStore.moveSelection(1)
    scrollToSelected()
    return
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    searchStore.moveSelection(-1)
    scrollToSelected()
    return
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    const selected = searchStore.flatResults[searchStore.selectedIndex]
    if (selected) {
      navigateToResult(selected)
    } else if (searchStore.query.trim()) {
      searchStore.addToHistory(searchStore.query)
    }
    return
  }
}

function scrollToSelected() {
  nextTick(() => {
    const container = scrollContainerRef.value
    if (!container) return
    const selectedEl = container.querySelector('[data-selected="true"]')
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}

function navigateToResult(item: typeof searchStore.flatResults[number]) {
  searchStore.addToHistory(item.title)
  searchStore.closeSearch()
  if (item.route) {
    router.push({
      path: item.route,
      query: item.routeQuery || {},
    })
  }
}

function applySuggestion(suggestion: string) {
  searchStore.query = suggestion
}

function applyHistory(historyItem: string) {
  searchStore.query = historyItem
}

function getGlobalIndex(categoryStartIndex: number, localIndex: number): number {
  return categoryStartIndex + localIndex
}

function isItemSelected(globalIndex: number): boolean {
  return searchStore.selectedIndex === globalIndex
}

let globalIndexCounter = 0
const categoryIndexMap = computed(() => {
  const map = new Map<string, number>()
  let counter = 0
  for (const group of searchStore.categorizedResults) {
    map.set(group.category, counter)
    counter += group.items.length
  }
  return map
})

onMounted(() => {
  searchStore.loadHistory()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="search-overlay">
      <div
        v-if="searchStore.isOpen"
        class="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="searchStore.closeSearch"
        />

        <div
          class="relative w-full max-w-2xl mx-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          @click.stop
        >
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
            <Search class="w-5 h-5 text-gray-500 flex-shrink-0" />
            <input
              ref="inputRef"
              v-model="searchStore.query"
              type="text"
              placeholder="搜索页面、成就、道具、角色、副本、任务..."
              class="flex-1 bg-transparent text-white text-base outline-none placeholder-gray-500"
            />
            <div class="flex items-center gap-2 flex-shrink-0">
              <kbd class="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded border border-gray-700">Esc</kbd>
              <button
                @click="searchStore.closeSearch"
                class="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <X class="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div ref="scrollContainerRef" class="max-h-[60vh] overflow-y-auto">
            <div v-if="showSuggestions" class="px-4 py-3 border-b border-gray-800">
              <div class="flex items-center gap-2 mb-2">
                <Sparkles class="w-3.5 h-3.5 text-amber-400" />
                <span class="text-xs text-gray-500 uppercase tracking-wide">联想词</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="suggestion in searchStore.suggestions"
                  :key="suggestion"
                  @click="applySuggestion(suggestion)"
                  class="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors border border-gray-700"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>

            <div v-if="showHistory && !showResults" class="px-4 py-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Clock class="w-3.5 h-3.5 text-gray-500" />
                  <span class="text-xs text-gray-500 uppercase tracking-wide">搜索历史</span>
                </div>
                <button
                  @click="searchStore.clearHistory"
                  class="flex items-center gap-1 text-xs text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 class="w-3 h-3" />
                  清空
                </button>
              </div>
              <div class="space-y-1">
                <button
                  v-for="(item, idx) in searchStore.searchHistory.slice(0, 10)"
                  :key="idx"
                  @click="applyHistory(item)"
                  class="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors group"
                >
                  <div class="flex items-center gap-2">
                    <Clock class="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400" />
                    <span>{{ item }}</span>
                  </div>
                  <button
                    @click.stop="searchStore.removeHistoryItem(item)"
                    class="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                  >
                    <X class="w-3 h-3 text-gray-500" />
                  </button>
                </button>
              </div>
            </div>

            <div v-if="showResults">
              <div
                v-for="group in searchStore.categorizedResults"
                :key="group.category"
                class="border-b border-gray-800/50 last:border-b-0"
              >
                <div class="px-4 py-2 flex items-center gap-2">
                  <span class="text-xs font-medium uppercase tracking-wide" :class="group.color">
                    {{ group.label }}
                  </span>
                  <span class="text-xs text-gray-600">({{ group.items.length }})</span>
                </div>
                <div class="px-2 pb-2 space-y-0.5">
                  <button
                    v-for="(item, localIdx) in group.items"
                    :key="item.id"
                    :data-selected="isItemSelected(categoryIndexMap.get(group.category)! + localIdx)"
                    @click="navigateToResult(item)"
                    @mouseenter="searchStore.selectedIndex = categoryIndexMap.get(group.category)! + localIdx"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group"
                    :class="isItemSelected(categoryIndexMap.get(group.category)! + localIdx) ? 'bg-gray-800' : 'hover:bg-gray-800/50'"
                  >
                    <span class="text-lg flex-shrink-0">{{ item.icon }}</span>
                    <div class="flex-1 min-w-0 text-left">
                      <div class="flex items-center gap-2">
                        <span class="text-sm text-white truncate">{{ item.title }}</span>
                        <span
                          v-if="item.rarity"
                          class="text-[10px] px-1.5 py-0.5 rounded" :class="group.bgColor + ' ' + group.color"
                        >
                          {{ item.rarity }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500 truncate">{{ item.description }}</p>
                    </div>
                    <ArrowRight
                      class="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div v-if="showEmpty" class="px-4 py-12 text-center">
              <div class="text-4xl mb-3">🔍</div>
              <p class="text-gray-500 text-sm">没有找到与「{{ searchStore.query }}」相关的结果</p>
              <p class="text-gray-600 text-xs mt-1">试试其他关键词，或搜索页面、成就、道具等</p>
            </div>

            <div
              v-if="searchStore.query.trim() === '' && searchStore.searchHistory.length === 0"
              class="px-4 py-12 text-center"
            >
              <div class="text-4xl mb-3">🧭</div>
              <p class="text-gray-500 text-sm">输入关键词开始搜索</p>
              <div class="flex flex-wrap justify-center gap-2 mt-4">
                <button
                  v-for="tag in ['成就', '副本', '药剂', '角色', '赛季']"
                  :key="tag"
                  @click="searchStore.query = tag"
                  class="px-3 py-1.5 text-sm bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-colors border border-gray-700"
                >
                  {{ tag }}
                </button>
              </div>
            </div>
          </div>

          <div class="px-5 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-600">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">↑↓</kbd>
                导航
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">Enter</kbd>
                跳转
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">Esc</kbd>
                关闭
              </span>
            </div>
            <span v-if="searchStore.totalResultCount > 0">
              共 {{ searchStore.totalResultCount }} 条结果
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.search-overlay-enter-active {
  transition: all 0.2s ease;
}
.search-overlay-leave-active {
  transition: all 0.15s ease;
}
.search-overlay-enter-from,
.search-overlay-leave-to {
  opacity: 0;
}
.search-overlay-enter-from .relative,
.search-overlay-leave-to .relative {
  transform: scale(0.95) translateY(-10px);
}
</style>

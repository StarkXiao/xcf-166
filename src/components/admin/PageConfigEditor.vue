<template>
  <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <Layout class="w-5 h-5 text-purple-400" />
        页面配置
      </h3>
      <div class="flex items-center gap-2">
        <button
          v-for="element in elementTypes"
          :key="element.type"
          @click="addElement(element.type)"
          class="flex items-center gap-1 px-2 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          :title="`添加${element.label}`"
        >
          <component :is="element.icon" class="w-3.5 h-3.5" />
          {{ element.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-5 gap-4">
      <div class="col-span-2 space-y-4">
        <div class="p-4 bg-gray-700/50 rounded-lg">
          <label class="block text-xs text-gray-400 mb-2">页面名称</label>
          <input
            v-model="localModel.name"
            type="text"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div class="p-4 bg-gray-700/50 rounded-lg">
          <label class="block text-xs text-gray-400 mb-2">主题风格</label>
          <select
            v-model="localModel.theme"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="dark">暗黑主题</option>
            <option value="light">明亮主题</option>
            <option value="purple">紫色主题</option>
            <option value="red">红色主题</option>
            <option value="gold">金色主题</option>
          </select>
        </div>
        <div class="p-4 bg-gray-700/50 rounded-lg">
          <label class="block text-xs text-gray-400 mb-2">背景颜色</label>
          <div class="flex gap-2">
            <input
              v-model="localModel.backgroundColor"
              type="color"
              class="w-12 h-10 rounded cursor-pointer bg-transparent border-0"
            />
            <input
              v-model="localModel.backgroundColor"
              type="text"
              class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
        <div class="p-4 bg-gray-700/50 rounded-lg">
          <label class="block text-xs text-gray-400 mb-2">背景图片URL (可选)</label>
          <input
            v-model="localModel.backgroundImage"
            type="text"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder="输入图片URL"
          />
        </div>
      </div>

      <div class="col-span-3">
        <div class="relative bg-gray-900 rounded-xl overflow-hidden" style="height: 600px;">
          <div
            class="absolute inset-0 bg-cover bg-center"
            :style="{
              backgroundColor: localModel.backgroundColor,
              backgroundImage: localModel.backgroundImage ? `url(${localModel.backgroundImage})` : 'none',
            }"
          >
            <div
              v-for="element in localModel.elements"
              :key="element.id"
              @click="selectedElement = element"
              class="absolute cursor-move rounded-lg transition-all"
              :class="{
                'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900': selectedElement?.id === element.id,
                'hover:ring-2 hover:ring-gray-500': selectedElement?.id !== element.id,
              }"
              :style="{
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width}px`,
                height: `${element.height}px`,
                ...element.style,
              }"
            >
              <div class="w-full h-full flex items-center justify-center overflow-hidden">
                <template v-if="element.type === 'banner'">
                  <div class="w-full h-full relative">
                    <img
                      v-if="element.props.imageUrl"
                      :src="element.props.imageUrl"
                      class="w-full h-full object-cover"
                      alt="banner"
                    />
                    <div v-else class="w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                      <span class="text-white font-bold text-lg">{{ element.props.title || 'Banner' }}</span>
                    </div>
                  </div>
                </template>
                <template v-else-if="element.type === 'button'">
                  <button
                    class="w-full h-full rounded-lg font-semibold text-sm"
                    :class="{
                      'bg-purple-600 text-white': element.props.variant === 'primary',
                      'bg-gray-700 text-white': element.props.variant === 'secondary',
                      'bg-transparent border-2 border-white text-white': element.props.variant === 'outline',
                    }"
                  >
                    {{ element.props.text || '按钮' }}
                  </button>
                </template>
                <template v-else-if="element.type === 'text'">
                  <p
                    class="text-center px-2"
                    :style="{
                      fontSize: element.props.fontSize || '14px',
                      color: element.props.color || '#ffffff',
                      fontWeight: element.props.bold ? 'bold' : 'normal',
                    }"
                  >
                    {{ element.props.content || '文本内容' }}
                  </p>
                </template>
                <template v-else-if="element.type === 'image'">
                  <img
                    :src="element.props.imageUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=game%20icon&image_size=square'"
                    class="w-full h-full object-contain"
                    alt="image"
                  />
                </template>
                <template v-else-if="element.type === 'countdown'">
                  <div class="text-center">
                    <p class="text-2xl font-bold text-white font-mono">00:00:00:00</p>
                    <p class="text-xs text-gray-400 mt-1">{{ element.props.label || '活动倒计时' }}</p>
                  </div>
                </template>
                <template v-else-if="element.type === 'progress'">
                  <div class="w-full px-4">
                    <div class="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{{ element.props.label || '进度' }}</span>
                      <span>{{ element.props.value || 0 }}%</span>
                    </div>
                    <div class="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                        :style="{ width: `${element.props.value || 0}%` }"
                      ></div>
                    </div>
                  </div>
                </template>
                <template v-else-if="element.type === 'reward_list'">
                  <div class="w-full h-full flex items-center justify-center gap-2">
                    <div v-for="i in 3" :key="i" class="w-12 h-12 bg-yellow-500/30 rounded-lg flex items-center justify-center">
                      <Gift class="w-6 h-6 text-yellow-400" />
                    </div>
                  </div>
                </template>
                <template v-else-if="element.type === 'task_list'">
                  <div class="w-full h-full flex flex-col justify-center gap-1 px-2">
                    <div v-for="i in 3" :key="i" class="h-8 bg-gray-700/50 rounded flex items-center px-2">
                      <div class="w-4 h-4 rounded border-2 border-purple-500 mr-2"></div>
                      <div class="flex-1 h-2 bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                </template>
                <template v-else-if="element.type === 'tab'">
                  <div class="w-full h-full flex items-center justify-center gap-4">
                    <span
                      v-for="(tab, i) in (element.props.tabs || ['标签1', '标签2'])"
                      :key="i"
                      class="px-4 py-2 text-sm rounded-lg"
                      :class="i === 0 ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'"
                    >
                      {{ tab }}
                    </span>
                  </div>
                </template>
              </div>
            </div>

            <div
              v-if="localModel.elements.length === 0"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="text-center text-gray-500">
                <Layout class="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p class="text-sm">点击上方按钮添加页面元素</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedElement" class="mt-4 p-4 bg-gray-700/50 rounded-lg">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium text-gray-300">元素属性编辑</h4>
        <button
          @click="removeElement(selectedElement.id)"
          class="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
        >
          <Trash2 class="w-3 h-3" />
          删除元素
        </button>
      </div>
      <div class="grid grid-cols-6 gap-3">
        <div>
          <label class="block text-xs text-gray-400 mb-1">X 坐标</label>
          <input
            v-model.number="selectedElement.x"
            type="number"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Y 坐标</label>
          <input
            v-model.number="selectedElement.y"
            type="number"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">宽度</label>
          <input
            v-model.number="selectedElement.width"
            type="number"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">高度</label>
          <input
            v-model.number="selectedElement.height"
            type="number"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div class="col-span-2">
          <label class="block text-xs text-gray-400 mb-1">元素类型</label>
          <select
            v-model="selectedElement.type"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option v-for="et in elementTypes" :key="et.type" :value="et.type">
              {{ et.label }}
            </option>
          </select>
        </div>

        <div v-if="selectedElement.type === 'banner'" class="col-span-3">
          <label class="block text-xs text-gray-400 mb-1">图片URL</label>
          <input
            v-model="selectedElement.props.imageUrl"
            type="text"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div v-if="selectedElement.type === 'banner' || selectedElement.type === 'button'" class="col-span-3">
          <label class="block text-xs text-gray-400 mb-1">标题/文本</label>
          <input
            v-model="elementTitleText"
            type="text"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div v-if="selectedElement.type === 'button'" class="col-span-2">
          <label class="block text-xs text-gray-400 mb-1">按钮样式</label>
          <select
            v-model="selectedElement.props.variant"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="primary">主按钮</option>
            <option value="secondary">次按钮</option>
            <option value="outline">边框按钮</option>
          </select>
        </div>
        <div v-if="selectedElement.type === 'button' || selectedElement.type === 'banner'" class="col-span-2">
          <label class="block text-xs text-gray-400 mb-1">点击行为</label>
          <select
            v-model="actionType"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="navigate">跳转页面</option>
            <option value="claim">领取奖励</option>
            <option value="open_modal">打开弹窗</option>
          </select>
        </div>
        <div v-if="selectedElement.type === 'text'" class="col-span-3">
          <label class="block text-xs text-gray-400 mb-1">文本内容</label>
          <input
            v-model="selectedElement.props.content"
            type="text"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div v-if="selectedElement.type === 'text'" class="col-span-1">
          <label class="block text-xs text-gray-400 mb-1">字号</label>
          <input
            v-model="selectedElement.props.fontSize"
            type="text"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder="14px"
          />
        </div>
        <div v-if="selectedElement.type === 'text'" class="col-span-1">
          <label class="block text-xs text-gray-400 mb-1">颜色</label>
          <input
            v-model="selectedElement.props.color"
            type="color"
            class="w-full h-8 rounded cursor-pointer bg-transparent border-0"
          />
        </div>
        <div v-if="selectedElement.type === 'text'" class="col-span-1">
          <label class="block text-xs text-gray-400 mb-1">加粗</label>
          <div class="flex items-center h-8">
            <input
              v-model="selectedElement.props.bold"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
            />
          </div>
        </div>
        <div v-if="selectedElement.type === 'image'" class="col-span-6">
          <label class="block text-xs text-gray-400 mb-1">图片URL</label>
          <input
            v-model="selectedElement.props.imageUrl"
            type="text"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div v-if="selectedElement.type === 'countdown'" class="col-span-3">
          <label class="block text-xs text-gray-400 mb-1">倒计时标签</label>
          <input
            v-model="selectedElement.props.label"
            type="text"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div v-if="selectedElement.type === 'progress'" class="col-span-2">
          <label class="block text-xs text-gray-400 mb-1">进度标签</label>
          <input
            v-model="selectedElement.props.label"
            type="text"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div v-if="selectedElement.type === 'progress'" class="col-span-1">
          <label class="block text-xs text-gray-400 mb-1">进度值</label>
          <input
            v-model.number="selectedElement.props.value"
            type="number"
            min="0"
            max="100"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div v-if="selectedElement.type === 'tab'" class="col-span-6">
          <label class="block text-xs text-gray-400 mb-1">标签页（逗号分隔）</label>
          <input
            :value="(selectedElement.props.tabs || []).join(', ')"
            @input="updateTabs($event, selectedElement)"
            type="text"
            class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder="标签1, 标签2, 标签3"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import {
  Layout,
  Image,
  Square,
  Type,
  Clock,
  BarChart2,
  Gift,
  List,
  FolderOpen,
  Trash2,
} from 'lucide-vue-next'
import type { PageConfig, PageElement, PageElementType } from '@/types/activity'
import { useActivityStore } from '@/stores/activityStore'

const props = defineProps<{
  modelValue: PageConfig
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PageConfig]
}>()

const activityStore = useActivityStore()

const localModel = reactive<PageConfig>({
  ...props.modelValue,
  elements: [...props.modelValue.elements],
})

const selectedElement = ref<PageElement | null>(null)

const elementTitleText = computed({
  get: () => selectedElement.value?.props?.title || selectedElement.value?.props?.text || '',
  set: (val: string) => {
    if (selectedElement.value) {
      if (selectedElement.value.type === 'banner') {
        selectedElement.value.props.title = val
      } else if (selectedElement.value.type === 'button') {
        selectedElement.value.props.text = val
      }
    }
  },
})

const actionType = computed({
  get: () => selectedElement.value?.action?.type || '',
  set: (val: string) => {
    if (selectedElement.value) {
      if (!selectedElement.value.action) {
        selectedElement.value.action = { type: val as any, params: {} }
      } else {
        selectedElement.value.action.type = val as any
      }
    }
  },
})

const elementTypes = [
  { type: 'banner' as PageElementType, label: 'Banner', icon: Image },
  { type: 'button' as PageElementType, label: '按钮', icon: Square },
  { type: 'text' as PageElementType, label: '文本', icon: Type },
  { type: 'image' as PageElementType, label: '图片', icon: Image },
  { type: 'countdown' as PageElementType, label: '倒计时', icon: Clock },
  { type: 'progress' as PageElementType, label: '进度条', icon: BarChart2 },
  { type: 'reward_list' as PageElementType, label: '奖励列表', icon: Gift },
  { type: 'task_list' as PageElementType, label: '任务列表', icon: List },
  { type: 'tab' as PageElementType, label: '标签页', icon: FolderOpen },
]

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(localModel, val)
    localModel.elements = [...val.elements]
  },
  { deep: true }
)

watch(
  localModel,
  (val) => {
    emit('update:modelValue', { ...val, elements: [...val.elements] })
  },
  { deep: true }
)

function addElement(type: PageElementType) {
  const newElement: PageElement = {
    id: activityStore.generateId('el'),
    type,
    x: 100,
    y: 100,
    width: type === 'banner' ? 750 : 200,
    height: type === 'banner' ? 200 : 60,
    props: {},
    style: {},
  }

  if (type === 'button') {
    newElement.props.text = '立即参与'
    newElement.props.variant = 'primary'
    newElement.action = { type: 'claim' }
  } else if (type === 'banner') {
    newElement.props.title = '活动Banner'
    newElement.props.imageUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20fantasy%20event%20banner&image_size=landscape_16_9'
  } else if (type === 'text') {
    newElement.props.content = '活动文本内容'
    newElement.props.fontSize = '16px'
    newElement.props.color = '#ffffff'
  } else if (type === 'countdown') {
    newElement.props.label = '活动倒计时'
  } else if (type === 'progress') {
    newElement.props.label = '活动进度'
    newElement.props.value = 50
  } else if (type === 'tab') {
    newElement.props.tabs = ['标签1', '标签2']
  }

  localModel.elements.push(newElement)
  selectedElement.value = newElement
}

function removeElement(id: string) {
  const index = localModel.elements.findIndex(e => e.id === id)
  if (index > -1) {
    localModel.elements.splice(index, 1)
    if (selectedElement.value?.id === id) {
      selectedElement.value = null
    }
  }
}

function updateTabs(event: Event, element: PageElement) {
  const target = event.target as HTMLInputElement
  element.props.tabs = target.value.split(',').map(t => t.trim()).filter(t => t)
}
</script>

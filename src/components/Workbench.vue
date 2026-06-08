<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useOrderStore } from '@/stores/orderStore'
import { useGameStore } from '@/stores/gameStore'
import { useEventStore } from '@/stores/eventStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { audioManager } from '@/game/audio'
import type { Relic, ProcessingStep } from '@/game/types'

const orderStore = useOrderStore()
const gameStore = useGameStore()
const eventStore = useEventStore()
const characterStore = useCharacterStore()
const achievementStore = useAchievementStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const animationId = ref<number | null>(null)
const mousePos = ref({ x: 0, y: 0 })
const isMouseOnCanvas = ref(false)
const flickerIntensity = ref(0)
const shadowOffset = ref({ x: 0, y: 0 })

const currentOrder = computed(() => orderStore.currentOrder)
const currentRelic = computed<Relic | null>(() => currentOrder.value?.relic || null)
const currentSteps = computed(() => currentRelic.value?.processingSteps || [])
const nextStep = computed<ProcessingStep | null>(() => {
  return currentSteps.value.find(s => !s.completed) || null
})
const allStepsCompleted = computed(() => currentSteps.value.length > 0 && currentSteps.value.every(s => s.completed))
const currentProcessingStep = computed<ProcessingStep | null>(() => {
  if (!gameStore.currentProcessingStep) return null
  return currentSteps.value.find(s => s.id === gameStore.currentProcessingStep) || null
})
const isPausedProcessing = computed(() => {
  return gameStore.isProcessing && gameStore.currentProcessingStep && gameStore.processingProgress > 0 && gameStore.processingProgress < 100
})

const stepIcon: Record<string, string> = {
  clean: '🧼',
  repair: '🔧',
  purify: '✨',
  store: '📦'
}

const relicColors: Record<string, { primary: string, secondary: string, glow: string }> = {
  photo: { primary: '#d4a574', secondary: '#8b7355', glow: 'rgba(212, 165, 116, 0.4)' },
  watch: { primary: '#c0c0c0', secondary: '#808080', glow: 'rgba(192, 192, 192, 0.4)' },
  letter: { primary: '#f5e6d3', secondary: '#d4c4a8', glow: 'rgba(245, 230, 211, 0.4)' },
  jewelry: { primary: '#ffd700', secondary: '#b8860b', glow: 'rgba(255, 215, 0, 0.5)' },
  toy: { primary: '#ff9999', secondary: '#cc6666', glow: 'rgba(255, 153, 153, 0.4)' },
  book: { primary: '#8b4513', secondary: '#654321', glow: 'rgba(139, 69, 19, 0.4)' },
  music_box: { primary: '#dda0dd', secondary: '#9932cc', glow: 'rgba(221, 160, 221, 0.4)' },
  mirror: { primary: '#b8d4e8', secondary: '#7aa8c8', glow: 'rgba(184, 212, 232, 0.5)' }
}

function drawRelic(ctx: CanvasRenderingContext2D, relic: Relic, width: number, height: number, time: number) {
  const colors = relicColors[relic.type] || { primary: '#888', secondary: '#555', glow: 'rgba(136, 136, 136, 0.4)' }
  const centerX = width / 2 + shadowOffset.value.x
  const centerY = height / 2 + shadowOffset.value.y

  ctx.save()
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 180)
  gradient.addColorStop(0, colors.glow)
  gradient.addColorStop(1, 'transparent')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(Math.sin(time * 0.001) * 0.02)

  const scale = 1 + Math.sin(time * 0.002) * 0.02
  ctx.scale(scale, scale)

  switch (relic.type) {
    case 'photo':
      drawPhoto(ctx, colors, time)
      break
    case 'watch':
      drawWatch(ctx, colors, time)
      break
    case 'letter':
      drawLetter(ctx, colors, time)
      break
    case 'jewelry':
      drawJewelry(ctx, colors, time)
      break
    case 'toy':
      drawToy(ctx, colors, time)
      break
    case 'book':
      drawBook(ctx, colors, time)
      break
    case 'music_box':
      drawMusicBox(ctx, colors, time)
      break
    case 'mirror':
      drawMirror(ctx, colors, time)
      break
  }

  ctx.restore()

  if (gameStore.isLowSanity) {
    ctx.save()
    ctx.globalAlpha = 0.1 + Math.sin(time * 0.01) * 0.1
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }

  if (flickerIntensity.value > 0) {
    ctx.save()
    ctx.globalAlpha = flickerIntensity.value
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }
}

function drawPhoto(ctx: CanvasRenderingContext2D, colors: { primary: string, secondary: string }, time: number) {
  ctx.fillStyle = colors.secondary
  ctx.fillRect(-90, -110, 180, 220)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(-80, -100, 160, 200)
  ctx.fillStyle = colors.primary
  ctx.fillRect(-70, -90, 140, 180)

  ctx.fillStyle = '#3d3d3d'
  ctx.beginPath()
  ctx.ellipse(0, -20, 35, 45, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#2d2d2d'
  ctx.fillRect(-30, 30, 60, 50)
}

function drawWatch(ctx: CanvasRenderingContext2D, colors: { primary: string, secondary: string }, time: number) {
  ctx.fillStyle = colors.secondary
  ctx.fillRect(-15, -100, 30, 50)

  ctx.beginPath()
  ctx.arc(0, 0, 60, 0, Math.PI * 2)
  ctx.fillStyle = colors.primary
  ctx.fill()
  ctx.strokeStyle = colors.secondary
  ctx.lineWidth = 6
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, 0, 50, 0, Math.PI * 2)
  ctx.fillStyle = '#f5f5dc'
  ctx.fill()

  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 - 90) * Math.PI / 180
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * 40, Math.sin(angle) * 40)
    ctx.lineTo(Math.cos(angle) * 48, Math.sin(angle) * 48)
    ctx.stroke()
  }

  ctx.save()
  ctx.rotate(-Math.PI / 4)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -30)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.rotate(Math.PI / 3)
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -20)
  ctx.stroke()
  ctx.restore()
}

function drawLetter(ctx: CanvasRenderingContext2D, colors: { primary: string, secondary: string }, time: number) {
  ctx.fillStyle = colors.primary
  ctx.beginPath()
  ctx.moveTo(-80, -60)
  ctx.lineTo(80, -60)
  ctx.lineTo(80, 60)
  ctx.lineTo(-80, 60)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = colors.secondary
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = colors.secondary
  ctx.beginPath()
  ctx.moveTo(-80, -60)
  ctx.lineTo(0, 0)
  ctx.lineTo(80, -60)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = colors.secondary
  ctx.lineWidth = 1
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo(-60, -20 + i * 20)
    ctx.lineTo(60, -20 + i * 20)
    ctx.stroke()
  }
}

function drawJewelry(ctx: CanvasRenderingContext2D, colors: { primary: string, secondary: string }, time: number) {
  const sparkle = Math.sin(time * 0.01) * 0.5 + 0.5

  ctx.beginPath()
  ctx.arc(0, 0, 50, 0, Math.PI * 2)
  ctx.strokeStyle = colors.primary
  ctx.lineWidth = 12
  ctx.stroke()

  ctx.save()
  ctx.translate(0, -50)
  ctx.beginPath()
  ctx.moveTo(0, -20)
  ctx.lineTo(15, 0)
  ctx.lineTo(0, 20)
  ctx.lineTo(-15, 0)
  ctx.closePath()
  ctx.fillStyle = colors.primary
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(0, -10)
  ctx.lineTo(8, 0)
  ctx.lineTo(0, 10)
  ctx.lineTo(-8, 0)
  ctx.closePath()
  ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + sparkle * 0.5})`
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = sparkle * 0.3
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 + time * 0.02) * Math.PI / 180
    const r = 60
    ctx.beginPath()
    ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawToy(ctx: CanvasRenderingContext2D, colors: { primary: string, secondary: string }, time: number) {
  ctx.fillStyle = colors.primary
  ctx.beginPath()
  ctx.arc(0, 0, 60, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(-25, -35, 30, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(25, -35, 30, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = colors.secondary
  ctx.beginPath()
  ctx.arc(-25, -35, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(25, -35, 15, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(-20, -15, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(20, -15, 12, 0, Math.PI * 2)
  ctx.fill()

  const eyeOffset = Math.sin(time * 0.002) * 3
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath()
  ctx.arc(-20 + eyeOffset, -15, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(20 + eyeOffset, -15, 6, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = colors.secondary
  ctx.beginPath()
  ctx.ellipse(0, 10, 15, 10, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = colors.secondary
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(0, 20, 15, 0.2, Math.PI - 0.2)
  ctx.stroke()
}

function drawBook(ctx: CanvasRenderingContext2D, colors: { primary: string, secondary: string }, time: number) {
  ctx.fillStyle = colors.primary
  ctx.fillRect(-70, -90, 140, 180)

  ctx.fillStyle = colors.secondary
  ctx.fillRect(-70, -90, 15, 180)

  ctx.fillStyle = '#d4c4a8'
  ctx.fillRect(-50, -70, 100, 140)

  ctx.strokeStyle = colors.secondary
  ctx.lineWidth = 1
  for (let i = 0; i < 8; i++) {
    ctx.beginPath()
    ctx.moveTo(-40, -55 + i * 18)
    ctx.lineTo(40, -55 + i * 18)
    ctx.stroke()
  }

  ctx.fillStyle = `rgba(139, 0, 0, ${0.3 + Math.sin(time * 0.003) * 0.2})`
  ctx.fillRect(-50, 10, 100, 20)
}

function drawMusicBox(ctx: CanvasRenderingContext2D, colors: { primary: string, secondary: string }, time: number) {
  ctx.fillStyle = colors.secondary
  ctx.fillRect(-70, -40, 140, 80)

  ctx.fillStyle = colors.primary
  ctx.fillRect(-65, -35, 130, 70)

  ctx.fillStyle = colors.secondary
  ctx.fillRect(-70, -50, 140, 15)

  ctx.fillStyle = colors.secondary
  ctx.beginPath()
  ctx.arc(-40, -50, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(40, -50, 8, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(0, -60 + Math.sin(time * 0.005) * 5)
  ctx.fillStyle = colors.primary
  ctx.beginPath()
  ctx.moveTo(0, -20)
  ctx.lineTo(10, 10)
  ctx.lineTo(-10, 10)
  ctx.closePath()
  ctx.fill()

  ctx.save()
  ctx.rotate(time * 0.002)
  ctx.fillStyle = colors.secondary
  ctx.fillRect(-2, -15, 4, 30)
  for (let i = 0; i < 4; i++) {
    ctx.save()
    ctx.rotate(i * Math.PI / 2)
    ctx.fillRect(-12, -2, 10, 4)
    ctx.restore()
  }
  ctx.restore()
  ctx.restore()

  const noteOffset = (time * 0.05) % 100
  ctx.save()
  ctx.globalAlpha = 1 - noteOffset / 100
  ctx.fillStyle = colors.primary
  ctx.font = '20px serif'
  ctx.fillText('♪', 20, -40 - noteOffset / 2)
  ctx.fillText('♫', -30, -50 - noteOffset / 3)
  ctx.restore()
}

function drawMirror(ctx: CanvasRenderingContext2D, colors: { primary: string, secondary: string }, time: number) {
  ctx.beginPath()
  ctx.ellipse(0, 0, 70, 90, 0, 0, Math.PI * 2)
  ctx.fillStyle = colors.secondary
  ctx.fill()
  ctx.strokeStyle = colors.primary
  ctx.lineWidth = 8
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(0, 0, 58, 78, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#1a1a2e'
  ctx.fill()

  const gradient = ctx.createRadialGradient(
    Math.sin(time * 0.001) * 20,
    Math.cos(time * 0.001) * 20,
    0,
    0, 0, 70
  )
  gradient.addColorStop(0, 'rgba(184, 212, 232, 0.3)')
  gradient.addColorStop(0.5, 'rgba(100, 150, 200, 0.1)')
  gradient.addColorStop(1, 'transparent')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.ellipse(0, 0, 58, 78, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.globalAlpha = 0.3 + Math.sin(time * 0.002) * 0.2
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(-20, -10, 15, 20, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawWorkspace(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(0.5, '#16213e')
  gradient.addColorStop(1, '#0f0f1a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = 'rgba(100, 100, 120, 0.2)'
  ctx.lineWidth = 1
  const gridSize = 40
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(139, 69, 19, 0.6)'
  ctx.lineWidth = 3
  ctx.strokeRect(20, 20, width - 40, height - 40)

  if (isMouseOnCanvas.value && !gameStore.isProcessing) {
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(mousePos.value.x, mousePos.value.y, 30, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

function render(time: number) {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  drawWorkspace(ctx, width, height, time)

  if (currentRelic.value) {
    drawRelic(ctx, currentRelic.value, width, height, time)
  } else {
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.font = '24px serif'
    ctx.textAlign = 'center'
    ctx.fillText('选择一个遗物开始处理', width / 2, height / 2)
    ctx.restore()
  }

  if (gameStore.isProcessing) {
    const progress = gameStore.processingProgress
    const barWidth = width * 0.6
    const barHeight = 20
    const barX = (width - barWidth) / 2
    const barY = height - 60

    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10)

    ctx.fillStyle = '#333'
    ctx.fillRect(barX, barY, barWidth, barHeight)

    const progressGradient = ctx.createLinearGradient(barX, 0, barX + barWidth * progress / 100, 0)
    progressGradient.addColorStop(0, '#ef4444')
    progressGradient.addColorStop(1, '#f97316')
    ctx.fillStyle = progressGradient
    ctx.fillRect(barX, barY, barWidth * progress / 100, barHeight)

    ctx.fillStyle = '#ffffff'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`处理中... ${Math.floor(progress)}%`, width / 2, barY + 15)
    ctx.restore()
  }

  if (gameStore.isLowSanity) {
    shadowOffset.value = {
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4
    }
    if (Math.random() < 0.05) {
      flickerIntensity.value = 0.3 + Math.random() * 0.3
      setTimeout(() => { flickerIntensity.value = 0 }, 50)
    }
  }

  animationId.value = requestAnimationFrame(render)
}

let processingTimer: number | null = null
let audioStopFn: (() => void) | null = null

async function startProcessing(startProgressOrEvent?: number | Event) {
  let startProgress = 0
  if (typeof startProgressOrEvent === 'number') {
    startProgress = startProgressOrEvent
  } else if (typeof startProgressOrEvent === 'object' && startProgressOrEvent !== null) {
    startProgress = 0
  }

  const step = isPausedProcessing.value ? currentProcessingStep.value : nextStep.value
  if (!step || !currentOrder.value) return
  if (gameStore.isProcessing && !isPausedProcessing.value) return

  if (characterStore.triggerCompleteStep) {
    const consumed = characterStore.consumeCompleteStepTrigger()
    if (consumed) {
      gameStore.setProcessing(step.id, 0)
      completeStep(currentOrder.value.order.id, step.id)
      return
    }
  }

  audioManager.playClick()
  const orderId = currentOrder.value.order.id

  gameStore.setProcessing(step.id, startProgress)
  audioStopFn = audioManager.playProcessing(step.type)

  const baseDuration = step.duration
  const duration = characterStore.calculateProcessingSpeed(baseDuration)
  const adjustedStart = startProgress / 100 * duration
  const startTime = Date.now() - adjustedStart

  if (startProgress === 0) {
    const immunityConsumed = characterStore.consumeAnomalyImmunity()
    if (!immunityConsumed) {
      const anomalyChance = characterStore.calculateAnomalyResistance(0.3)
      if (Math.random() < anomalyChance) {
        eventStore.triggerProcessingAnomaly()
      }
    }
  }

  const tick = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(100, (elapsed / duration) * 100)
    gameStore.setProcessing(step.id, progress)

    if (progress < 100) {
      processingTimer = window.setTimeout(tick, 50)
    } else {
      completeStep(orderId, step.id)
    }
  }

  tick()
}

function resumeProcessing() {
  if (!isPausedProcessing.value) return
  startProcessing(gameStore.processingProgress)
}

function completeStep(orderId: string, stepId: string) {
  if (processingTimer) {
    clearTimeout(processingTimer)
    processingTimer = null
  }
  if (audioStopFn) {
    audioStopFn()
    audioStopFn = null
  }

  orderStore.updateStepProgress(orderId, stepId, true)
  const sanityCost = characterStore.calculateSanityCost(2)
  gameStore.addSanity(-sanityCost)
  audioManager.playSuccess()

  gameStore.setProcessing(null, 0)

  const anomalyChance = characterStore.calculateAnomalyResistance(0.2)
  if (Math.random() < anomalyChance) {
    eventStore.triggerRandomAnomaly()
  }

  if (allStepsCompleted.value && currentOrder.value) {
    achievementStore.trackBehavior('relic_purified', {
      relicType: currentOrder.value.relic.type,
      orderId: currentOrder.value.order.id
    })
  }
}

function handleCompleteOrder() {
  if (!currentOrder.value || !allStepsCompleted.value) return

  audioManager.playClick()
  orderStore.completeOrder(currentOrder.value.order.id)
  audioManager.playSuccess()
  eventStore.triggerRandomChoice()
}

function handleMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  mousePos.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

function handleCanvasClick() {
  if (gameStore.timePhase !== 'night') return
  if (isPausedProcessing.value) {
    resumeProcessing()
  } else if (!gameStore.isProcessing && nextStep.value) {
    startProcessing()
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (canvas) {
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
  }
  animationId.value = requestAnimationFrame(render)

  if (characterStore.triggerCompleteStep && gameStore.isProcessing && currentOrder.value && currentProcessingStep.value) {
    const consumed = characterStore.consumeCompleteStepTrigger()
    if (consumed) {
      completeStep(currentOrder.value.order.id, currentProcessingStep.value.id)
    }
  }
})

onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
  if (processingTimer) {
    clearTimeout(processingTimer)
  }
  if (audioStopFn) {
    audioStopFn()
  }
})

watch(() => characterStore.triggerCompleteStep, (shouldComplete) => {
  if (shouldComplete && gameStore.isProcessing && currentOrder.value && currentProcessingStep.value) {
    const consumed = characterStore.consumeCompleteStepTrigger()
    if (consumed) {
      completeStep(currentOrder.value.order.id, currentProcessingStep.value.id)
    }
  }
})

watch(() => gameStore.isLowSanity, (isLow) => {
  if (isLow) {
    audioManager.playHeartbeat()
  }
})
</script>

<template>
  <div class="workbench h-full flex flex-col bg-gray-950">
    <div class="p-4 border-b border-gray-800 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-amber-400">🔨 工作台</h2>
        <p class="text-xs text-gray-500 mt-1">
          {{ gameStore.timePhase === 'day' ? '白天无法处理遗物，请等待夜晚' : isPausedProcessing ? '处理已暂停，点击继续' : '点击工作台开始处理' }}
        </p>
      </div>
      <div v-if="gameStore.isNight" class="flex gap-2">
        <button
          v-if="allStepsCompleted && currentOrder"
          @click="handleCompleteOrder"
          class="deliver-order-btn px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-medium text-white transition-colors"
        >
          ✅ 完成订单
        </button>
      </div>
    </div>

    <div v-if="currentRelic" class="p-4 border-b border-gray-800 bg-gray-900/50">
      <div class="flex items-start gap-4">
        <div class="flex-1">
          <h3 class="text-lg font-bold text-red-300">{{ currentRelic.name }}</h3>
          <p class="text-sm text-gray-400 mt-1">{{ currentRelic.description }}</p>
          <p class="text-xs text-gray-500 mt-2 italic">"{{ currentRelic.story }}"</p>
        </div>
      </div>

      <div class="mt-4 space-y-2">
        <div
          v-for="step in currentSteps"
          :key="step.id"
          class="flex items-center gap-3 p-2 rounded"
          :class="[
            step.completed ? 'bg-green-900/30' :
            gameStore.currentProcessingStep === step.id ? 'bg-amber-900/30 border border-amber-500/50' :
            'bg-gray-800/50'
          ]"
        >
          <span class="text-xl">{{ stepIcon[step.type] }}</span>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="font-medium" :class="step.completed ? 'text-green-400' : 'text-gray-300'">
                {{ step.name }}
              </span>
              <span class="text-xs text-gray-500">
                {{ step.completed ? '已完成' : gameStore.currentProcessingStep === step.id ? (isPausedProcessing ? '已暂停' : '处理中...') : '待处理' }}
              </span>
            </div>
            <div class="text-xs text-gray-500 mt-1">{{ step.description }}</div>
          </div>
          <div v-if="step.completed" class="text-green-400 text-xl">✓</div>
        </div>
      </div>

      <div v-if="gameStore.isProcessing" class="purification-progress mt-4">
        <div class="text-xs text-gray-500 mb-1">净化进度</div>
        <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300"
            :style="{ width: `${gameStore.processingProgress}%` }"
          />
        </div>
      </div>

      <button
        v-if="isPausedProcessing && currentProcessingStep && gameStore.isNight"
        @click="resumeProcessing"
        class="mt-4 w-full py-3 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium text-white transition-colors"
      >
        ⏸️ 继续：{{ stepIcon[currentProcessingStep.type] }} {{ currentProcessingStep.name }} ({{ Math.floor(gameStore.processingProgress) }}%)
      </button>
      <button
        v-else-if="nextStep && !gameStore.isProcessing && gameStore.isNight"
        @click="startProcessing"
        class="start-purification-btn mt-4 w-full py-3 bg-red-600 hover:bg-red-500 rounded text-sm font-medium text-white transition-colors"
      >
        开始：{{ stepIcon[nextStep.type] }} {{ nextStep.name }}
      </button>
    </div>

    <div v-else class="p-4 border-b border-gray-800 bg-gray-900/50 text-center text-gray-500">
      从左侧选择一个遗物开始处理
    </div>

    <div class="workbench-area flex-1 relative overflow-hidden">
      <canvas
        ref="canvasRef"
        class="relic-on-workbench w-full h-full cursor-pointer"
        @mousemove="handleMouseMove"
        @mouseenter="isMouseOnCanvas = true"
        @mouseleave="isMouseOnCanvas = false"
        @click="handleCanvasClick"
      ></canvas>

      <div
        v-if="gameStore.isLowSanity"
        class="absolute inset-0 pointer-events-none border-4 border-red-500/20 animate-pulse"
      ></div>
    </div>
  </div>
</template>

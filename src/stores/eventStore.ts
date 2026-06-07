import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameEvent } from '../game/types'
import { narrativeEvents, getRandomAnomalyEvent, getRandomChoiceEvent, getDayEndEvent } from '../game/data/events'
import { useGameStore } from './gameStore'

export interface EventSaveData {
  eventQueue: GameEvent[]
  currentEvent: GameEvent | null
  eventHistory: GameEvent[]
  eventResultMessage: string | null
}

export const useEventStore = defineStore('event', () => {
  const gameStore = useGameStore()
  const eventQueue = ref<GameEvent[]>([])
  const currentEvent = ref<GameEvent | null>(null)
  const eventHistory = ref<GameEvent[]>([])
  const eventResultMessage = ref<string | null>(null)

  const hasEvent = computed(() => currentEvent.value !== null)
  const isIntroEvent = computed(() => {
    return currentEvent.value?.id.startsWith('intro-')
  })

  function queueEvent(event: GameEvent) {
    eventQueue.value.push(event)
    if (!currentEvent.value) {
      nextEvent()
    }
  }

  function queueIntroEvents() {
    narrativeEvents.forEach(event => {
      queueEvent({ ...event })
    })
  }

  function nextEvent() {
    if (eventQueue.value.length > 0) {
      currentEvent.value = eventQueue.value.shift()!
      eventResultMessage.value = null
    } else {
      currentEvent.value = null
    }
  }

  function dismissEvent() {
    if (currentEvent.value) {
      eventHistory.value.push(currentEvent.value)
    }
    nextEvent()
  }

  function makeChoice(choiceId: string) {
    if (!currentEvent.value?.choices) return

    const choice = currentEvent.value.choices.find(c => c.id === choiceId)
    if (!choice) return

    const effects: string[] = []

    if (choice.effect.money) {
      gameStore.addMoney(choice.effect.money)
      effects.push(choice.effect.money > 0 ? `金钱 +${choice.effect.money}` : `金钱 ${choice.effect.money}`)
    }
    if (choice.effect.reputation) {
      gameStore.addReputation(choice.effect.reputation)
      effects.push(choice.effect.reputation > 0 ? `声望 +${choice.effect.reputation}` : `声望 ${choice.effect.reputation}`)
    }
    if (choice.effect.sanity) {
      gameStore.addSanity(choice.effect.sanity)
      effects.push(choice.effect.sanity > 0 ? `理智 +${choice.effect.sanity}` : `理智 ${choice.effect.sanity}`)
    }

    eventResultMessage.value = effects.length > 0 ? effects.join('，') : '你做出了选择...'

    setTimeout(() => {
      dismissEvent()
    }, 2000)
  }

  function triggerRandomAnomaly() {
    if (Math.random() < 0.4) {
      queueEvent(getRandomAnomalyEvent())
      gameStore.addSanity(-5)
    }
  }

  function triggerRandomChoice() {
    if (Math.random() < 0.3) {
      queueEvent(getRandomChoiceEvent())
    }
  }

  function triggerDayEndEvent(day: number) {
    const event = getDayEndEvent(day)
    if (event) {
      queueEvent({ ...event })
    }
  }

  function triggerProcessingAnomaly() {
    if (Math.random() < 0.25) {
      queueEvent(getRandomAnomalyEvent())
      gameStore.addSanity(-3)
      return true
    }
    return false
  }

  function clearAllEvents() {
    eventQueue.value = []
    currentEvent.value = null
    eventResultMessage.value = null
  }

  function restoreFromSave(data: EventSaveData) {
    eventQueue.value = data.eventQueue.map(e => ({ ...e }))
    currentEvent.value = data.currentEvent ? { ...data.currentEvent } : null
    eventHistory.value = data.eventHistory.map(e => ({ ...e }))
    eventResultMessage.value = data.eventResultMessage
  }

  function hasPendingEvents() {
    return eventQueue.value.length > 0 || currentEvent.value !== null
  }

  return {
    eventQueue,
    currentEvent,
    eventHistory,
    eventResultMessage,
    hasEvent,
    isIntroEvent,
    queueEvent,
    queueIntroEvents,
    nextEvent,
    dismissEvent,
    makeChoice,
    triggerRandomAnomaly,
    triggerRandomChoice,
    triggerDayEndEvent,
    triggerProcessingAnomaly,
    clearAllEvents,
    restoreFromSave,
    hasPendingEvents
  }
})

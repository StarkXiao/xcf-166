export class AudioManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private ambientNodes: AudioNode[] = []
  private isInitialized = false
  private isMuted = false
  private volume = 0.3

  async init() {
    if (this.isInitialized) return
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = this.volume
      this.masterGain.connect(this.audioContext.destination)
      this.isInitialized = true
    } catch (e) {
      console.warn('Web Audio API not supported')
    }
  }

  private ensureInit() {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) {
      throw new Error('Audio not initialized')
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume
    }
  }

  mute() {
    this.isMuted = true
    if (this.masterGain) {
      this.masterGain.gain.value = 0
    }
  }

  unmute() {
    this.isMuted = false
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume
    }
  }

  toggleMute() {
    if (this.isMuted) {
      this.unmute()
    } else {
      this.mute()
    }
    return !this.isMuted
  }

  startAmbient() {
    if (!this.isInitialized || this.isMuted) return
    this.ensureInit()
    this.stopAmbient()

    const ctx = this.audioContext!
    const gain = this.masterGain!

    const lowOsc = ctx.createOscillator()
    lowOsc.type = 'sine'
    lowOsc.frequency.value = 40

    const lowGain = ctx.createGain()
    lowGain.gain.value = 0.15
    lowOsc.connect(lowGain)
    lowGain.connect(gain)
    lowOsc.start()
    this.ambientNodes.push(lowOsc)

    const midOsc = ctx.createOscillator()
    midOsc.type = 'triangle'
    midOsc.frequency.value = 80

    const midGain = ctx.createGain()
    midGain.gain.value = 0.08

    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.1

    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.03
    lfo.connect(lfoGain)
    lfoGain.connect(midGain.gain)

    midOsc.connect(midGain)
    midGain.connect(gain)
    midOsc.start()
    lfo.start()
    this.ambientNodes.push(midOsc, lfo)

    const highOsc = ctx.createOscillator()
    highOsc.type = 'sine'
    highOsc.frequency.value = 120

    const highGain = ctx.createGain()
    highGain.gain.value = 0.05
    highOsc.connect(highGain)
    highGain.connect(gain)
    highOsc.start()
    this.ambientNodes.push(highOsc)

    this.addNoise()
  }

  private addNoise() {
    const ctx = this.audioContext!
    const gain = this.masterGain!

    const bufferSize = 2 * ctx.sampleRate
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer
    noise.loop = true

    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.03

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 200

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(gain)
    noise.start()
    this.ambientNodes.push(noise)
  }

  stopAmbient() {
    this.ambientNodes.forEach(node => {
      try {
        if ('stop' in node) {
          (node as OscillatorNode | AudioBufferSourceNode).stop()
        }
        node.disconnect()
      } catch (e) {}
    })
    this.ambientNodes = []
  }

  playClick() {
    if (!this.isInitialized || this.isMuted) return
    this.ensureInit()

    const ctx = this.audioContext!
    const gain = this.masterGain!

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 800

    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(0.2, ctx.currentTime)
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

    osc.connect(oscGain)
    oscGain.connect(gain)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  }

  playSuccess() {
    if (!this.isInitialized || this.isMuted) return
    this.ensureInit()

    const ctx = this.audioContext!
    const gain = this.masterGain!

    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const oscGain = ctx.createGain()
      oscGain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15)
      oscGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.15 + 0.05)
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4)

      osc.connect(oscGain)
      oscGain.connect(gain)
      osc.start(ctx.currentTime + i * 0.15)
      osc.stop(ctx.currentTime + i * 0.15 + 0.4)
    })
  }

  playAnomaly() {
    if (!this.isInitialized || this.isMuted) return
    this.ensureInit()

    const ctx = this.audioContext!
    const gain = this.masterGain!

    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5)

    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(0, ctx.currentTime)
    oscGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.1)
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)

    osc.connect(oscGain)
    oscGain.connect(gain)
    osc.start()
    osc.stop(ctx.currentTime + 0.8)

    const noiseOsc = ctx.createOscillator()
    noiseOsc.type = 'square'
    noiseOsc.frequency.value = 2

    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.1
    noiseOsc.connect(noiseGain)
    noiseGain.connect(oscGain.gain)
    noiseOsc.start()
    noiseOsc.stop(ctx.currentTime + 0.8)
  }

  playHeartbeat() {
    if (!this.isInitialized || this.isMuted) return
    this.ensureInit()

    const ctx = this.audioContext!
    const gain = this.masterGain!

    const playBeat = (time: number) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(80, time)
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.15)

      const oscGain = ctx.createGain()
      oscGain.gain.setValueAtTime(0.3, time)
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)

      osc.connect(oscGain)
      oscGain.connect(gain)
      osc.start(time)
      osc.stop(time + 0.15)
    }

    playBeat(ctx.currentTime)
    playBeat(ctx.currentTime + 0.25)
  }

  playWhisper() {
    if (!this.isInitialized || this.isMuted) return
    this.ensureInit()

    const ctx = this.audioContext!
    const gain = this.masterGain!

    const bufferSize = ctx.sampleRate * 2
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5
    }

    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1000, ctx.currentTime)
    filter.frequency.linearRampToValueAtTime(500, ctx.currentTime + 2)
    filter.Q.value = 5

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0, ctx.currentTime)
    noiseGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.3)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2)

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(gain)
    noise.start()
    noise.stop(ctx.currentTime + 2)
  }

  playProcessing(type: 'clean' | 'repair' | 'purify' | 'store') {
    if (!this.isInitialized || this.isMuted) return
    this.ensureInit()

    const ctx = this.audioContext!
    const gain = this.masterGain!

    let freq = 200
    let typeVal: OscillatorType = 'sine'

    switch (type) {
      case 'clean':
        freq = 300
        typeVal = 'sine'
        break
      case 'repair':
        freq = 400
        typeVal = 'triangle'
        break
      case 'purify':
        freq = 600
        typeVal = 'sine'
        break
      case 'store':
        freq = 150
        typeVal = 'sine'
        break
    }

    const osc = ctx.createOscillator()
    osc.type = typeVal
    osc.frequency.value = freq

    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 3

    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 20
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    const oscGain = ctx.createGain()
    oscGain.gain.value = 0.1

    osc.connect(oscGain)
    oscGain.connect(gain)
    osc.start()
    lfo.start()

    return () => {
      try {
        osc.stop()
        lfo.stop()
        osc.disconnect()
        lfo.disconnect()
      } catch (e) {}
    }
  }

  destroy() {
    this.stopAmbient()
    if (this.audioContext) {
      this.audioContext.close()
    }
    this.isInitialized = false
  }
}

export const audioManager = new AudioManager()

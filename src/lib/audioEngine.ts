export class AudioEngine {
  private audioContext: AudioContext | null = null
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null
  private micGain: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private reverbGain: GainNode | null = null
  private harmonyChain: {
    input: GainNode
    chorus: BiquadFilterNode
    delay: DelayNode
    delayFeedback: GainNode
    output: GainNode
  } | null = null
  private dryGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private isRunning = false

  async start() {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)()

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })

      this.mediaStreamSource =
        this.audioContext.createMediaStreamSource(stream)

      // Create nodes
      this.micGain = this.audioContext.createGain()
      this.micGain.gain.value = 0.5 // Prevent clipping

      this.dryGain = this.audioContext.createGain()
      this.dryGain.gain.value = 0.6

      // Reverb setup
      this.reverb = this.audioContext.createConvolver()
      this.reverbGain = this.audioContext.createGain()
      this.reverbGain.gain.value = 0

      // Create impulse response for reverb
      this.createReverbImpulse()

      // Harmony/effect chain
      this.harmonyChain = this.createHarmonyChain()

      // Master output
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.4

      // Connect chain
      this.mediaStreamSource.connect(this.micGain)

      // Dry path
      this.micGain.connect(this.dryGain)
      this.dryGain.connect(this.masterGain)

      // Reverb path
      this.micGain.connect(this.reverb)
      this.reverb.connect(this.reverbGain)
      this.reverbGain.connect(this.masterGain)

      // Harmony path
      this.micGain.connect(this.harmonyChain.input)
      this.harmonyChain.output.connect(this.masterGain)

      // Output to speakers
      this.masterGain.connect(this.audioContext.destination)

      this.isRunning = true
    } catch (error) {
      console.error('Error starting audio:', error)
      throw error
    }
  }

  private createReverbImpulse() {
    if (!this.audioContext || !this.reverb) return

    const rate = this.audioContext.sampleRate
    const length = rate * 2 // 2 seconds of reverb
    const impulse = this.audioContext.createBuffer(2, length, rate)
    const left = impulse.getChannelData(0)
    const right = impulse.getChannelData(1)

    for (let i = 0; i < length; i++) {
      left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
      right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
    }

    this.reverb.buffer = impulse
  }

  private createHarmonyChain(): {
    input: GainNode
    chorus: BiquadFilterNode
    delay: DelayNode
    delayFeedback: GainNode
    output: GainNode
  } {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized')
    }

    const input = this.audioContext.createGain()
    input.gain.value = 0

    // Chorus effect using delay modulation
    const chorus = this.audioContext.createBiquadFilter()
    chorus.type = 'highshelf'
    chorus.frequency.value = 3000
    chorus.gain.value = 5

    // Delay for stereo doubling
    const delay = this.audioContext.createDelay(5)
    delay.delayTime.value = 0.025 // 25ms

    const delayFeedback = this.audioContext.createGain()
    delayFeedback.gain.value = 0.4

    const output = this.audioContext.createGain()
    output.gain.value = 0.3

    input.connect(chorus)
    chorus.connect(delay)
    delay.connect(delayFeedback)
    delayFeedback.connect(delay)
    delay.connect(output)

    return { input, chorus, delay, delayFeedback, output }
  }

  updateEffects(pinch: number, handHeight: number) {
    if (!this.isRunning || !this.audioContext) return

    // Update reverb based on pinch distance
    if (this.reverbGain) {
      this.reverbGain.gain.setTargetAtTime(
        pinch * 0.5,
        this.audioContext.currentTime,
        0.1
      )
    }

    // Update harmony/effect mix based on hand height
    if (this.harmonyChain) {
      this.harmonyChain.input.gain.setTargetAtTime(
        handHeight * 0.6,
        this.audioContext.currentTime,
        0.1
      )

      // Modulate chorus filter based on hand height
      this.harmonyChain.chorus.gain.setTargetAtTime(
        3 + handHeight * 7,
        this.audioContext.currentTime,
        0.1
      )
    }
  }

  getReverbAmount(): number {
    return this.reverbGain?.gain.value ?? 0
  }

  getHarmonyAmount(): number {
    return this.harmonyChain?.input.gain.value ?? 0
  }

  stop() {
    if (this.mediaStreamSource) {
      const stream = this.mediaStreamSource.mediaStream
      stream.getTracks().forEach((track) => track.stop())
    }

    if (this.audioContext) {
      this.audioContext.close()
    }

    this.isRunning = false
  }
}

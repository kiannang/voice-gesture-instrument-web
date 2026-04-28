import {
  FilesetResolver,
  HandLandmarker,
  NormalizedLandmark,
} from '@mediapipe/tasks-vision'

export interface HandLandmark {
  x: number
  y: number
  z?: number
  visibility?: number
  presence?: number
}

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null
  private video: HTMLVideoElement
  private canvas: HTMLCanvasElement
  private stream: MediaStream | null = null
  private isRunning = false

  constructor(video: HTMLVideoElement) {
    this.video = video
    this.canvas = document.createElement('canvas')
  }

  async initialize() {
    try {
      // Load MediaPipe Hand Landmarker
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
      )

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        numHands: 1,
        runningMode: 'VIDEO',
      })

      // Request webcam access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })

      this.video.srcObject = this.stream
      this.isRunning = true

      // Wait for video to load
      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play()
          resolve(null)
        }
      })

      // Set canvas size to match video
      this.canvas.width = this.video.videoWidth
      this.canvas.height = this.video.videoHeight
    } catch (error) {
      console.error('Error initializing hand tracker:', error)
      throw error
    }
  }

  async detect(): Promise<HandLandmark[] | null> {
    if (!this.handLandmarker || !this.isRunning || !this.video) {
      return null
    }

    try {
      // Create canvas context and draw video frame
      const ctx = this.canvas.getContext('2d')
      if (!ctx) return null

      ctx.drawImage(
        this.video,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      )

      // Detect hand landmarks
      const results = this.handLandmarker.detectForVideo(
        this.canvas,
        performance.now()
      )

      if (results.landmarks && results.landmarks.length > 0) {
        // Return only the first hand's landmarks
        return results.landmarks[0] as HandLandmark[]
      }

      return null
    } catch (error) {
      console.error('Error detecting hand:', error)
      return null
    }
  }

  stop() {
    this.isRunning = false
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
    }
  }

  getVideoElement(): HTMLVideoElement {
    return this.video
  }
}

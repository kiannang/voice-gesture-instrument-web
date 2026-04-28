import { useEffect, useRef, useState } from 'react'
import { HandTracker } from '../lib/handTracking'
import { AudioEngine } from '../lib/audioEngine'
import { GestureMapper } from '../lib/mappings'

interface InstrumentProps {
  onClose: () => void
}

interface GestureState {
  pinch: number
  handHeight: number
  handDetected: boolean
}

interface AudioState {
  micActive: boolean
  audioActive: boolean
  error: string | null
}

export default function Instrument({ onClose }: InstrumentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const handTrackerRef = useRef<HandTracker | null>(null)
  const audioEngineRef = useRef<AudioEngine | null>(null)
  const gestureMapperRef = useRef<GestureMapper | null>(null)

  const [gesture, setGesture] = useState<GestureState>({
    pinch: 0,
    handHeight: 0,
    handDetected: false,
  })

  const [audioState, setAudioState] = useState<AudioState>({
    micActive: false,
    audioActive: false,
    error: null,
  })

  const [fps, setFps] = useState(0)
  const fpsCounterRef = useRef({ count: 0, lastTime: Date.now() })

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize gesture mapper
        gestureMapperRef.current = new GestureMapper()

        // Initialize hand tracker
        handTrackerRef.current = new HandTracker(videoRef.current!)
        await handTrackerRef.current.initialize()

        // Initialize audio engine
        audioEngineRef.current = new AudioEngine()

        // Set up animation loop
        const animationLoop = async () => {
          if (!handTrackerRef.current || !canvasRef.current) {
            requestAnimationFrame(animationLoop)
            return
          }

          // Update hand tracking
          const landmarks = await handTrackerRef.current.detect()
          
          // Update gesture state
          if (landmarks && gestureMapperRef.current) {
            const newGesture = gestureMapperRef.current.updateGestures(landmarks)
            setGesture(newGesture)

            // Update audio effects based on gestures
            if (audioEngineRef.current) {
              audioEngineRef.current.updateEffects(newGesture.pinch, newGesture.handHeight)
            }
          }

          // Draw HUD
          drawHUD(
            canvasRef.current,
            landmarks,
            gesture,
            audioState,
            handTrackerRef.current
          )

          // Update FPS
          const now = Date.now()
          fpsCounterRef.current.count++
          if (now - fpsCounterRef.current.lastTime >= 1000) {
            setFps(fpsCounterRef.current.count)
            fpsCounterRef.current.count = 0
            fpsCounterRef.current.lastTime = now
          }

          requestAnimationFrame(animationLoop)
        }

        requestAnimationFrame(animationLoop)
      } catch (error) {
        console.error('Failed to initialize:', error)
        setAudioState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize',
        }))
      }
    }

    initialize()

    return () => {
      // Cleanup
      if (handTrackerRef.current) {
        handTrackerRef.current.stop()
      }
      if (audioEngineRef.current) {
        audioEngineRef.current.stop()
      }
    }
  }, [])

  const handleStartAudio = async () => {
    try {
      if (audioEngineRef.current) {
        await audioEngineRef.current.start()
        setAudioState((prev) => ({
          ...prev,
          micActive: true,
          audioActive: true,
          error: null,
        }))
      }
    } catch (error) {
      console.error('Failed to start audio:', error)
      setAudioState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Microphone permission denied',
      }))
    }
  }

  const handleStopAudio = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.stop()
    }
    setAudioState((prev) => ({
      ...prev,
      micActive: false,
      audioActive: false,
    }))
  }

  return (
    <div className="instrument-container">
      <div className="instrument-header">
        <h2>Voice Gesture Instrument</h2>
        <button className="btn btn-close" onClick={onClose}>
          ← Back
        </button>
      </div>

      {audioState.error && (
        <div className="error-banner">
          <strong>Error:</strong> {audioState.error}
        </div>
      )}

      <div className="warning-banner">
        <strong>⚠️ Recommended:</strong> Use headphones to avoid microphone feedback.
      </div>

      <div className="instrument-main">
        <div className="video-section">
          <div className="canvas-container">
            <video
              ref={videoRef}
              style={{ display: 'none' }}
              autoPlay
              playsInline
            />
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="hud-canvas"
            />
            <div className="hud-overlay">
              <div className="hud-panel left-panel">
                <div className="hud-text">VOICE // GESTURE // REAL-TIME</div>
                <div className="hud-text">
                  {gesture.handDetected ? '✓ HAND DETECTED' : '○ SEARCHING...'}
                </div>
                <div className="hud-text">
                  {audioState.audioActive ? '✓ MIC ACTIVE' : '○ MIC OFF'}
                </div>
                <div className="hud-text">FPS: {fps}</div>
              </div>

              <div className="hud-panel right-panel">
                <div className="hud-meter">
                  <span className="meter-label">PINCH</span>
                  <div className="meter-bar">
                    <div
                      className="meter-fill"
                      style={{ width: `${gesture.pinch * 100}%` }}
                    ></div>
                  </div>
                  <span className="meter-value">{gesture.pinch.toFixed(2)}</span>
                </div>

                <div className="hud-meter">
                  <span className="meter-label">HEIGHT</span>
                  <div className="meter-bar">
                    <div
                      className="meter-fill"
                      style={{ width: `${gesture.handHeight * 100}%` }}
                    ></div>
                  </div>
                  <span className="meter-value">{gesture.handHeight.toFixed(2)}</span>
                </div>

                <div className="hud-meter">
                  <span className="meter-label">REVERB</span>
                  <div className="meter-bar">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${(audioEngineRef.current?.getReverbAmount() ?? 0) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="hud-meter">
                  <span className="meter-label">HARMONY</span>
                  <div className="meter-bar">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${(audioEngineRef.current?.getHarmonyAmount() ?? 0) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="controls-section">
          <div className="controls-group">
            <h3>Audio Controls</h3>
            <div className="button-group">
              {!audioState.audioActive ? (
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleStartAudio}
                >
                  Start Microphone
                </button>
              ) : (
                <button
                  className="btn btn-danger btn-large"
                  onClick={handleStopAudio}
                >
                  Stop Microphone
                </button>
              )}
            </div>
          </div>

          <div className="controls-group">
            <h3>Gesture Controls</h3>
            <ul className="gesture-guide">
              <li>
                <strong>Pinch:</strong> Bring thumb and index finger together to increase reverb
              </li>
              <li>
                <strong>Hand Height:</strong> Raise your hand higher to increase harmony/effects blend
              </li>
            </ul>
          </div>

          <div className="controls-group">
            <h3>Status</h3>
            <div className="status-display">
              <p>
                <span className={`status-badge ${gesture.handDetected ? 'active' : ''}`}>
                  Hand: {gesture.handDetected ? 'DETECTED' : 'searching...'}
                </span>
              </p>
              <p>
                <span className={`status-badge ${audioState.audioActive ? 'active' : ''}`}>
                  Mic: {audioState.audioActive ? 'ACTIVE' : 'off'}
                </span>
              </p>
              <p>FPS: {fps}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function drawHUD(
  canvas: HTMLCanvasElement,
  landmarks: any,
  gesture: GestureState,
  audioState: AudioState,
  tracker: HandTracker
) {
  const ctx = canvas.getContext('2d')
  if (!ctx || !tracker) return

  // Clear canvas with semi-transparent black for trail effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw grid
  drawGrid(ctx, canvas)

  // Draw hand skeleton and landmarks
  if (landmarks) {
    drawHandSkeleton(ctx, landmarks, canvas)
    drawLandmarks(ctx, landmarks, canvas)
  }

  // Draw scanlines effect
  drawScanlines(ctx, canvas)
}

function drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.strokeStyle = 'rgba(0, 255, 150, 0.1)'
  ctx.lineWidth = 1

  const gridSize = 40
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }

  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }
}

function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: any,
  canvas: HTMLCanvasElement
) {
  // Connections between landmarks (hand skeleton)
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], // thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // index
    [0, 9], [9, 10], [10, 11], [11, 12], // middle
    [0, 13], [13, 14], [14, 15], [15, 16], // ring
    [0, 17], [17, 18], [18, 19], [19, 20], // pinky
    [5, 9], [9, 13], [13, 17], // palm
  ]

  ctx.strokeStyle = 'rgb(0, 255, 150)'
  ctx.lineWidth = 2

  connections.forEach(([start, end]) => {
    if (landmarks[start] && landmarks[end]) {
      const startLm = landmarks[start]
      const endLm = landmarks[end]

      ctx.beginPath()
      ctx.moveTo(startLm.x * canvas.width, startLm.y * canvas.height)
      ctx.lineTo(endLm.x * canvas.width, endLm.y * canvas.height)
      ctx.stroke()
    }
  })
}

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: any,
  canvas: HTMLCanvasElement
) {
  landmarks.forEach((landmark: any, idx: number) => {
    const x = landmark.x * canvas.width
    const y = landmark.y * canvas.height

    // Draw glow effect
    ctx.fillStyle = 'rgba(0, 255, 150, 0.3)'
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fill()

    // Draw main circle
    ctx.fillStyle = 'rgb(0, 255, 150)'
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()

    // Highlight fingertips with brighter glow
    if ([4, 8, 12, 16, 20].includes(idx)) {
      ctx.fillStyle = 'rgba(255, 100, 255, 0.5)'
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

function drawScanlines(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.strokeStyle = 'rgba(0, 255, 150, 0.03)'
  ctx.lineWidth = 1

  for (let y = 0; y < canvas.height; y += 2) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }
}

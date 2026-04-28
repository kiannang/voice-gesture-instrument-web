import { ReactNode } from 'react'

interface HeroProps {
  onStartInstrument: () => void
}

export default function Hero({ onStartInstrument }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">Voice Gesture Instrument</h1>
          <p className="hero-headline">Your voice, controlled by gesture.</p>
          <p className="hero-subheadline">
            Turn your webcam and microphone into a hands-free vocal effects instrument. Pinch to control 
            reverb, raise your hand to blend harmony/effects, and perform through a cyber-style live HUD.
          </p>

          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={onStartInstrument}>
              Start Instrument
            </button>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              View GitHub
            </a>
          </div>

          <div className="hero-badges">
            <span className="badge">✓ Works in browser</span>
            <span className="badge">✓ No upload required</span>
            <span className="badge">✓ Real-time audio</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="gradient-circle circle-1"></div>
          <div className="gradient-circle circle-2"></div>
          <div className="gradient-circle circle-3"></div>
        </div>
      </div>
    </section>
  )
}

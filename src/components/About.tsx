export default function About() {
  return (
    <section className="about">
      <div className="container">
        <h2 className="section-title">About This Project</h2>
        <div className="about-content">
          <p>
            Live vocal effects usually require touching a DAW, MIDI controller, or pedal. Reverbia
            makes voice effects <strong>physical</strong>, <strong>expressive</strong>, and <strong>hands-free</strong>.
          </p>
          <p>
            Imagine performing with your voice while controlling effects with your hand in the air. No wires, 
            no MIDI setup, no complicated menus—just you, your voice, and your gestures.
          </p>
          <p>
            This browser-based instrument runs entirely on your computer, processing audio through the Web Audio API 
            in real-time. Your voice never leaves your machine.
          </p>
        </div>
      </div>
    </section>
  )
}

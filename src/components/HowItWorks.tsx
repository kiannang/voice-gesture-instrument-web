export default function HowItWorks() {
  const features = [
    {
      title: 'Webcam Tracks One Hand',
      description: 'Real-time hand detection using MediaPipe. 21 landmarks give you precise gesture control.',
      icon: '🖐️',
    },
    {
      title: 'Pinch Controls Reverb',
      description: 'Bring thumb and index finger together to increase reverb amount. Open hand reduces reverb.',
      icon: '🎚️',
    },
    {
      title: 'Hand Height Controls Harmony/Effects',
      description: 'Raise your hand higher to blend in harmony and effects. Lower hand reduces the blend.',
      icon: '📈',
    },
    {
      title: 'Web Audio Processes Your Voice',
      description: 'Your audio is processed locally in the browser. No data sent anywhere. It\'s all happening real-time.',
      icon: '🔊',
    },
  ]

  return (
    <section className="how-it-works">
      <div className="container">
        <h2 className="section-title">How It Works</h2>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

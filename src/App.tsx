import { useState } from 'react'
import Hero from './components/Hero'
import Instrument from './components/Instrument'
import HowItWorks from './components/HowItWorks'
import About from './components/About'
import Footer from './components/Footer'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'instrument'>('home')

  return (
    <div className="app">
      {currentPage === 'home' ? (
        <>
          <Hero onStartInstrument={() => setCurrentPage('instrument')} />
          <HowItWorks />
          <About />
          <Footer />
        </>
      ) : (
        <Instrument onClose={() => setCurrentPage('home')} />
      )}
    </div>
  )
}

export default App

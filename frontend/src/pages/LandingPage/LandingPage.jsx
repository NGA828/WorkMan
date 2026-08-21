import { Footer } from '../../components/Footer'
import { Hero } from '../../components/Hero'
import { HowItWorks } from '../../components/HowItWorks'
import { Navbar } from '../../components/Navbar'
import { ServicesSection } from '../../components/ServicesSection'
import { TrustSection } from '../../components/TrustSection'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="site-shell">
      <Navbar />
      <main>
        <Hero />
        <ServicesSection />
        <HowItWorks />
        <TrustSection />
      </main>
      <Footer />
    </div>
  )
}

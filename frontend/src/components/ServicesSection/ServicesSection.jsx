import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './ServicesSection.css'

const SERVICES = [
  ['01', 'Plumbing', 'Leaks, repairs & installations', '⌁'],
  ['02', 'Electrical work', 'Safe fixes for every circuit', 'ϟ'],
  ['03', 'Carpentry', 'Furniture, fittings & more', '⌘'],
  ['04', 'Gas delivery', 'Reliable delivery to your door', '◌'],
  ['05', 'Laundry', 'Fresh clothes, less effort', '✦'],
  ['06', 'Other local services', 'Whatever your day needs', '✺'],
]

export default function ServicesSection() {
  const { user } = useAuth()
  const target = user ? '/dashboard/discover' : '/login'

  return (
    <section className="services-section" id="services">
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> WHAT DO YOU NEED?
          </div>
          <h2>
            One place for<br />
            <em>everyday</em> jobs.
          </h2>
        </div>
        <p>
          Whatever is on your list, there&apos;s a skilled person ready to help you check it off.
        </p>
      </div>

      <div className="service-grid">
        {SERVICES.map(([num, title, description, icon]) => (
          <Link to={target} className="service-card" key={title}>
            <span className="service-num">{num}</span>
            <span className="service-icon">{icon}</span>
            <h3>{title}</h3>
            <p>{description}</p>
            <span className="card-arrow">↗</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

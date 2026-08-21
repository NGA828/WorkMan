import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Hero.css'

function HeroVisual() {
  return (
    <div className="hero-visual" aria-label="A verified WorkMan professional ready to help">
      <div className="sun-shape" />
      <div className="grid-pattern" />
      <div className="person-card">
        <div className="avatar-illustration">
          <div className="hair" />
          <div className="face" />
          <div className="body" />
          <div className="tool" />
        </div>
      </div>
      <div className="status-pill">
        <span className="status-dot" />
        <span>
          <b>Available now</b>
          <small>Verified professional</small>
        </span>
      </div>
      <div className="rating-pill">
        <strong>4.9</strong>
        <span>★★★★★</span>
      </div>
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <span className="spark spark-one">✦</span>
      <span className="spark spark-two">✦</span>
    </div>
  )
}

export default function Hero() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [city, setCity] = useState('')

  const search = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (city.trim()) params.set('city', city.trim())
    const target = user ? `/dashboard/discover?${params.toString()}` : '/login'
    navigate(target)
  }

  return (
    <section className="hero" id="home">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="eyebrow-line" /> LOCAL HELP, DONE RIGHT
        </div>
        <h1>
          Good work is<br />
          <em>closer</em> than you think.
        </h1>
        <p>
          Find trusted local professionals for the jobs that matter — or join as a technician and
          turn your skills into steady work in your neighborhood.
        </p>

        <div className="hero-actions">
          <Link className="button button-lime" to={user ? '/dashboard/discover' : '/login'}>
            Find a professional <span>↗</span>
          </Link>
          <Link className="button button-dark hero-tech-cta" to={user ? '/dashboard' : '/register'}>
            Become a technician <span>↗</span>
          </Link>
        </div>

        <form className="hero-search" onSubmit={search}>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Enter your city — e.g. Douala"
            aria-label="City"
          />
          <button className="btn btn-dark" type="submit">
            Search <span>↗</span>
          </button>
        </form>

        <div className="hero-proof">
          <div className="proof-avatars">
            <span>AM</span>
            <span>JL</span>
            <span>SK</span>
          </div>
          <p>
            <b>12,000+</b> people found help
            <br />
            they can count on.
          </p>
        </div>
      </div>
      <HeroVisual />
    </section>
  )
}

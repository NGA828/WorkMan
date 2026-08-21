import { useCallback, useEffect, useState } from 'react'
import Icon from '../../components/Icon'
import { VerificationBadge } from '../../components/StatusBadge'
import {
  addProviderLocation,
  addProviderService,
  getCategories,
  getProfile,
  getProviderLocations,
  getProviderServices,
  getProviderWorkingHours,
  removeProviderLocation,
  removeProviderService,
  updateProfile,
  updateProviderWorkingHours,
} from '../../services/api'
import { DAY_NAMES, formatCurrency } from '../../utils/format'
import './dashboard-pages.css'

function SectionCard({ eyebrow, title, subtitle, children }) {
  return (
    <section className="card settings-card">
      <div>
        <span className="eyebrow">
          <span className="eyebrow-line" /> {eyebrow}
        </span>
        <h2 style={{ fontSize: 21, letterSpacing: '-0.03em', marginTop: 10 }}>{title}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 6 }}>{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

export default function ProviderProfileSetup() {
  const [profile, setProfile] = useState(null)
  const [basics, setBasics] = useState({ name: '', phone: '', bio: '', years_experience: '' })
  const [services, setServices] = useState([])
  const [locations, setLocations] = useState([])
  const [hours, setHours] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [serviceForm, setServiceForm] = useState({ service_category_id: '', name: '', starting_price: '' })
  const [locationForm, setLocationForm] = useState({ city: '', neighborhood: '' })

  const [basicsMsg, setBasicsMsg] = useState('')
  const [serviceMsg, setServiceMsg] = useState('')
  const [locationMsg, setLocationMsg] = useState('')
  const [hoursMsg, setHoursMsg] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [profileRes, servicesRes, locationsRes, hoursRes, categoriesRes] = await Promise.all([
        getProfile(),
        getProviderServices(),
        getProviderLocations(),
        getProviderWorkingHours(),
        getCategories(),
      ])

      const profileData = profileRes.data.profile || {}
      setProfile(profileData)
      setBasics({
        name: profileRes.data.user?.name || '',
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        years_experience: profileData.years_experience ?? '',
      })
      setServices(servicesRes.data.services || [])
      setLocations(locationsRes.data.locations || [])
      setHours(
        (hoursRes.data.working_hours || []).map((row) => ({
          ...row,
          starts_at: row.starts_at ? row.starts_at.slice(0, 5) : '',
          ends_at: row.ends_at ? row.ends_at.slice(0, 5) : '',
        }))
      )
      setCategories(categoriesRes.data.categories || [])
    } catch {
      setError('Unable to load your profile.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const saveBasics = async (event) => {
    event.preventDefault()
    setBasicsMsg('')
    try {
      await updateProfile({
        name: basics.name,
        phone: basics.phone,
        bio: basics.bio,
        years_experience: basics.years_experience === '' ? null : Number(basics.years_experience),
      })
      setBasicsMsg('Saved.')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save.')
    }
  }

  const addService = async (event) => {
    event.preventDefault()
    setServiceMsg('')
    try {
      await addProviderService({
        service_category_id: serviceForm.service_category_id,
        name: serviceForm.name,
        starting_price: serviceForm.starting_price || null,
      })
      setServiceForm({ service_category_id: '', name: '', starting_price: '' })
      const { data } = await getProviderServices()
      setServices(data.services || [])
      setServiceMsg('Service added.')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add the service.')
    }
  }

  const removeService = async (id) => {
    await removeProviderService(id).catch(() => {})
    setServices((list) => list.filter((service) => service.id !== id))
  }

  const addLocation = async (event) => {
    event.preventDefault()
    setLocationMsg('')
    try {
      await addProviderLocation(locationForm)
      setLocationForm({ city: '', neighborhood: '' })
      const { data } = await getProviderLocations()
      setLocations(data.locations || [])
      setLocationMsg('Service area added.')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add the service area.')
    }
  }

  const removeLocation = async (id) => {
    await removeProviderLocation(id).catch(() => {})
    setLocations((list) => list.filter((location) => location.id !== id))
  }

  const updateHour = (index, key, value) => {
    setHours((list) => list.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)))
  }

  const saveHours = async () => {
    setHoursMsg('')
    try {
      await updateProviderWorkingHours(
        hours.map((row) => ({
          day_of_week: row.day_of_week,
          starts_at: row.is_available ? row.starts_at || null : null,
          ends_at: row.is_available ? row.ends_at || null : null,
          is_available: Boolean(row.is_available),
        }))
      )
      setHoursMsg('Working hours saved. Clients can now book you only within these times.')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save working hours.')
    }
  }

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="availability-row">
        <div>
          <b>Verification status</b>
          <small>Only verified technicians appear in client search results.</small>
        </div>
        <VerificationBadge status={profile?.verification_status || 'pending'} />
      </div>

      {error && <div className="form-error">{error}</div>}

      <SectionCard
        eyebrow="BASICS"
        title="Personal information"
        subtitle="Who you are and how clients can reach you."
      >
        <form onSubmit={saveBasics} style={{ display: 'grid', gap: 14 }}>
          <div className="form-grid">
            <div className="field">
              <label>Full name</label>
              <input required value={basics.name} onChange={(event) => setBasics({ ...basics, name: event.target.value })} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={basics.phone} onChange={(event) => setBasics({ ...basics, phone: event.target.value })} />
            </div>
            <div className="field">
              <label>Years of experience</label>
              <input
                type="number"
                min="0"
                max="80"
                value={basics.years_experience}
                onChange={(event) => setBasics({ ...basics, years_experience: event.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Short bio</label>
            <textarea
              value={basics.bio}
              onChange={(event) => setBasics({ ...basics, bio: event.target.value })}
              placeholder="Tell clients about your experience and how you work…"
            />
          </div>
          {basicsMsg && <div className="success-message">{basicsMsg}</div>}
          <button className="btn btn-dark" style={{ justifySelf: 'start' }}>
            Save basics
          </button>
        </form>
      </SectionCard>

      <SectionCard
        eyebrow="SERVICES"
        title="Services you offer"
        subtitle="Each service appears on your public profile with its starting price."
      >
        <div style={{ display: 'grid', gap: 8 }}>
          {services.length === 0 && <p className="results-count">No services added yet.</p>}
          {services.map((service) => (
            <div className="service-row" key={service.id}>
              <div>
                <b>{service.name}</b>
                <small>{service.category?.name}</small>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {service.starting_price && <b>{formatCurrency(service.starting_price)}+</b>}
                <button className="fav-btn" onClick={() => removeService(service.id)} title="Remove service">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={addService} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          <div className="form-grid">
            <div className="field">
              <label>Category</label>
              <select
                required
                value={serviceForm.service_category_id}
                onChange={(event) => setServiceForm({ ...serviceForm, service_category_id: event.target.value })}
              >
                <option value="">Choose a category…</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Service name</label>
              <input
                required
                value={serviceForm.name}
                onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })}
                placeholder="e.g. Leak repair"
              />
            </div>
            <div className="field">
              <label>Starting price (FCFA)</label>
              <input
                type="number"
                min="0"
                value={serviceForm.starting_price}
                onChange={(event) => setServiceForm({ ...serviceForm, starting_price: event.target.value })}
                placeholder="e.g. 5000"
              />
            </div>
          </div>
          {serviceMsg && <div className="success-message">{serviceMsg}</div>}
          <button className="btn btn-dark" style={{ justifySelf: 'start' }}>
            <Icon name="plus" size={14} /> Add service
          </button>
        </form>
      </SectionCard>

      <SectionCard
        eyebrow="SERVICE AREAS"
        title="Where you work"
        subtitle="Clients filter technicians by city and neighborhood."
      >
        <div className="tech-card-services">
          {locations.length === 0 && <p className="results-count">No service areas yet.</p>}
          {locations.map((location) => (
            <span className="chip" key={location.id}>
              <Icon name="pin" size={12} />
              {location.city}
              {location.neighborhood ? ` — ${location.neighborhood}` : ''}
              <button onClick={() => removeLocation(location.id)} title="Remove area">
                <Icon name="x" size={12} />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={addLocation} style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <div className="form-grid">
            <div className="field">
              <label>City</label>
              <input
                required
                value={locationForm.city}
                onChange={(event) => setLocationForm({ ...locationForm, city: event.target.value })}
                placeholder="Douala"
              />
            </div>
            <div className="field">
              <label>Neighborhood (optional)</label>
              <input
                value={locationForm.neighborhood}
                onChange={(event) => setLocationForm({ ...locationForm, neighborhood: event.target.value })}
                placeholder="Akwa"
              />
            </div>
          </div>
          {locationMsg && <div className="success-message">{locationMsg}</div>}
          <button className="btn btn-dark" style={{ justifySelf: 'start' }}>
            <Icon name="plus" size={14} /> Add service area
          </button>
        </form>
      </SectionCard>

      <SectionCard
        eyebrow="WORKING HOURS"
        title="Your weekly schedule"
        subtitle="Clients can only book inside these times."
      >
        <div className="hours-editor">
          {hours.map((row, index) => (
            <div className="hours-editor-row" key={row.day_of_week}>
              <b>{DAY_NAMES[Number(row.day_of_week)]}</b>
              <button
                type="button"
                className={row.is_available ? 'switch on' : 'switch'}
                onClick={() => updateHour(index, 'is_available', !row.is_available)}
                aria-label={`Toggle ${DAY_NAMES[Number(row.day_of_week)]}`}
                role="switch"
                aria-checked={Boolean(row.is_available)}
              />
              {row.is_available && (
                <>
                  <input
                    type="time"
                    value={row.starts_at}
                    onChange={(event) => updateHour(index, 'starts_at', event.target.value)}
                    aria-label="Start time"
                  />
                  <span className="results-count">to</span>
                  <input
                    type="time"
                    value={row.ends_at}
                    onChange={(event) => updateHour(index, 'ends_at', event.target.value)}
                    aria-label="End time"
                  />
                </>
              )}
            </div>
          ))}
        </div>
        {hoursMsg && <div className="success-message">{hoursMsg}</div>}
        <button className="btn btn-dark" style={{ justifySelf: 'start' }} onClick={saveHours}>
          Save working hours
        </button>
      </SectionCard>
    </div>
  )
}

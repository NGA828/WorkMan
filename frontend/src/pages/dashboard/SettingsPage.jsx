import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getProfile, updateProfile } from '../../services/api'
import './dashboard-pages.css'

export default function SettingsPage() {
  const { user, refresh } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        setForm({
          name: data.user?.name || user?.name || '',
          phone: data.profile?.phone || '',
          address: data.profile?.address || '',
          city: data.profile?.city || '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await updateProfile(form)
      setMessage('Your information has been saved.')
      refresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save your information.')
    } finally {
      setSaving(false)
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
    <form className="card settings-card" onSubmit={submit}>
      <div>
        <span className="eyebrow">
          <span className="eyebrow-line" /> YOUR INFORMATION
        </span>
        <h2 style={{ fontSize: 24, letterSpacing: '-0.03em', marginTop: 10 }}>
          Personal <em>details.</em>
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 7 }}>
          This information helps technicians find and contact you.
        </p>
      </div>

      <div className="form-grid">
        <div className="field">
          <label>Full name</label>
          <input required value={form.name} onChange={update('name')} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={form.phone} onChange={update('phone')} placeholder="+237 6XX XXX XXX" />
        </div>
        <div className="field">
          <label>City</label>
          <input value={form.city} onChange={update('city')} placeholder="Douala" />
        </div>
        <div className="field">
          <label>Address</label>
          <input value={form.address} onChange={update('address')} placeholder="Street, neighborhood" />
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="form-error">{error}</div>}

      <button className="btn btn-dark" disabled={saving} style={{ justifySelf: 'start' }}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}

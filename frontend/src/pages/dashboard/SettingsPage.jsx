import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/useToast'
import {
  getApiErrorMessage,
  getProfile,
  updateProfile,
  uploadIdentityDocument,
} from '../../services/api'
import './dashboard-pages.css'

export default function SettingsPage() {
  const { user, refresh } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '' })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Identity Upload states
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploadErr, setUploadErr] = useState('')

  const loadProfile = useCallback(() => {
    getProfile()
      .then(({ data }) => {
        setProfile(data.profile)
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

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

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
      loadProfile()
      toast.success('Your information has been saved.')
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to save your information.'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUploadId = async (e) => {
    e.preventDefault()
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      const message = 'The identity document must be 5 MB or smaller.'
      setUploadErr(message)
      toast.error(message)
      return
    }
    setUploading(true)
    setUploadMsg('')
    setUploadErr('')
    
    const formData = new FormData()
    formData.append('document', file)

    try {
      const { data } = await uploadIdentityDocument(formData)
      setUploadMsg(data.message || 'ID uploaded successfully!')
      setFile(null)
      toast.success('ID uploaded successfully — your verification is now pending review.')
      loadProfile()
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to upload identity document.')
      setUploadErr(message)
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  const idStatus = profile?.id_document_status || 'unverified'
  const idStatusLabels = {
    unverified: { label: 'Unverified', class: 'badge-grey', text: 'Upload your National ID or Passport to verify your account.' },
    pending: { label: 'Pending Review', class: 'badge-gold', text: 'Your document is under review by our administration team.' },
    verified: { label: 'Verified ✓', class: 'badge-green', text: 'Your identity has been successfully verified.' }
  }
  const currentIdStatus = idStatusLabels[idStatus] || idStatusLabels.unverified

  return (
    <div style={{ display: 'grid', gap: 18 }}>
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

      <section className="card settings-card">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-line" /> IDENTITY VERIFICATION
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <h2 style={{ fontSize: 21, letterSpacing: '-0.03em', margin: 0 }}>
              Verify identity.
            </h2>
            <span className={`badge ${currentIdStatus.class}`}>{currentIdStatus.label}</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 7 }}>
            To protect WorkMan users, we require national identity verification.
          </p>
        </div>

        <div className="booking-notes" style={{ margin: '14px 0', background: 'var(--bg-soft)' }}>
          <p style={{ fontSize: 13 }}>{currentIdStatus.text}</p>
          {profile?.id_document_path && (
            <p style={{ fontSize: 12, marginTop: 6, color: 'var(--muted)' }}>
              Uploaded Document: <code>{profile.id_document_path.split('/').pop()}</code>
            </p>
          )}
        </div>

        {idStatus !== 'verified' && (
          <form onSubmit={handleUploadId} style={{ display: 'grid', gap: 14 }}>
            <div className="field">
              <label>National ID or Passport photo (JPG, PNG, PDF up to 5MB)</label>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} required />
            </div>

            {uploadMsg && <div className="success-message">{uploadMsg}</div>}
            {uploadErr && <div className="form-error">{uploadErr}</div>}

            <button className="btn btn-dark" disabled={uploading || !file} style={{ justifySelf: 'start' }}>
              {uploading ? 'Uploading…' : 'Upload ID document'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}

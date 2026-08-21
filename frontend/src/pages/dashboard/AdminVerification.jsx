import { useCallback, useEffect, useState } from 'react'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { VerificationBadge } from '../../components/StatusBadge'
import { getAdminTechnicians, verifyTechnician } from '../../services/api'
import './dashboard-pages.css'

const TABS = [
  ['', 'All'],
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
]

export default function AdminVerification() {
  const [technicians, setTechnicians] = useState([])
  const [tab, setTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminTechnicians()
      .then(({ data }) => setTechnicians(data.technicians?.data || []))
      .catch(() => setTechnicians([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const verify = async (id, status) => {
    setBusyId(id)
    try {
      await verifyTechnician(id, status)
      await load()
    } catch {
      // Keep current state.
    } finally {
      setBusyId(null)
    }
  }

  const visible = tab ? technicians.filter((item) => item.verification_status === tab) : technicians

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-line" /> IDENTITY & QUALITY
          </span>
          <h2>
            Review before <em>discovery.</em>
          </h2>
          <p>Check each technician&apos;s information before they become publicly available.</p>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(([value, label]) => (
          <button key={value} className={tab === value ? 'tab active' : 'tab'} onClick={() => setTab(value)}>
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="shield"
          title="Nothing to review"
          text="Technician applications will appear here for approval."
        />
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {visible.map((technician) => (
            <article className="card booking-card" key={technician.id}>
              <div className="booking-card-top">
                <Avatar name={technician.user?.name} size={44} />
                <div className="booking-card-meta">
                  <b>{technician.user?.name}</b>
                  <small>{technician.user?.email}</small>
                </div>
                <VerificationBadge status={technician.verification_status} />
              </div>

              <div className="booking-details">
                <span>
                  <Icon name="user" size={15} /> {technician.phone || 'No phone'}
                </span>
                <span>
                  <Icon name="clock" size={15} /> {technician.years_experience ?? '—'} yrs experience
                </span>
                <span>
                  <Icon name="pin" size={15} /> {technician.locations?.map((l) => l.city).join(', ') || 'No areas'}
                </span>
              </div>

              {technician.bio && <div className="booking-notes">{technician.bio}</div>}

              <div className="booking-actions">
                <button
                  className="btn btn-dark btn-sm"
                  disabled={busyId === technician.id || technician.verification_status === 'approved'}
                  onClick={() => verify(technician.id, 'approved')}
                >
                  <Icon name="check" size={14} /> Approve
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={busyId === technician.id || technician.verification_status === 'rejected'}
                  onClick={() => verify(technician.id, 'rejected')}
                >
                  Reject
                </button>
                {technician.verification_status === 'pending' && (
                  <span className="results-count" style={{ padding: 8 }}>
                    Pending review — not visible to clients.
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

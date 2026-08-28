import { useEffect, useState } from 'react'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { useToast } from '../../context/useToast'
import { getAdminReports, resolveReport } from '../../services/api'
import { formatDate } from '../../utils/format'
import './dashboard-pages.css'

export default function AdminReports() {
  const toast = useToast()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [notes, setNotes] = useState({})

  const load = () => {
    setLoading(true)
    getAdminReports()
      .then(({ data }) => setReports(data.reports?.data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleResolve = async (id) => {
    setBusyId(id)
    try {
      await resolveReport(id, {
        status: 'resolved',
        admin_notes: notes[id] || 'Resolved by admin',
      })
      toast.success('Report marked as resolved.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to resolve the report.')
    } finally {
      setBusyId(null)
    }
  }

  const handleNotesChange = (id, val) => {
    setNotes(prev => ({ ...prev, [id]: val }))
  }

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div>
      {reports.length === 0 ? (
        <EmptyState
          icon="bell"
          title="No reported issues"
          text="When users report problems or concerns on the platform, they will appear here."
        />
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {reports.map((report) => (
            <article className="card booking-card" key={report.id}>
              <div className="booking-card-top" style={{ alignItems: 'flex-start' }}>
                <div>
                  <span className="eyebrow" style={{ fontSize: 11 }}>
                    REPORT #{report.id} · {report.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <div style={{ marginTop: 6, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className="results-count" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="user" size={13} />
                      Reporter: <b>{report.reporter?.name}</b> ({report.reporter?.role})
                    </span>
                    {report.reported_user && (
                      <span className="results-count" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="wrench" size={13} />
                        Reported: <b>{report.reported_user?.name}</b> ({report.reported_user?.role})
                      </span>
                    )}
                  </div>
                </div>
                <span className={`badge ${report.status === 'resolved' ? 'badge-green' : 'badge-gold'}`}>
                  {report.status}
                </span>
              </div>

              <div className="booking-notes" style={{ margin: '12px 0 16px 0', padding: 12, background: 'var(--bg-soft)', borderRadius: 6 }}>
                <b>Description:</b>
                <p style={{ marginTop: 4, whiteSpace: 'pre-wrap', fontSize: 13.5 }}>{report.description}</p>
              </div>

              {report.status !== 'resolved' ? (
                <div style={{ display: 'grid', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div className="field">
                    <label>Admin resolution notes</label>
                    <textarea
                      placeholder="Explain how this issue was resolved..."
                      value={notes[report.id] || ''}
                      onChange={(e) => handleNotesChange(report.id, e.target.value)}
                      rows={2}
                    />
                  </div>
                  <button
                    className="btn btn-dark btn-sm"
                    style={{ justifySelf: 'start' }}
                    onClick={() => handleResolve(report.id)}
                    disabled={busyId === report.id}
                  >
                    {busyId === report.id ? 'Resolving...' : 'Mark as Resolved'}
                  </button>
                </div>
              ) : (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 12.5, color: 'var(--muted)' }}>
                  {report.admin_notes && (
                    <p style={{ marginBottom: 4 }}><b>Admin Notes:</b> {report.admin_notes}</p>
                  )}
                  <span>Resolved at {formatDate(report.resolved_at)}</span>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

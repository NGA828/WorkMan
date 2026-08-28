import { useState } from 'react'
import Modal from './Modal'
import { submitReport } from '../services/api'
import { useToast } from '../context/useToast'

const REPORT_TYPES = [
  ['inappropriate_behavior', 'Inappropriate behavior'],
  ['fake_profile', 'Fake or misleading profile'],
  ['payment_issue', 'Payment issue'],
  ['no_show', 'No-show at appointment'],
  ['safety_concern', 'Safety concern'],
  ['other', 'Other issue'],
]

/**
 * Lets a client or technician report a problem to the WorkMan administrators.
 * Reports appear on the admin "Reports & issues" page for moderation.
 */
export default function ReportIssueModal({ open, onClose, reportedUserId, bookingId }) {
  const toast = useToast()
  const [type, setType] = useState('inappropriate_behavior')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const reset = () => {
    setType('inappropriate_behavior')
    setDescription('')
    setError('')
    setDone(false)
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = async (event) => {
    event.preventDefault()
    if (description.trim().length < 10) {
      setError('Please add a few details (at least 10 characters) so we can investigate.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await submitReport({
        reported_user_id: reportedUserId || null,
        type,
        description: bookingId ? `[Booking #${bookingId}] ${description.trim()}` : description.trim(),
      })
      setDone(true)
      toast.success('Your report has been sent to the WorkMan team.')
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to submit the report. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title="Report an issue" onClose={close} width={440}>
      {done ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="success-message">
            Thank you — your report has been sent to the WorkMan team. We review every report and
            will follow up if needed.
          </div>
          <button className="btn btn-dark" onClick={close} style={{ justifySelf: 'start' }}>
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <p>
            Tell us what went wrong. Reports are confidential and help us keep WorkMan safe and
            trustworthy for everyone.
          </p>
          <div className="field">
            <label>Issue type</label>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              {REPORT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>What happened?</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the issue in as much detail as you can…"
              rows={4}
              maxLength={2000}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-dark" disabled={busy} style={{ justifySelf: 'start' }}>
            {busy ? 'Submitting…' : 'Submit report'}
          </button>
        </form>
      )}
    </Modal>
  )
}

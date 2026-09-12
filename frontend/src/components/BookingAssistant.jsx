import { useMemo, useState } from 'react'
import { formatCurrency } from '../utils/format'
import { diagnoseBookingImage } from '../services/api'

const QUESTIONS = [
  ['problem', 'What problem do you need help with?'],
  ['location', 'Which city and address should the technician visit?'],
  ['schedule', 'When would you like the visit?'],
  ['urgency', 'How urgent is this request?'],
]

const INITIAL_DRAFT = {
  problem: '',
  location: '',
  schedule: '',
  urgency: '',
  attachment: null,
}

function suggestService(problem, services) {
  const words = problem.toLowerCase().split(/\W+/).filter((word) => word.length > 2)
  return services
    .map((service) => {
      const text = `${service.name} ${service.category?.name || ''}`.toLowerCase()
      return { service, score: words.filter((word) => text.includes(word)).length }
    })
    .sort((left, right) => right.score - left.score)[0]?.service || services[0]
}

export default function BookingAssistant({ services, onApply, onClose }) {
  const [draft, setDraft] = useState(INITIAL_DRAFT)
  const [step, setStep] = useState(0)
  const [answer, setAnswer] = useState('')
  const [selectedService, setSelectedService] = useState(null)
  const [diagnosis, setDiagnosis] = useState(null)
  const [diagnosing, setDiagnosing] = useState(false)
  const [diagnosisError, setDiagnosisError] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I can help prepare your booking. What problem do you need help with?' },
  ])

  const currentQuestion = QUESTIONS[step]
  const suggestedService = useMemo(
    () => (draft.problem ? suggestService(draft.problem, services) : null),
    [draft.problem, services]
  )

  const submitAnswer = (event) => {
    event.preventDefault()
    if (!answer.trim()) return
    const [key] = currentQuestion
    const nextDraft = { ...draft, [key]: answer.trim() }
    setDraft(nextDraft)
    const nextQuestion = QUESTIONS[step + 1]
    setMessages((current) => [
      ...current,
      { from: 'user', text: answer.trim() },
      ...(nextQuestion
        ? [{ from: 'bot', text: nextQuestion[1] }]
        : [{ from: 'bot', text: 'Thanks. I have enough details to prepare your booking. You can add a photo or video below for AI analysis.' }]),
    ])
    setAnswer('')
    setStep((current) => current + 1)
  }

  const finish = () => {
    const service = selectedService || suggestedService
    onApply({
      serviceId: service?.id || '',
      serviceName: service?.name || '',
      serviceCity: draft.location.split(',')[0]?.trim() || '',
      serviceAddress: draft.location.split(',').slice(1).join(',').trim() || draft.location,
      scheduledAt: draft.schedule,
      notes: [
        `Problem: ${draft.problem}`,
        `Urgency: ${draft.urgency}`,
        diagnosis ? `AI triage (not a final diagnosis): ${diagnosis.summary}` : '',
        diagnosis?.questions?.length ? `Questions for technician: ${diagnosis.questions.join('; ')}` : '',
        draft.attachment ? `Attachment selected: ${draft.attachment.name}` : '',
      ].filter(Boolean).join('\n'),
      attachment: draft.attachment,
    })
    onClose()
  }

  const runDiagnosis = async () => {
    if (!draft.attachment || !draft.attachment.type.startsWith('image/')) {
      setDiagnosisError('AI diagnosis currently supports image files. You can still attach a video to the booking.')
      return
    }
    setDiagnosing(true)
    setDiagnosisError('')
    setMessages((current) => [...current, { from: 'user', text: `Uploaded ${draft.attachment.name}` }, { from: 'bot', text: 'I am analyzing the image with the WorkMan vision assistant…' }])
    try {
      const { data } = await diagnoseBookingImage(draft.attachment, draft.problem)
      setDiagnosis(data.diagnosis)
      setMessages((current) => [
        ...current,
        { from: 'bot', text: `${data.diagnosis.category} is the closest service category. ${data.diagnosis.summary}` },
      ])
    } catch (error) {
      setDiagnosisError(error.response?.data?.message || 'AI diagnosis could not be completed.')
      setMessages((current) => [...current, { from: 'bot', text: 'I could not complete the image analysis. You can still continue with the booking.' }])
    } finally {
      setDiagnosing(false)
    }
  }

  if (step < QUESTIONS.length) {
    return (
      <div className="booking-assistant">
        <div className="assistant-intro">
          <b>WorkMan AI booking assistant</b>
          <span>Chat with me to prepare your booking.</span>
        </div>
        <div className="assistant-chat" aria-live="polite">
          {messages.map((message, index) => (
            <div className={`assistant-message ${message.from}`} key={`${message.from}-${index}`}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="assistant-progress">Question {step + 1} of {QUESTIONS.length}</div>
        <form onSubmit={submitAnswer} className="assistant-form">
          {currentQuestion[0] === 'schedule' ? (
            <input
              required
              type="datetime-local"
              min={new Date().toISOString().slice(0, 16)}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              aria-label={currentQuestion[1]}
            />
          ) : (
            <input
              required
              autoFocus
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder={currentQuestion[0] === 'location' ? 'City, street, building or landmark' : 'Type your answer'}
            />
          )}
          <button className="btn btn-dark">Send</button>
        </form>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
      </div>
    )
  }

  const service = selectedService || suggestedService
  return (
    <div className="booking-assistant">
      <div className="assistant-intro">
        <b>Review your booking with WorkMan AI</b>
        <span>The assistant only provides guidance. A qualified technician confirms the problem.</span>
      </div>
      <div className="assistant-chat" aria-live="polite">
        {messages.map((message, index) => (
          <div className={`assistant-message ${message.from}`} key={`${message.from}-${index}`}>
            {message.text}
          </div>
        ))}
      </div>
      <div className="assistant-summary">
        <b>Problem</b><span>{draft.problem}</span>
        <b>Location</b><span>{draft.location}</span>
        <b>Requested time</b><span>{draft.schedule.replace('T', ' ')}</span>
        <b>Urgency</b><span>{draft.urgency}</span>
      </div>
      <div className="field">
        <label>Suggested service</label>
        <select
          value={service?.id || ''}
          onChange={(event) => setSelectedService(services.find((item) => String(item.id) === event.target.value))}
        >
          {services.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}{item.starting_price ? ` — from ${formatCurrency(item.starting_price)}` : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Photo or video (optional)</label>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(event) => setDraft({ ...draft, attachment: event.target.files?.[0] || null })}
        />
      </div>
      {draft.attachment && (
        <div className="assistant-ai-panel">
          <button type="button" className="btn btn-outline btn-sm" onClick={runDiagnosis} disabled={diagnosing}>
            {diagnosing ? 'Analyzing image…' : 'Analyze image with AI'}
          </button>
          {diagnosisError && <div className="form-error">{diagnosisError}</div>}
          {diagnosis && (
            <div className="assistant-summary">
              <b>AI suggestion</b>
              <span>{diagnosis.category} ({diagnosis.confidence} confidence)</span>
              <b>What it sees</b>
              <span>{diagnosis.summary}</span>
              {diagnosis.observations?.length > 0 && <><b>Observations</b><span>{diagnosis.observations.join(' • ')}</span></>}
              {diagnosis.questions?.length > 0 && <><b>Ask the technician</b><span>{diagnosis.questions.join(' • ')}</span></>}
              {diagnosis.safety_notes?.length > 0 && <><b>Safety</b><span>{diagnosis.safety_notes.join(' • ')}</span></>}
              <small>AI provides an approximate triage only. A qualified technician must confirm the problem.</small>
            </div>
          )}
        </div>
      )}
      <div className="assistant-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setStep(0)}>Start over</button>
        <button type="button" className="btn btn-lime" disabled={!service} onClick={finish}>Use this booking</button>
      </div>
    </div>
  )
}

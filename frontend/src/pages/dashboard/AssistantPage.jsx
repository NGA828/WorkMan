import AssistantChat from '../../components/assistant/AssistantChat'
import './dashboard-pages.css'

export default function AssistantPage() {
  return (
    <div className="assistant-page">
      <div className="page-head">
        <div>
          <span className="eyebrow"><span className="eyebrow-line" /> WORKMAN SUPPORT</span>
          <h2>Ask the assistant</h2>
          <p>Get quick answers without waiting for a technician or support agent.</p>
        </div>
      </div>
      <div className="assistant-workspace">
        <aside className="assistant-info-card">
          <span className="assistant-info-icon">✦</span>
          <h3>Your WorkMan helper</h3>
          <p>Ask about bookings, payments, availability, verification or anything you need help with.</p>
          <div className="assistant-info-list">
            <span><b>01</b> Get instant guidance</span>
            <span><b>02</b> Follow simple steps</span>
            <span><b>03</b> Contact a person when needed</span>
          </div>
        </aside>
        <AssistantChat variant="page" />
      </div>
    </div>
  )
}

import './TrustSection.css'

export default function TrustSection() {
  return (
    <section className="trust-section" id="about">
      <div className="trust-badge">✦</div>

      <div>
        <div className="eyebrow">
          <span className="eyebrow-line" /> THE WORKMAN PROMISE
        </div>
        <h2>
          People you can<br />
          <em>count on.</em>
        </h2>
      </div>

      <div className="trust-list">
        <div>
          <b>✓</b>
          <span>
            <strong>Verified professionals</strong>
            <small>Every technician is checked before they appear to clients.</small>
          </span>
        </div>
        <div>
          <b>◎</b>
          <span>
            <strong>Real reviews, real people</strong>
            <small>Honest feedback from your community, on every profile.</small>
          </span>
        </div>
        <div>
          <b>⌁</b>
          <span>
            <strong>Fair on both sides</strong>
            <small>Clients pay only the transport fee in-app; technicians get steady local work.</small>
          </span>
        </div>
      </div>
    </section>
  )
}

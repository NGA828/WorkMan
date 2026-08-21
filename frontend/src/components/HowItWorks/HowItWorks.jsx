import './HowItWorks.css'

const CLIENT_STEPS = [
  ['01', 'Search', 'Tell us the service and location you need.'],
  ['02', 'Choose a technician', 'Browse profiles, verification and reviews.'],
  ['03', 'Chat', 'Ask questions and discuss the job.'],
  ['04', 'Book', 'Choose a time that works for you both.'],
  ['05', 'Pay transport', 'Securely pay the transport fee through WorkMan.'],
  ['06', 'Receive & rate', 'Get the service, then share your experience.'],
]

const TECHNICIAN_STEPS = [
  ['01', 'Register', 'Create your account as a technician.'],
  ['02', 'Build your profile', 'Add services, service areas and working hours.'],
  ['03', 'Get verified', 'WorkMan checks your ID and profile information.'],
  ['04', 'Receive requests', 'Clients nearby send you booking requests.'],
  ['05', 'Do the job', 'Chat, travel, finish — then get paid and rated.'],
]

function StepList({ steps }) {
  return (
    <div className="steps">
      {steps.map(([num, title, text], index) => (
        <div className="step" key={num}>
          <div className="step-top">
            <span>{num}</span>
            <i>{index === 2 ? '✓' : '↗'}</i>
          </div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      ))}
    </div>
  )
}

export default function HowItWorks() {
  return (
    <section className="how-section" id="how-it-works">
      <div className="how-intro">
        <div className="eyebrow">
          <span className="eyebrow-line" /> SIMPLE BY DESIGN
        </div>
        <h2>
          Two sides,<br />
          one <em>trusted</em> place.
        </h2>
        <p>
          WorkMan works for both sides of the job: clients get verified help, technicians get
          steady work.
        </p>
      </div>

      <div className="how-columns">
        <div className="how-lane" id="for-clients">
          <div className="lane-head">
            <span className="lane-icon">⌂</span>
            <div>
              <b>For clients</b>
              <small>Find the right professional</small>
            </div>
          </div>
          <StepList steps={CLIENT_STEPS} />
        </div>

        <div className="how-lane" id="for-technicians">
          <div className="lane-head">
            <span className="lane-icon">⚒</span>
            <div>
              <b>For technicians</b>
              <small>Turn your skills into work</small>
            </div>
          </div>
          <StepList steps={TECHNICIAN_STEPS} />
        </div>
      </div>
    </section>
  )
}

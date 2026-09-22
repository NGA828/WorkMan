import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Icon from '../Icon'
import './AssistantChat.css'

const CLIENT_SUGGESTIONS = ['How do I book a technician?', 'Where is my booking?', 'How do I pay?']
const TECHNICIAN_SUGGESTIONS = ['How do I accept a job?', 'How do I update availability?', 'How do I get verified?']

function getReply(message, role) {
  const text = message.toLowerCase()

  if (role === 'provider') {
    if (text.includes('availability') || text.includes('available')) {
      return 'Use the availability switch on your Overview page. When it is on, clients can find and request you.'
    }
    if (text.includes('verif')) {
      return 'Complete your profile and upload a valid identity document. An administrator reviews it before your profile appears in search.'
    }
    if (text.includes('accept') || text.includes('job') || text.includes('request')) {
      return 'Open Job requests, review the client details, then accept or decline the request. Keep your availability updated so new requests reach you.'
    }
    if (text.includes('payment') || text.includes('pay') || text.includes('transport')) {
      return 'Agree the service details with the client in Messages. Any transport fee linked to a booking is shown in the booking details.'
    }
    return 'I can help with job requests, availability, verification and booking questions. Try one of the quick questions below.'
  }

  if (text.includes('book') || text.includes('technician') || text.includes('find')) {
    return 'Go to Find a technician, choose a verified professional, select a service and send a booking request. You can follow its status in My bookings.'
  }
  if (text.includes('where') || text.includes('track') || text.includes('status')) {
    return 'Open My bookings to see the latest status. Once a technician starts a job, Live tracking will be available when location sharing is enabled.'
  }
  if (text.includes('pay') || text.includes('payment') || text.includes('transport')) {
    return 'Payment options and any transport fee are shown in the booking details after your request is accepted. Never share your PIN or password in chat.'
  }
  if (text.includes('cancel')) {
    return 'Open My bookings, select the booking and choose the cancel option. If the job has already started, contact the technician from Messages first.'
  }
  return 'I can help you find a technician, create a booking, understand booking status and make your WorkMan account safer. Try a quick question below.'
}

export default function AssistantChat({ variant = 'floating' }) {
  const { user, isProvider } = useAuth()
  const role = isProvider ? 'provider' : 'client'
  const [open, setOpen] = useState(variant !== 'floating')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      from: 'assistant',
      text:
        role === 'provider'
          ? 'Hi! I can help with your job requests, availability and verification.'
          : 'Hi! I can help with simple bookings, tracking and account questions.',
    },
  ])
  const endRef = useRef(null)
  const suggestions = role === 'provider' ? TECHNICIAN_SUGGESTIONS : CLIENT_SUGGESTIONS

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = (text = message) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, from: 'user', text: trimmed },
      { id: `${Date.now()}-assistant`, from: 'assistant', text: getReply(trimmed, role) },
    ])
    setMessage('')
  }

  const title = role === 'provider' ? 'Technician assistant' : 'WorkMan assistant'

  if (!open) {
    return (
      <button className={`assistant-launcher assistant-launcher-${variant}`} onClick={() => setOpen(true)} aria-label={`Open ${title}`}>
        <Icon name="sparkle" size={19} />
        <span>{variant === 'sidebar' ? 'Ask assistant' : 'Need help?'}</span>
      </button>
    )
  }

  return (
    <section className={`assistant-chat assistant-chat-${variant}`} aria-label={title}>
      <div className="assistant-header">
        <div className="assistant-heading">
          <span className="assistant-avatar"><Icon name="sparkle" size={17} /></span>
          <div>
            <b>{title}</b>
            <small>Quick answers, always available</small>
          </div>
        </div>
        {variant !== 'page' && (
          <button className="assistant-close" onClick={() => setOpen(false)} aria-label="Close assistant">
            <Icon name="x" size={17} />
          </button>
        )}
      </div>

      <div className="assistant-messages">
        {messages.map((item) => (
          <div className={`assistant-message ${item.from}`} key={item.id}>{item.text}</div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="assistant-suggestions">
        {suggestions.map((suggestion) => (
          <button key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>
        ))}
      </div>

      <form className="assistant-form" onSubmit={(event) => { event.preventDefault(); send() }}>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={user?.name ? `Ask me anything, ${user.name.split(' ')[0]}` : 'Ask me anything'}
          aria-label="Message assistant"
        />
        <button type="submit" aria-label="Send message" disabled={!message.trim()}>
          <Icon name="arrowRight" size={17} />
        </button>
      </form>

      <p className="assistant-disclaimer">
        Need a person? <Link to="/dashboard/messages">Message support</Link>
      </p>
    </section>
  )
}

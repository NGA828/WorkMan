import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { useAuth } from '../../context/AuthContext'
import { getConversations, getMessages, sendMessage } from '../../services/api'
import { relativeTime } from '../../utils/format'
import './dashboard-pages.css'

export default function Messages() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const bodyRef = useRef(null)

  const otherName = useCallback(
    (conversation) => {
      if (!conversation) return ''
      if (user?.role === 'client') return conversation.technician?.user?.name || 'Technician'
      return conversation.client?.name || 'Client'
    },
    [user]
  )

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await getConversations()
      setConversations(data.conversations || [])
      setError('')
    } catch {
      setError('Unable to load conversations.')
    }
  }, [])

  const loadMessages = useCallback(async (conversationId) => {
    try {
      const { data } = await getMessages(conversationId)
      setMessages(data.messages || [])
    } catch {
      setMessages([])
    }
  }, [])

  const openConversation = useCallback(
    async (conversation) => {
      setActive(conversation)
      await loadMessages(conversation.id)
      bodyRef.current?.focus()
      loadConversations()
    },
    [loadMessages, loadConversations]
  )

  useEffect(() => {
    loadConversations().finally(() => setLoading(false))
  }, [loadConversations])

  useEffect(() => {
    const requested = Number(searchParams.get('conversation'))
    if (!requested) return undefined
    getConversations()
      .then(({ data }) => {
        const found = (data.conversations || []).find((item) => item.id === requested)
        if (found) openConversation(found)
      })
      .catch(() => {})
  }, [searchParams, openConversation])

  // Poll for new messages while a conversation is open.
  useEffect(() => {
    if (!active) return undefined
    const timer = setInterval(() => {
      loadMessages(active.id)
      loadConversations()
    }, 5000)
    return () => clearInterval(timer)
  }, [active, loadMessages, loadConversations])

  const send = async (event) => {
    event.preventDefault()
    const text = body.trim()
    if (!text || !active) return
    try {
      const { data } = await sendMessage(active.id, text)
      setMessages((list) => [...list, data.message])
      setBody('')
      loadConversations()
    } catch {
      // Keep the input so the message is not lost.
    }
  }

  return (
    <div>
      <div className="messages-shell">
        <aside className="conversation-list">
          <div className="conversation-list-head">Conversations</div>
          {conversations.length === 0 && !loading ? (
            <EmptyState
              icon="chat"
              title="No conversations yet"
              text="Start one from a technician's profile to discuss a job before booking."
            />
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={active?.id === conversation.id ? 'conversation-item active' : 'conversation-item'}
                onClick={() => openConversation(conversation)}
              >
                <Avatar name={otherName(conversation)} size={36} />
                <span className="conversation-item-meta">
                  <b>{otherName(conversation)}</b>
                  <small>{relativeTime(conversation.last_message_at || conversation.updated_at)}</small>
                </span>
                {conversation.unread_count > 0 && (
                  <span className="conversation-unread">{conversation.unread_count}</span>
                )}
              </button>
            ))
          )}
        </aside>

        <section className="thread-panel">
          {active ? (
            <>
              <div className="thread-head">
                <Avatar name={otherName(active)} size={38} />
                <div className="thread-head-meta">
                  <b>{otherName(active)}</b>
                  <small>WorkMan conversation</small>
                </div>
                {active.booking_id && (
                  <span className="badge badge-grey">Booking #{active.booking_id}</span>
                )}
              </div>

              <div className="thread-body">
                {messages.length === 0 && (
                  <p className="results-count" style={{ textAlign: 'center', marginTop: 30 }}>
                    Say hello — discuss the job and agree on the details.
                  </p>
                )}
                {messages.map((message) => {
                  const mine = message.sender_id === user?.id
                  return (
                    <div key={message.id} className={mine ? 'bubble mine' : 'bubble'}>
                      {message.body}
                      <small>{relativeTime(message.created_at)}</small>
                    </div>
                  )
                })}
              </div>

              <form className="thread-form" onSubmit={send}>
                <input
                  ref={bodyRef}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write a message…"
                  aria-label="Message"
                />
                <button className="btn btn-dark" disabled={!body.trim()}>
                  Send <Icon name="arrowRight" size={14} />
                </button>
              </form>
            </>
          ) : (
            <div className="page-loader" style={{ flex: 1 }}>
              <EmptyState
                icon="chat"
                title="Select a conversation"
                text="Choose a conversation on the left to read and send messages."
              />
            </div>
          )}
        </section>
      </div>
      {error && (
        <div className="form-error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}
    </div>
  )
}

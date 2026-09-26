import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/useToast'
import { getConversations, getMessages, getMessageAttachment, sendMessage } from '../../services/api'
import { relativeTime } from '../../utils/format'
import './dashboard-pages.css'

function MessageImage({ messageId, alt }) {
  const [src, setSrc] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let objectUrl = ''
    getMessageAttachment(messageId)
      .then(({ data }) => {
        if (!active) return
        objectUrl = URL.createObjectURL(data)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [messageId])

  if (failed) return <span className="message-image-error">Image unavailable.</span>
  if (!src) return <span className="message-image-loading">Loading image…</span>
  return <img className="message-image" src={src} alt={alt || 'Image attachment'} />
}

export default function Messages() {
  const { user } = useAuth()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const bodyRef = useRef(null)
  const imageInputRef = useRef(null)
  const activeConversationId = useRef(null)

  useEffect(() => {
    if (!image) {
      setImagePreview('')
      return undefined
    }

    const previewUrl = URL.createObjectURL(image)
    setImagePreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [image])

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
      activeConversationId.current = conversation.id
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
    if ((!text && !image) || !active || sending) return
    const conversationId = active.id
    setSending(true)
    try {
      const { data } = await sendMessage(conversationId, text, image)
      if (activeConversationId.current === conversationId) {
        setMessages((list) =>
          list.some((message) => message.id === data.message.id) ? list : [...list, data.message]
        )
      }
      setBody('')
      setImage(null)
      if (imageInputRef.current) imageInputRef.current.value = ''
      loadConversations()
    } catch (err) {
      const message = err.response?.data?.errors?.image?.[0]
        || err.response?.data?.message
        || 'Your message could not be sent. Please try again.'
      toast.error(message)
    } finally {
      setSending(false)
    }
  }

  const selectImage = (event) => {
    const selected = event.target.files?.[0] || null
    if (!selected) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      toast.error('Choose a JPG, PNG, or WebP image.')
      event.target.value = ''
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('Images must be 10 MB or smaller.')
      event.target.value = ''
      return
    }
    setImage(selected)
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
                disabled={sending}
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

        <section className={active ? 'thread-panel thread-open' : 'thread-panel'}>
          {active ? (
            <>
              <div className="thread-head">
                <button
                  type="button"
                  className="thread-back"
                  onClick={() => {
                    activeConversationId.current = null
                    setActive(null)
                  }}
                  disabled={sending}
                  aria-label="Back to conversations"
                >
                  <Icon name="arrowLeft" size={16} />
                </button>
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
                      {message.body && <p>{message.body}</p>}
                      {message.attachment_url && (
                        <MessageImage messageId={message.id} alt="Conversation image attachment" />
                      )}
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
                <input
                  ref={imageInputRef}
                  className="message-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selectImage}
                  aria-label="Attach an image"
                />
                <button
                  type="button"
                  className="message-attach"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={sending}
                  aria-label="Attach an image"
                  title="Attach an image"
                >
                  <Icon name="plus" size={18} />
                </button>
                <button className="btn btn-dark" disabled={sending || (!body.trim() && !image)}>
                  {sending ? 'Sending…' : 'Send'} {!sending && <Icon name="arrowRight" size={14} />}
                </button>
              </form>
              {image && (
                <div className="thread-image-preview">
                  <img src={imagePreview} alt="Selected image preview" />
                  <span>{image.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null)
                      if (imageInputRef.current) imageInputRef.current.value = ''
                    }}
                    aria-label="Remove selected image"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              )}
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

import Icon from './Icon'

export default function EmptyState({ icon = 'sparkle', title, text, children }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon name={icon} size={22} />
      </div>
      {title && <h3>{title}</h3>}
      {text && <p>{text}</p>}
      {children}
    </div>
  )
}

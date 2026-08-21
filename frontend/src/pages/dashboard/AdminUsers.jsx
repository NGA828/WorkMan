import { useEffect, useState } from 'react'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import { getAdminUsers } from '../../services/api'
import { formatDate } from '../../utils/format'
import './dashboard-pages.css'

const ROLE_LABELS = {
  client: { label: 'Client', badge: 'badge-blue' },
  provider: { label: 'Technician', badge: 'badge-lime' },
  admin: { label: 'Administrator', badge: 'badge-dark' },
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminUsers()
      .then(({ data }) => setUsers(data.users?.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  if (users.length === 0) {
    return <EmptyState icon="users" title="No users yet" text="New users will appear here as they join." />
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const role = ROLE_LABELS[user.role] || ROLE_LABELS.client
            return (
              <tr key={user.id}>
                <td>
                  <span className="table-person">
                    <Avatar name={user.name} size={34} />
                    <span>
                      <b>{user.name}</b>
                      <small>{user.email}</small>
                    </span>
                  </span>
                </td>
                <td>
                  <span className={`badge ${role.badge}`}>{role.label}</span>
                </td>
                <td>{formatDate(user.created_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

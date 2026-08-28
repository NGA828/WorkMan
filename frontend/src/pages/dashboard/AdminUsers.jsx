import { useEffect, useState, useCallback } from 'react'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../context/useToast'
import { getAdminUsers, setUserStatus } from '../../services/api'
import { formatDate } from '../../utils/format'
import './dashboard-pages.css'

const ROLE_LABELS = {
  client: { label: 'Client', badge: 'badge-blue' },
  provider: { label: 'Technician', badge: 'badge-lime' },
  admin: { label: 'Administrator', badge: 'badge-dark' },
}

const TABS = [
  ['', 'All'],
  ['client', 'Clients'],
  ['provider', 'Technicians'],
  ['admin', 'Administrators'],
]

export default function AdminUsers() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminUsers({
      role: roleFilter || undefined,
      q: searchQuery || undefined,
    })
      .then(({ data }) => setUsers(data.users?.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [roleFilter, searchQuery])

  useEffect(() => {
    const handler = setTimeout(() => {
      load()
    }, 300) // Debounce API requests
    return () => clearTimeout(handler)
  }, [load])

  const handleToggleStatus = async (user) => {
    setBusyId(user.id)
    const deactivating = user.is_active !== false
    try {
      await setUserStatus(user.id, !user.is_active)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      )
      toast.success(deactivating ? `${user.name} has been deactivated.` : `${user.name} has been reactivated.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className="field">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            aria-label="Search users"
          />
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map(([value, label]) => (
          <button
            key={value}
            className={roleFilter === value ? 'tab active' : 'tab'}
            onClick={() => setRoleFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && users.length === 0 ? (
        <div className="page-loader">
          <div className="spinner" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon="users"
          title="No users found"
          text="Try adjusting your filter or search query."
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const role = ROLE_LABELS[user.role] || ROLE_LABELS.client
                const isDeactivated = user.is_active === false
                return (
                  <tr key={user.id} style={{ opacity: isDeactivated ? 0.6 : 1 }}>
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
                    <td>
                      <span className={`badge ${isDeactivated ? 'badge-red' : 'badge-green'}`}>
                        {isDeactivated ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      {user.role !== 'admin' && (
                        <button
                          className={`btn btn-sm ${isDeactivated ? 'btn-outline' : 'btn-danger'}`}
                          disabled={busyId === user.id}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {busyId === user.id ? 'Updating...' : isDeactivated ? 'Reactivate' : 'Deactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


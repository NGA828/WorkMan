import { useCallback, useEffect, useState } from 'react'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { useToast } from '../../context/useToast'
import { createCategory, deleteCategory, getAdminCategories, updateCategory } from '../../services/api'
import './dashboard-pages.css'

export default function AdminCategories() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', description: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getAdminCategories()
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => setError('Unable to load categories.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const slugify = (name) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const add = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')
    try {
      await createCategory({
        name: form.name,
        slug: slugify(form.name),
        description: form.description || null,
      })
      setForm({ name: '', description: '' })
      setMessage('Category created.')
      toast.success(`“${form.name}” category created.`)
      await load()
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to create the category.'
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (category) => {
    try {
      const activating = !category.is_active
      await updateCategory(category.id, { is_active: activating })
      await load()
      toast.success(`“${category.name}” ${activating ? 'activated' : 'deactivated'}.`)
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to update the category.'
      setError(message)
      toast.error(message)
    }

  }

  const review = async (category, approval_status) => {
    try {
      await updateCategory(category.id, { approval_status })
      await load()
      toast.success(`Category ${approval_status === 'approved' ? 'approved' : 'rejected'}.`)
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to review the category.'
      setError(message)
      toast.error(message)
    }
  }

  const remove = async (id) => {
    setError('')
    try {
      await deleteCategory(id)
      await load()
      toast.info('Category deleted.')
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to delete the category.'
      setError(message)
      toast.error(message)
    }
  }

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-line" /> SERVICE DIRECTORY
          </span>
          <h2>
            What clients can <em>choose.</em>
          </h2>
          <p>Categories power the search filters on the client side.</p>
        </div>
      </div>

      <form className="card settings-card" onSubmit={add} style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <div className="field">
            <label>Category name</label>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Plumbing"
            />
          </div>
          <div className="field">
            <label>Description (optional)</label>
            <input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Leaks, repairs & installations"
            />
          </div>
        </div>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-dark" disabled={busy} style={{ justifySelf: 'start' }}>
          <Icon name="plus" size={14} /> {busy ? 'Creating…' : 'Create category'}
        </button>
      </form>

      {categories.length === 0 ? (
        <EmptyState icon="grid" title="No categories yet" text="Create the first service category to get started." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <b style={{ fontSize: 13 }}>{category.name}</b>
                    <div>
                      <small style={{ color: 'var(--muted)', fontSize: 11.5 }}>{category.description}</small>
                    </div>
                  </td>
                  <td>
                    <span className="chip">{category.slug}</span>
                  </td>
                  <td>
                    <span className={category.approval_status === 'pending' ? 'badge badge-gold' : category.is_active ? 'badge badge-green' : 'badge badge-grey'}>
                      {category.approval_status === 'pending' ? 'Pending review' : category.approval_status === 'rejected' ? 'Rejected' : category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {category.approval_status === 'pending' && (
                        <>
                          <button className="btn btn-dark btn-sm" onClick={() => review(category, 'approved')}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => review(category, 'rejected')}>Reject</button>
                        </>
                      )}
                      <button className="btn btn-outline btn-sm" onClick={() => toggle(category)}>
                        {category.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(category.id)}>
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

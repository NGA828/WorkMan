import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('workman_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('workman_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/* ------------------------------------------------------------------- health */
export const getHealth = () => api.get('/health')

/* --------------------------------------------------------------------- auth */
export const login = (credentials) => api.post('/auth/login', credentials)
export const register = (details) => api.post('/auth/register', details)
export const logout = () => api.post('/auth/logout')
export const getMe = () => api.get('/auth/me')

/* ------------------------------------------------------------------ profile */
export const getProfile = () => api.get('/profile')
export const updateProfile = (payload) => api.put('/profile', payload)

/* -------------------------------------------------------------- discovery */
export const getCategories = () => api.get('/categories')
export const getTechnicians = (params) => api.get('/technicians', { params })
export const getTechnician = (id) => api.get(`/technicians/${id}`)
export const getTechnicianReviews = (id, params) =>
  api.get(`/technicians/${id}/reviews`, { params })

export const getFavorites = () => api.get('/favorites')
export const addFavorite = (technicianId) =>
  api.post(`/technicians/${technicianId}/favorite`)
export const removeFavorite = (technicianId) =>
  api.delete(`/technicians/${technicianId}/favorite`)

/* ----------------------------------------------------------------- bookings */
export const getBookings = (params) => api.get('/bookings', { params })
export const getBooking = (id) => api.get(`/bookings/${id}`)
export const createBooking = (payload) => api.post('/bookings', payload)
export const updateBookingStatus = (id, payload) =>
  api.patch(`/bookings/${id}/status`, payload)
export const cancelBooking = (id) => api.post(`/bookings/${id}/cancel`)
export const confirmBooking = (id) => api.post(`/bookings/${id}/confirm`)

/* ------------------------------------------------------------------ payments */
export const getPayments = () => api.get('/payments')
export const createPayment = (bookingId, provider) =>
  api.post('/payments', { booking_id: bookingId, provider })
export const confirmPayment = (paymentId) =>
  api.post(`/payments/${paymentId}/confirm`)

/* ------------------------------------------------------------------ tracking */
export const getBookingLocation = (bookingId) =>
  api.get(`/bookings/${bookingId}/location`)
export const updateBookingLocation = (bookingId, coords) =>
  api.put(`/bookings/${bookingId}/location`, coords)

/* ---------------------------------------------------------------- messaging */
export const getConversations = () => api.get('/conversations')
export const createConversation = (technicianProfileId, bookingId = null) =>
  api.post('/conversations', {
    technician_profile_id: technicianProfileId,
    booking_id: bookingId,
  })
export const getMessages = (conversationId) =>
  api.get(`/conversations/${conversationId}/messages`)
export const sendMessage = (conversationId, body) =>
  api.post(`/conversations/${conversationId}/messages`, { body })

/* ------------------------------------------------------------- notifications */
export const getNotifications = () => api.get('/notifications')
export const markNotificationsRead = () => api.post('/notifications/read')

/* ---------------------------------------------------------------- provider */
export const getProviderServices = () => api.get('/provider/services')
export const addProviderService = (payload) => api.post('/provider/services', payload)
export const removeProviderService = (serviceId) =>
  api.delete(`/provider/services/${serviceId}`)

export const getProviderLocations = () => api.get('/provider/locations')
export const addProviderLocation = (payload) => api.post('/provider/locations', payload)
export const removeProviderLocation = (locationId) =>
  api.delete(`/provider/locations/${locationId}`)

export const getProviderWorkingHours = () => api.get('/provider/working-hours')
export const updateProviderWorkingHours = (workingHours) =>
  api.put('/provider/working-hours', { working_hours: workingHours })

export const setProviderAvailability = (isAvailable) =>
  api.patch('/provider/availability', { is_available: isAvailable })

/* -------------------------------------------------------------------- admin */
export const getAdminSummary = () => api.get('/admin/summary')
export const getAdminUsers = () => api.get('/admin/users')
export const getAdminTechnicians = (params) => api.get('/admin/technicians', { params })
export const verifyTechnician = (id, verificationStatus) =>
  api.patch(`/admin/technicians/${id}/verification`, {
    verification_status: verificationStatus,
  })
export const getAdminCategories = () => api.get('/admin/categories')
export const createCategory = (payload) => api.post('/admin/categories', payload)
export const updateCategory = (id, payload) => api.patch(`/admin/categories/${id}`, payload)
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`)
export const getAdminBookings = () => api.get('/admin/bookings')
export const getAdminReviews = () => api.get('/admin/reviews')
export const deleteReview = (id) => api.delete(`/admin/reviews/${id}`)

export default api

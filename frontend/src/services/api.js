import axios from 'axios'

const api = axios.create({baseURL: import.meta.env.VITE_API_BASE_URL || '/api', headers: {Accept: 'application/json', 'Content-Type': 'application/json'}})
api.interceptors.request.use((config) => { const token = localStorage.getItem('workman_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config })
export const getHealth = () => api.get('/health')
export const login = (credentials) => api.post('/auth/login', credentials)
export const register = (details) => api.post('/auth/register', details)
export const logout = () => api.post('/auth/logout')
export const getMe = () => api.get('/auth/me')
export default api

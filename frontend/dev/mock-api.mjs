/**
 * WorkMan mock API — a zero-dependency Node mirror of the Laravel backend.
 *
 * It implements the exact same `/api` contract as `backend/routes/api.php`
 * and seeds the same demo data as `backend/database/seeders/DatabaseSeeder.php`.
 * Run it when PHP is not available (e.g. a design sandbox):
 *
 *   node dev/mock-api.mjs          # serves http://127.0.0.1:8000/api
 *   node dev/mock-api.mjs --fresh  # ignore the saved state and reseed
 *
 * State is persisted to dev/.mock-state.json so data survives restarts.
 */

import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STATE_FILE = join(__dirname, '.mock-state.json')
const FRESH = process.argv.includes('--fresh')

const PORT = Number(process.env.MOCK_API_PORT || 8000)

/* ------------------------------------------------------------------- utils */

let seq = { user: 0, category: 0, technician: 0, service: 0, location: 0, hour: 0, booking: 0, payment: 0, conversation: 0, message: 0, notification: 0, clientProfile: 0 }

const nextId = (table) => (seq[table] += 1)
const now = () => new Date().toISOString()
const clone = (value) => JSON.parse(JSON.stringify(value))
const uuid = () => `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

function addDays(base, days, hours = 10, minutes = 0) {
  const date = new Date(base)
  date.setDate(date.getDate() + days)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

function paginate(list) {
  return { data: clone(list), total: list.length, current_page: 1, last_page: 1 }
}

function readJson(body) {
  try {
    return JSON.parse(body || '{}')
  } catch {
    return {}
  }
}

function send(res, status, payload) {
  const json = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  })
  res.end(json)
}

const fail = (res, status, message) => send(res, status, { message })

/* -------------------------------------------------------------------- seed */

function seed(db) {
  const password = 'password'

  const makeUser = (name, role, email) => {
    const id = nextId('user')
    db.users.push({ id, name, role, email, password, created_at: now(), updated_at: now() })
    return id
  }

  const makeTechnician = (name, email, bio, years, status, available, phone) => {
    const userId = makeUser(name, 'provider', email)
    const id = nextId('technician')
    db.technicians.push({
      id,
      user_id: userId,
      bio,
      years_experience: years,
      phone,
      avatar_path: null,
      verification_status: status,
      is_available: available,
      average_rating: 0,
      reviews_count: 0,
      created_at: now(),
      updated_at: now(),
    })
    return id
  }

  const makeService = (techId, categoryKey, name, description, price) => {
    const category = db.categories.find((item) => item.slug === categoryKey)
    const id = nextId('service')
    db.services.push({
      id,
      technician_profile_id: techId,
      service_category_id: category.id,
      name,
      description,
      starting_price: price,
      is_active: true,
      created_at: now(),
      updated_at: now(),
    })
    return id
  }

  const makeLocation = (techId, city, neighborhood, lat, lng) => {
    const id = nextId('location')
    db.locations.push({
      id,
      technician_profile_id: techId,
      city,
      neighborhood,
      latitude: String(lat),
      longitude: String(lng),
      created_at: now(),
      updated_at: now(),
    })
  }

  const makeHours = (techId, days) => {
    days.forEach(([day, starts, ends, available]) => {
      const id = nextId('hour')
      db.hours.push({
        id,
        technician_profile_id: techId,
        day_of_week: day,
        starts_at: starts ? `${starts}:00` : null,
        ends_at: ends ? `${ends}:00` : null,
        is_available: available,
        created_at: now(),
        updated_at: now(),
      })
    })
  }

  const makeBooking = (clientId, techId, serviceId, when, status, fee, paymentStatus, notes = 'Seeded demo booking.') => {
    const id = nextId('booking')
    db.bookings.push({
      id,
      client_id: clientId,
      technician_profile_id: techId,
      service_id: serviceId,
      scheduled_at: when,
      duration_minutes: 60,
      notes,
      transport_fee: fee,
      transport_payment_status: paymentStatus,
      status,
      created_at: when,
      updated_at: now(),
    })
    return id
  }

  const makeReview = (bookingId, clientId, techId, rating, body) => {
    db.reviews.push({
      id: db.reviews.length + 1,
      booking_id: bookingId,
      client_id: clientId,
      technician_profile_id: techId,
      rating,
      body,
      created_at: now(),
      updated_at: now(),
    })
  }

  const makeNotification = (userId, type, message) => {
    const id = nextId('notification')
    db.notifications.push({
      id,
      type,
      notifiable_type: 'user',
      notifiable_id: userId,
      data: { message },
      read_at: null,
      created_at: now(),
      updated_at: now(),
    })
  }

  const refreshRating = (techId) => {
    const tech = db.technicians.find((item) => item.id === techId)
    const reviews = db.reviews.filter((item) => item.technician_profile_id === techId)
    tech.average_rating = reviews.length
      ? Math.round((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length) * 100) / 100
      : 0
    tech.reviews_count = reviews.length
  }

  // Users
  const adminId = makeUser('Admin User', 'admin', 'admin@workman.local')
  const awaId = makeUser('Awa Diallo', 'client', 'client@workman.local')
  const jeanId = makeUser('Jean Mbarga', 'client', 'jean@workman.local')

  db.clientProfiles.push(
    { id: 1, user_id: awaId, phone: '+237 655 12 34 56', address: 'Rue Joffre, Akwa', city: 'Douala', avatar_path: null, created_at: now(), updated_at: now() },
    { id: 2, user_id: jeanId, phone: '+237 677 98 76 54', address: 'Boulevard de la Liberté', city: 'Douala', avatar_path: null, created_at: now(), updated_at: now() }
  )

  // Categories
  const categoryDefs = [
    ['plumbing', 'Plumbing', 'Leaks, repairs & installations'],
    ['electrical', 'Electrical work', 'Safe fixes for every circuit'],
    ['carpentry', 'Carpentry', 'Furniture, fittings & more'],
    ['gas', 'Gas delivery', 'Reliable delivery to your door'],
    ['laundry', 'Laundry', 'Fresh clothes, less effort'],
  ]
  categoryDefs.forEach(([slug, name, description]) => {
    db.categories.push({
      id: nextId('category'),
      name,
      slug,
      description,
      is_active: true,
      created_at: now(),
      updated_at: now(),
    })
  })

  // Technicians
  const michael = makeTechnician(
    'Michael Kone', 'michael@workman.local',
    'Plumber with 8 years of experience fixing leaks, installing pipes and renovating bathrooms across Douala.',
    8, 'approved', true, '+237 699 11 22 33'
  )
  const fatou = makeTechnician(
    'Fatou Ndiaye', 'fatou@workman.local',
    'Licensed electrician. Wiring, circuit repairs and safety checks for homes and small businesses.',
    6, 'approved', true, '+237 688 44 55 66'
  )
  const samuel = makeTechnician(
    'Samuel Bate', 'samuel@workman.local',
    'Carpenter specialised in custom furniture, fittings and wooden repairs. Based in Yaoundé.',
    10, 'approved', true, '+237 677 77 88 99'
  )
  makeTechnician(
    'Eric Talla', 'eric@workman.local',
    'Gas delivery and installation. Waiting for administrator verification.',
    3, 'pending', true, '+237 690 12 34 56'
  )

  const michaelLeak = makeService(michael, 'plumbing', 'Leak repair', 'Fixing leaking pipes, taps and joints.', 5000)
  makeService(michael, 'plumbing', 'Pipe installation', 'New pipe runs for kitchens and bathrooms.', 15000)
  const fatouCircuit = makeService(fatou, 'electrical', 'Circuit repair', 'Diagnosing and repairing electrical circuits.', 8000)
  const samuelFurniture = makeService(samuel, 'carpentry', 'Custom furniture', 'Made-to-measure furniture for your home.', 25000)
  makeService(4, 'gas', 'Gas bottle delivery', '12.5 kg gas bottles delivered to your door.', 7000)

  makeLocation(michael, 'Douala', 'Akwa', 4.0544, 9.6961)
  makeLocation(michael, 'Douala', 'Bonamoussadi', 4.0746, 9.6866)
  makeLocation(fatou, 'Douala', 'Bonapriso', 4.0286, 9.7053)
  makeLocation(fatou, 'Douala', 'Makepe', 4.0609, 9.7082)
  makeLocation(samuel, 'Yaoundé', 'Bastos', 3.887, 11.505)
  makeLocation(4, 'Douala', 'Ndokoti', 4.061, 9.716)

  makeHours(michael, [
    [0, null, null, false], [1, '08:00', '18:00', true], [2, '08:00', '18:00', true],
    [3, '08:00', '18:00', true], [4, '08:00', '18:00', true], [5, '08:00', '18:00', true], [6, '08:00', '14:00', true],
  ])
  makeHours(fatou, [
    [0, null, null, false], [1, '09:00', '17:00', true], [2, '09:00', '17:00', true],
    [3, '09:00', '17:00', true], [4, '09:00', '17:00', true], [5, '09:00', '17:00', true], [6, '09:00', '13:00', true],
  ])
  makeHours(samuel, [
    [0, null, null, false], [1, '08:00', '17:00', true], [2, '08:00', '17:00', true],
    [3, '08:00', '17:00', true], [4, '08:00', '17:00', true], [5, '08:00', '17:00', true], [6, null, null, false],
  ])
  makeHours(4, [
    [0, null, null, false], [1, '08:00', '18:00', true], [2, '08:00', '18:00', true],
    [3, '08:00', '18:00', true], [4, '08:00', '18:00', true], [5, '08:00', '18:00', true], [6, '08:00', '16:00', true],
  ])

  // Bookings covering every stage of the lifecycle.
  const base = new Date()
  const b1 = makeBooking(awaId, michael, michaelLeak, addDays(base, -6), 'completed', 1500, 'paid')
  const b2 = makeBooking(jeanId, michael, michaelLeak, addDays(base, -4, 14), 'completed', 1500, 'paid')
  const b3 = makeBooking(awaId, michael, michaelLeak, addDays(base, -2, 11), 'completed', 1500, 'paid')
  makeReview(b1, awaId, michael, 5, 'Very professional and arrived on time.')
  makeReview(b2, jeanId, michael, 5, 'Fixed the leak quickly. Highly recommend.')
  makeReview(b3, awaId, michael, 4, 'Good work, slightly later than agreed.')
  refreshRating(michael)

  const b4 = makeBooking(jeanId, fatou, fatouCircuit, addDays(base, -8, 9), 'completed', 1200, 'paid')
  makeReview(b4, jeanId, fatou, 5, 'Very careful with the wiring, everything works perfectly.')
  refreshRating(fatou)

  makeBooking(awaId, michael, michaelLeak, addDays(base, 1), 'pending', null, 'unpaid')
  makeBooking(awaId, fatou, fatouCircuit, addDays(base, 0, 15), 'accepted', 1500, 'unpaid')
  makeBooking(awaId, samuel, samuelFurniture, addDays(base, -1, 12), 'done', 2500, 'paid')

  const inProgress = makeBooking(jeanId, fatou, fatouCircuit, addDays(base, 0, 8), 'in_progress', 1500, 'paid')
  db.bookingLocations.push({
    id: 1,
    booking_id: inProgress,
    latitude: 4.042,
    longitude: 9.701,
    recorded_at: now(),
    created_at: now(),
    updated_at: now(),
  })
  db.payments.push({
    id: nextId('payment'),
    booking_id: inProgress,
    client_id: jeanId,
    reference: `WM-${Math.random().toString(36).slice(2, 14).toUpperCase()}`,
    amount: 1500,
    currency: 'XAF',
    purpose: 'transport_fee',
    status: 'paid',
    provider: 'mtn_momo',
    provider_transaction_id: `SIM-${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
    paid_at: now(),
    created_at: now(),
    updated_at: now(),
  })

  // Conversation with the "leaking pipe" example from the spec.
  const conversationId = nextId('conversation')
  db.conversations.push({
    id: conversationId,
    client_id: awaId,
    technician_profile_id: michael,
    booking_id: null,
    last_message_at: now(),
    created_at: now(),
    updated_at: now(),
  })
  db.messages.push(
    {
      id: nextId('message'),
      conversation_id: conversationId,
      sender_id: awaId,
      body: 'Hello, I have a leaking pipe. Are you available this afternoon?',
      read_at: now(),
      created_at: now(),
      updated_at: now(),
    },
    {
      id: nextId('message'),
      conversation_id: conversationId,
      sender_id: db.technicians.find((item) => item.id === michael).user_id,
      body: 'Yes, I can come around 3 PM. Transport is 1,500 FCFA from Akwa.',
      read_at: now(),
      created_at: now(),
      updated_at: now(),
    }
  )

  makeNotification(db.technicians.find((item) => item.id === michael).user_id, 'booking.requested', 'You have a new booking request from Awa Diallo.')
  makeNotification(awaId, 'booking.accepted', 'Your booking request was accepted.')
  makeNotification(awaId, 'booking.done', 'The technician marked the work as finished. Please confirm completion.')
  makeNotification(db.technicians.find((item) => item.id === michael).user_id, 'payment.paid', 'Transport fee received for a booking.')

  db.seq = seq
  db.initialized = true
}

function loadDb() {
  mkdirSync(__dirname, { recursive: true })
  if (!FRESH && existsSync(STATE_FILE)) {
    try {
      const db = JSON.parse(readFileSync(STATE_FILE, 'utf8'))
      if (db && db.initialized) {
        seq = db.seq
        return db
      }
    } catch {
      // Corrupt state — fall through to a fresh seed.
    }
  }

  const db = {
    users: [],
    clientProfiles: [],
    technicians: [],
    categories: [],
    services: [],
    locations: [],
    hours: [],
    bookings: [],
    bookingLocations: [],
    payments: [],
    reviews: [],
    favorites: [],
    conversations: [],
    messages: [],
    notifications: [],
    tokens: {},
  }
  seed(db)
  persist(db)
  return db
}

let saveTimer = null
function persist(db) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    writeFileSync(STATE_FILE, JSON.stringify(db, null, 2))
  }, 150)
}

const db = loadDb()

/* ------------------------------------------------------------------- shapes */

function userShape(user) {
  return { id: user.id, name: user.name, role: user.role, email: user.email }
}

function categoryShape(category) {
  return { id: category.id, name: category.name, slug: category.slug, description: category.description }
}

function serviceShape(service) {
  const category = db.categories.find((item) => item.id === service.service_category_id)
  return {
    id: service.id,
    service_category_id: service.service_category_id,
    name: service.name,
    description: service.description,
    starting_price: service.starting_price ? String(service.starting_price) : null,
    is_active: service.is_active,
    category: category ? categoryShape(category) : null,
  }
}

function technicianShape(tech, { withHours = false } = {}) {
  const user = db.users.find((item) => item.id === tech.user_id)
  return {
    id: tech.id,
    user: user ? { id: user.id, name: user.name } : null,
    bio: tech.bio,
    years_experience: tech.years_experience,
    phone: tech.phone,
    avatar_path: tech.avatar_path,
    verification_status: tech.verification_status,
    is_available: tech.is_available,
    average_rating: tech.average_rating,
    reviews_count: tech.reviews_count,
    services: db.services.filter((item) => item.technician_profile_id === tech.id).map(serviceShape),
    locations: db.locations.filter((item) => item.technician_profile_id === tech.id).map((item) => ({ ...item })),
    ...(withHours ? { working_hours: db.hours.filter((item) => item.technician_profile_id === tech.id) } : {}),
    created_at: tech.created_at,
  }
}

function bookingShape(booking) {
  const tech = db.technicians.find((item) => item.id === booking.technician_profile_id)
  const techUser = tech ? db.users.find((item) => item.id === tech.user_id) : null
  const client = db.users.find((item) => item.id === booking.client_id)
  const service = db.services.find((item) => item.id === booking.service_id)
  const review = db.reviews.find((item) => item.booking_id === booking.id)
  return {
    id: booking.id,
    client_id: booking.client_id,
    technician_profile_id: booking.technician_profile_id,
    service_id: booking.service_id,
    scheduled_at: booking.scheduled_at,
    duration_minutes: booking.duration_minutes,
    notes: booking.notes,
    transport_fee: booking.transport_fee === null ? null : String(booking.transport_fee),
    transport_payment_status: booking.transport_payment_status,
    status: booking.status,
    client: client ? { id: client.id, name: client.name } : null,
    technician: tech && techUser ? { id: tech.id, user: { id: techUser.id, name: techUser.name } } : null,
    service: service ? { id: service.id, name: service.name } : null,
    review: review ? { id: review.id, booking_id: review.booking_id, rating: review.rating, body: review.body } : null,
    created_at: booking.created_at,
  }
}

/* -------------------------------------------------------------------- auth */

function authUser(req) {
  const header = req.headers.authorization || ''
  const token = header.replace(/^Bearer\s+/i, '')
  const userId = token ? db.tokens[token] : null
  return userId ? db.users.find((item) => item.id === userId) : null
}

/* ----------------------------------------------------------------- routing */

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const path = url.pathname.replace(/^\/api/, '')

  if (req.method === 'OPTIONS') return send(res, 204, {})

  let body = ''
  req.on('data', (chunk) => {
    body += chunk
  })
  req.on('end', () => {
    const payload = readJson(body)
    const user = authUser(req)
    handle(path, url, req, res, payload)
    console.log(
      `[mock-api] ${req.method} ${path || '/'} -> ${res.statusCode}${user ? ` (user ${user.id}: ${user.email})` : ' (anonymous)'}`
    )
  })
})

function handle(path, url, req, res, payload) {
  const method = req.method
  const user = authUser(req)
  const userId = user?.id

  /* ---------------- public ---------------- */

  if (method === 'GET' && path === '/health') {
    return send(res, 200, { status: 'ok', timestamp: now() })
  }

  if (method === 'GET' && path === '/categories') {
    const categories = db.categories.filter((item) => item.is_active).sort((a, b) => a.name.localeCompare(b.name))
    return send(res, 200, { categories: categories.map(categoryShape) })
  }

  if (method === 'GET' && path === '/technicians') {
    let list = db.technicians.filter((item) => item.verification_status === 'approved')
    if (url.searchParams.get('q')) {
      const q = url.searchParams.get('q').toLowerCase()
      list = list.filter((item) => (db.users.find((u) => u.id === item.user_id)?.name || '').toLowerCase().includes(q))
    }
    if (url.searchParams.get('category')) {
      const category = Number(url.searchParams.get('category'))
      list = list.filter((item) => db.services.some((s) => s.technician_profile_id === item.id && s.service_category_id === category))
    }
    if (url.searchParams.get('city')) {
      const city = url.searchParams.get('city').toLowerCase()
      list = list.filter((item) => db.locations.some((l) => l.technician_profile_id === item.id && l.city.toLowerCase().includes(city)))
    }
    if (url.searchParams.get('min_rating')) {
      const min = Number(url.searchParams.get('min_rating'))
      list = list.filter((item) => item.average_rating >= min)
    }
    if (url.searchParams.get('available') === '1') {
      const today = new Date().getDay()
      list = list.filter((item) =>
        item.is_available && db.hours.some((h) => h.technician_profile_id === item.id && h.day_of_week === today && h.is_available)
      )
    }
    list.sort((a, b) => b.average_rating - a.average_rating)
    return send(res, 200, { technicians: paginate(list.map((item) => technicianShape(item))) })
  }

  const techMatch = path.match(/^\/technicians\/(\d+)$/)
  if (techMatch && method === 'GET') {
    const tech = db.technicians.find((item) => item.id === Number(techMatch[1]))
    if (!tech || tech.verification_status !== 'approved') return fail(res, 404, 'Not found.')
    return send(res, 200, { technician: technicianShape(tech, { withHours: true }) })
  }

  const techReviewsMatch = path.match(/^\/technicians\/(\d+)\/reviews$/)
  if (techReviewsMatch && method === 'GET') {
    const reviews = db.reviews
      .filter((item) => item.technician_profile_id === Number(techReviewsMatch[1]))
      .map((item) => ({
        ...item,
        client: userShape(db.users.find((u) => u.id === item.client_id)),
      }))
    return send(res, 200, { reviews: paginate(reviews) })
  }

  if (method === 'POST' && path === '/auth/register') {
    const data = payload
    const errors = {}
    if (!data.name) errors.name = 'The name field is required.'
    if (!['client', 'provider'].includes(data.role)) errors.role = 'The role field is required.'
    if (!data.email) errors.email = 'The email field is required.'
    if (db.users.some((item) => item.email === data.email)) errors.email = 'The email has already been taken.'
    if (!data.password || String(data.password).length < 8) errors.password = 'The password must be at least 8 characters.'
    if (data.password !== data.password_confirmation) errors.password = 'The password confirmation does not match.'
    if (Object.keys(errors).length) return fail(res, 422, { message: Object.values(errors)[0] })

    const id = nextId('user')
    const newUser = {
      id,
      name: data.name,
      role: data.role,
      email: data.email,
      password: data.password,
      created_at: now(),
      updated_at: now(),
    }
    db.users.push(newUser)

    if (data.role === 'provider') {
      const techId = nextId('technician')
      db.technicians.push({
        id: techId,
        user_id: id,
        bio: null,
        years_experience: null,
        phone: data.phone || null,
        avatar_path: null,
        verification_status: 'pending',
        is_available: true,
        average_rating: 0,
        reviews_count: 0,
        created_at: now(),
        updated_at: now(),
      })
    } else {
      db.clientProfiles.push({
        id: nextId('clientProfile'),
        user_id: id,
        phone: data.phone || null,
        address: null,
        city: data.city || null,
        avatar_path: null,
        created_at: now(),
        updated_at: now(),
      })
    }

    const token = uuid()
    db.tokens[token] = id
    persist(db)
    return send(res, 201, { user: userShape(newUser), token })
  }

  if (method === 'POST' && path === '/auth/login') {
    const found = db.users.find((item) => item.email === payload.email)
    if (!found || found.password !== payload.password) {
      return fail(res, 422, 'Those details do not match our records.')
    }
    const token = uuid()
    db.tokens[token] = found.id
    persist(db)
    return send(res, 200, { user: userShape(found), token })
  }

  /* ---------------- authenticated ---------------- */

  if (!user) return fail(res, 401, 'Unauthenticated.')

  if (method === 'GET' && path === '/auth/me') {
    return send(res, 200, { user: userShape(user) })
  }

  if (method === 'POST' && path === '/auth/logout') {
    Object.keys(db.tokens).forEach((token) => {
      if (db.tokens[token] === userId) delete db.tokens[token]
    })
    persist(db)
    return send(res, 200, { message: 'Signed out successfully.' })
  }

  if (method === 'GET' && path === '/profile') {
    const profile = user.role === 'provider'
      ? db.technicians.find((item) => item.user_id === userId) || null
      : db.clientProfiles.find((item) => item.user_id === userId) || null
    return send(res, 200, { user: userShape(user), profile })
  }

  if (method === 'PUT' && path === '/profile') {
    if (payload.name) user.name = payload.name
    if (user.role === 'provider') {
      const profile = db.technicians.find((item) => item.user_id === userId)
      if (profile) {
        if ('bio' in payload) profile.bio = payload.bio
        if ('years_experience' in payload) profile.years_experience = payload.years_experience
        if ('phone' in payload) profile.phone = payload.phone
        profile.updated_at = now()
      }
      persist(db)
      return send(res, 200, { user: userShape(user), profile })
    }
    const profile = db.clientProfiles.find((item) => item.user_id === userId)
    if (profile) {
      if ('phone' in payload) profile.phone = payload.phone
      if ('address' in payload) profile.address = payload.address
      if ('city' in payload) profile.city = payload.city
      profile.updated_at = now()
    }
    persist(db)
    return send(res, 200, { user: userShape(user), profile })
  }

  if (method === 'GET' && path === '/notifications') {
    const list = db.notifications
      .filter((item) => item.notifiable_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 30)
    return send(res, 200, { notifications: list, unread_count: list.filter((item) => !item.read_at).length })
  }

  if (method === 'POST' && path === '/notifications/read') {
    db.notifications.forEach((item) => {
      if (item.notifiable_id === userId && !item.read_at) item.read_at = now()
    })
    persist(db)
    return send(res, 200, { message: 'Notifications marked as read.' })
  }

  /* bookings (shared) */

  if (method === 'GET' && path === '/bookings') {
    let list = db.bookings.filter((booking) =>
      user.role === 'client'
        ? booking.client_id === userId
        : db.technicians.some((tech) => tech.id === booking.technician_profile_id && tech.user_id === userId)
    )
    const status = url.searchParams.get('status')
    if (status) list = list.filter((item) => item.status === status)
    list.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return send(res, 200, { bookings: paginate(list.map(bookingShape)) })
  }

  const bookingMatch = path.match(/^\/bookings\/(\d+)$/)
  if (bookingMatch && method === 'GET') {
    const booking = db.bookings.find((item) => item.id === Number(bookingMatch[1]))
    if (!booking) return fail(res, 404, 'Not found.')
    const isClient = booking.client_id === userId
    const isTech = db.technicians.some((tech) => tech.id === booking.technician_profile_id && tech.user_id === userId)
    if (!isClient && !isTech) return fail(res, 403, 'You are not authorized to access this resource.')
    return send(res, 200, { booking: bookingShape(booking) })
  }

  const locationMatch = path.match(/^\/bookings\/(\d+)\/location$/)
  if (locationMatch && method === 'GET') {
    const booking = db.bookings.find((item) => item.id === Number(locationMatch[1]))
    if (!booking) return fail(res, 404, 'Not found.')
    const isClient = booking.client_id === userId
    const isTech = db.technicians.some((tech) => tech.id === booking.technician_profile_id && tech.user_id === userId)
    if (!isClient && !isTech) return fail(res, 403, 'Forbidden.')
    return send(res, 200, { location: db.bookingLocations.find((item) => item.booking_id === booking.id) || null })
  }

  /* payments */

  if (method === 'GET' && path === '/payments') {
    const list = db.payments
      .filter((item) => item.client_id === userId)
      .map((item) => ({ ...item, booking: { id: item.booking_id } }))
    return send(res, 200, { payments: paginate(list) })
  }

  /* conversations */

  if (method === 'GET' && path === '/conversations') {
    const list = db.conversations.filter((conversation) => {
      if (user.role === 'client') return conversation.client_id === userId
      const tech = db.technicians.find((item) => item.id === conversation.technician_profile_id)
      return tech?.user_id === userId
    })
    list.sort((a, b) => (b.last_message_at || '').localeCompare(a.last_message_at || ''))
    const shaped = list.map((conversation) => {
      const client = db.users.find((item) => item.id === conversation.client_id)
      const tech = db.technicians.find((item) => item.id === conversation.technician_profile_id)
      const techUser = tech ? db.users.find((item) => item.id === tech.user_id) : null
      const unread = db.messages.filter(
        (message) =>
          message.conversation_id === conversation.id &&
          !message.read_at &&
          message.sender_id !== userId
      ).length
      return {
        ...conversation,
        client: client ? { id: client.id, name: client.name } : null,
        technician: tech && techUser ? { id: tech.id, user: { id: techUser.id, name: techUser.name } } : null,
        unread_count: unread,
      }
    })
    return send(res, 200, { conversations: shaped })
  }

  if (method === 'POST' && path === '/conversations') {
    const tech = db.technicians.find(
      (item) => item.id === Number(payload.technician_profile_id) && item.verification_status === 'approved'
    )
    if (!tech) return fail(res, 404, 'Not found.')
    let conversation = db.conversations.find(
      (item) =>
        item.client_id === userId &&
        item.technician_profile_id === tech.id &&
        (item.booking_id || null) === (payload.booking_id || null)
    )
    if (!conversation) {
      conversation = {
        id: nextId('conversation'),
        client_id: userId,
        technician_profile_id: tech.id,
        booking_id: payload.booking_id || null,
        last_message_at: null,
        created_at: now(),
        updated_at: now(),
      }
      db.conversations.push(conversation)
      persist(db)
    }
    return send(res, 201, { conversation })
  }

  const conversationMatch = path.match(/^\/conversations\/(\d+)\/messages$/)
  if (conversationMatch) {
    const conversation = db.conversations.find((item) => item.id === Number(conversationMatch[1]))
    if (!conversation) return fail(res, 404, 'Not found.')
    const isClient = conversation.client_id === userId
    const tech = db.technicians.find((item) => item.id === conversation.technician_profile_id)
    const isTech = tech?.user_id === userId
    if (!isClient && !isTech) return fail(res, 403, 'Forbidden.')

    if (method === 'GET') {
      db.messages.forEach((message) => {
        if (message.conversation_id === conversation.id && message.sender_id !== userId && !message.read_at) {
          message.read_at = now()
        }
      })
      persist(db)
      const messages = db.messages
        .filter((item) => item.conversation_id === conversation.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((item) => ({ ...item, sender: userShape(db.users.find((u) => u.id === item.sender_id)) }))
      return send(res, 200, { messages })
    }

    if (method === 'POST') {
      if (!payload.body) return fail(res, 422, 'The body field is required.')
      const message = {
        id: nextId('message'),
        conversation_id: conversation.id,
        sender_id: userId,
        body: payload.body,
        read_at: null,
        created_at: now(),
        updated_at: now(),
      }
      db.messages.push(message)
      conversation.last_message_at = message.created_at
      persist(db)
      return send(res, 201, { message: { ...message, sender: userShape(user) } })
    }
  }

  /* ---------------- client only ---------------- */

  if (user.role === 'client') {
    if (method === 'POST' && path === '/bookings') {
      const tech = db.technicians.find(
        (item) => item.id === Number(payload.technician_profile_id) && item.verification_status === 'approved'
      )
      if (!tech) return fail(res, 404, 'Not found.')
      if (!tech.is_available) return fail(res, 422, 'This technician is currently unavailable.')

      const when = new Date(payload.scheduled_at)
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        return fail(res, 422, 'The scheduled date must be a date after now.')
      }
      const duration = Number(payload.duration_minutes || 60)
      const hours = db.hours.find(
        (item) => item.technician_profile_id === tech.id && item.day_of_week === when.getDay() && item.is_available
      )
      const time = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}:00`
      const end = new Date(when.getTime() + duration * 60000)
      const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}:00`
      if (!hours || !hours.starts_at || !hours.ends_at || time < hours.starts_at || endTime > hours.ends_at) {
        return fail(res, 422, 'This technician is not available at that time.')
      }

      const conflict = db.bookings.some(
        (booking) =>
          booking.technician_profile_id === tech.id &&
          ['pending', 'accepted', 'in_progress'].includes(booking.status) &&
          Math.abs(new Date(booking.scheduled_at).getTime() - when.getTime()) < duration * 60000
      )
      if (conflict) return fail(res, 422, 'That time slot has already been requested.')

      const id = nextId('booking')
      const booking = {
        id,
        client_id: userId,
        technician_profile_id: tech.id,
        service_id: payload.service_id || null,
        scheduled_at: when.toISOString(),
        duration_minutes: duration,
        notes: payload.notes || null,
        transport_fee: null,
        transport_payment_status: 'unpaid',
        status: 'pending',
        created_at: now(),
        updated_at: now(),
      }
      db.bookings.push(booking)

      const notificationId = nextId('notification')
      db.notifications.push({
        id: notificationId,
        type: 'booking.requested',
        notifiable_type: 'user',
        notifiable_id: tech.user_id,
        data: { message: `You have a new booking request from ${user.name}.`, booking_id: id },
        read_at: null,
        created_at: now(),
        updated_at: now(),
      })
      persist(db)
      return send(res, 201, { booking: bookingShape(booking) })
    }

    const clientBookingMatch = path.match(/^\/bookings\/(\d+)\/(cancel|confirm)$/)
    if (clientBookingMatch && method === 'POST') {
      const booking = db.bookings.find((item) => item.id === Number(clientBookingMatch[1]))
      if (!booking || booking.client_id !== userId) return fail(res, 403, 'Forbidden.')
      const action = clientBookingMatch[2]

      if (action === 'cancel') {
        if (booking.status !== 'pending') return fail(res, 422, 'Only pending requests can be cancelled.')
        booking.status = 'cancelled'
        persist(db)
        return send(res, 200, { booking: bookingShape(booking) })
      }

      if (booking.status !== 'done') return fail(res, 422, 'Only finished work can be confirmed.')
      booking.status = 'completed'
      booking.updated_at = now()
      const tech = db.technicians.find((item) => item.id === booking.technician_profile_id)
      if (tech) {
        const notificationId = nextId('notification')
        db.notifications.push({
          id: notificationId,
          type: 'booking.completed',
          notifiable_type: 'user',
          notifiable_id: tech.user_id,
          data: { message: `${user.name} confirmed the job as completed.`, booking_id: booking.id },
          read_at: null,
          created_at: now(),
          updated_at: now(),
        })
      }
      persist(db)
      return send(res, 200, { booking: bookingShape(booking) })
    }

    if (method === 'POST' && path === '/payments') {
      const booking = db.bookings.find((item) => item.id === Number(payload.booking_id) && item.client_id === userId)
      if (!booking) return fail(res, 404, 'Not found.')
      if (!['accepted', 'in_progress', 'done'].includes(booking.status)) {
        return fail(res, 422, 'Transport can be paid once the technician has accepted the booking.')
      }
      if (!booking.transport_fee || Number(booking.transport_fee) <= 0) {
        return fail(res, 422, 'This booking does not have a transport fee yet.')
      }
      const existing = db.payments.find(
        (item) => item.booking_id === booking.id && ['pending', 'paid'].includes(item.status)
      )
      if (existing) return send(res, 200, { payment: existing })
      const payment = {
        id: nextId('payment'),
        booking_id: booking.id,
        client_id: userId,
        reference: `WM-${Math.random().toString(36).slice(2, 14).toUpperCase()}`,
        amount: Number(booking.transport_fee),
        currency: 'XAF',
        purpose: 'transport_fee',
        status: 'pending',
        provider: payload.provider || null,
        provider_transaction_id: null,
        paid_at: null,
        created_at: now(),
        updated_at: now(),
      }
      db.payments.push(payment)
      persist(db)
      return send(res, 201, { payment })
    }

    const paymentMatch = path.match(/^\/payments\/(\d+)\/confirm$/)
    if (paymentMatch && method === 'POST') {
      const payment = db.payments.find((item) => item.id === Number(paymentMatch[1]))
      if (!payment || payment.client_id !== userId) return fail(res, 403, 'Forbidden.')
      if (payment.status !== 'paid') {
        payment.status = 'paid'
        payment.paid_at = now()
        payment.provider_transaction_id = `SIM-${Math.random().toString(36).slice(2, 12).toUpperCase()}`
        const booking = db.bookings.find((item) => item.id === payment.booking_id)
        if (booking) booking.transport_payment_status = 'paid'
        const tech = booking && db.technicians.find((item) => item.id === booking.technician_profile_id)
        if (tech) {
          const notificationId = nextId('notification')
          db.notifications.push({
            id: notificationId,
            type: 'payment.paid',
            notifiable_type: 'user',
            notifiable_id: tech.user_id,
            data: { message: `Transport fee received for booking #${payment.booking_id}.`, booking_id: payment.booking_id },
            read_at: null,
            created_at: now(),
            updated_at: now(),
          })
        }
        persist(db)
      }
      return send(res, 200, { payment })
    }

    if (method === 'GET' && path === '/favorites') {
      const favorites = db.favorites.filter((item) => item.client_id === userId)
      const techs = favorites
        .map((item) => db.technicians.find((tech) => tech.id === item.technician_profile_id))
        .filter(Boolean)
        .map((tech) => technicianShape(tech))
      return send(res, 200, { technicians: techs })
    }

    const favMatch = path.match(/^\/technicians\/(\d+)\/favorite$/)
    if (favMatch) {
      const tech = db.technicians.find(
        (item) => item.id === Number(favMatch[1]) && item.verification_status === 'approved'
      )
      if (!tech) return fail(res, 404, 'Not found.')
      if (method === 'POST') {
        if (!db.favorites.some((item) => item.client_id === userId && item.technician_profile_id === tech.id)) {
          db.favorites.push({
            id: db.favorites.length + 1,
            client_id: userId,
            technician_profile_id: tech.id,
            created_at: now(),
            updated_at: now(),
          })
          persist(db)
        }
        return send(res, 201, { favorite: true })
      }
      if (method === 'DELETE') {
        db.favorites = db.favorites.filter(
          (item) => !(item.client_id === userId && item.technician_profile_id === tech.id)
        )
        persist(db)
        return send(res, 200, { favorite: false })
      }
    }

    if (method === 'POST' && path === '/reviews') {
      const booking = db.bookings.find((item) => item.id === Number(payload.booking_id) && item.client_id === userId)
      if (!booking) return fail(res, 404, 'Not found.')
      if (booking.status !== 'completed') return fail(res, 422, 'A review can be added after the booking is completed.')
      if (db.reviews.some((item) => item.booking_id === booking.id)) {
        return fail(res, 422, 'This booking has already been reviewed.')
      }
      const rating = Number(payload.rating)
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return fail(res, 422, 'The rating must be between 1 and 5.')
      }
      const review = {
        id: db.reviews.length + 1,
        booking_id: booking.id,
        client_id: userId,
        technician_profile_id: booking.technician_profile_id,
        rating,
        body: payload.body || null,
        created_at: now(),
        updated_at: now(),
      }
      db.reviews.push(review)
      refreshRatingFor(booking.technician_profile_id)
      persist(db)
      return send(res, 201, { review: { ...review, client: userShape(user) } })
    }
  }

  /* ---------------- provider only ---------------- */

  if (user.role === 'provider') {
    const tech = db.technicians.find((item) => item.user_id === userId)

    if (method === 'PATCH' && path === '/provider/availability') {
      if (tech) {
        tech.is_available = Boolean(payload.is_available)
        tech.updated_at = now()
        persist(db)
        return send(res, 200, { profile: tech })
      }
      return fail(res, 404, 'Profile not found.')
    }

    if (path === '/provider/services') {
      if (method === 'GET') {
        const services = tech ? db.services.filter((item) => item.technician_profile_id === tech.id) : []
        return send(res, 200, { services: services.map(serviceShape) })
      }
      if (method === 'POST') {
        if (!tech) return fail(res, 404, 'Profile not found.')
        const service = {
          id: nextId('service'),
          technician_profile_id: tech.id,
          service_category_id: Number(payload.service_category_id),
          name: payload.name,
          description: payload.description || null,
          starting_price: payload.starting_price ? Number(payload.starting_price) : null,
          is_active: true,
          created_at: now(),
          updated_at: now(),
        }
        db.services.push(service)
        persist(db)
        return send(res, 201, { service: serviceShape(service) })
      }
    }

    const serviceMatch = path.match(/^\/provider\/services\/(\d+)$/)
    if (serviceMatch && method === 'DELETE') {
      const service = db.services.find((item) => item.id === Number(serviceMatch[1]))
      if (!service || service.technician_profile_id !== tech?.id) return fail(res, 403, 'Forbidden.')
      db.services = db.services.filter((item) => item.id !== service.id)
      persist(db)
      return send(res, 200, { message: 'Service removed.' })
    }

    if (path === '/provider/locations') {
      if (method === 'GET') {
        const locations = tech ? db.locations.filter((item) => item.technician_profile_id === tech.id) : []
        return send(res, 200, { locations })
      }
      if (method === 'POST') {
        if (!tech) return fail(res, 404, 'Profile not found.')
        const duplicate = db.locations.some(
          (item) =>
            item.technician_profile_id === tech.id &&
            item.city === payload.city &&
            (item.neighborhood || null) === (payload.neighborhood || null)
        )
        if (duplicate) return fail(res, 422, 'That service area is already listed.')
        const location = {
          id: nextId('location'),
          technician_profile_id: tech.id,
          city: payload.city,
          neighborhood: payload.neighborhood || null,
          latitude: payload.latitude ? String(payload.latitude) : null,
          longitude: payload.longitude ? String(payload.longitude) : null,
          created_at: now(),
          updated_at: now(),
        }
        db.locations.push(location)
        persist(db)
        return send(res, 201, { location })
      }
    }

    const locationDeleteMatch = path.match(/^\/provider\/locations\/(\d+)$/)
    if (locationDeleteMatch && method === 'DELETE') {
      const location = db.locations.find((item) => item.id === Number(locationDeleteMatch[1]))
      if (!location || location.technician_profile_id !== tech?.id) return fail(res, 403, 'Forbidden.')
      db.locations = db.locations.filter((item) => item.id !== location.id)
      persist(db)
      return send(res, 200, { message: 'Service area removed.' })
    }

    if (method === 'GET' && path === '/provider/working-hours') {
      const existing = tech ? db.hours.filter((item) => item.technician_profile_id === tech.id) : []
      const workingHours = [0, 1, 2, 3, 4, 5, 6].map((day) => {
        const row = existing.find((item) => item.day_of_week === day)
        return {
          day_of_week: day,
          starts_at: row?.starts_at || null,
          ends_at: row?.ends_at || null,
          is_available: row ? row.is_available : day < 6,
        }
      })
      return send(res, 200, { working_hours: workingHours })
    }

    if (method === 'PUT' && path === '/provider/working-hours') {
      if (!tech) return fail(res, 404, 'Profile not found.')
      const rows = payload.working_hours || []
      if (rows.length !== 7) return fail(res, 422, 'The working hours field must contain 7 rows.')
      rows.forEach((row) => {
        const existing = db.hours.find(
          (item) => item.technician_profile_id === tech.id && item.day_of_week === row.day_of_week
        )
        const starts = row.is_available && row.starts_at ? `${row.starts_at}:00` : null
        const ends = row.is_available && row.ends_at ? `${row.ends_at}:00` : null
        if (existing) {
          existing.starts_at = starts
          existing.ends_at = ends
          existing.is_available = Boolean(row.is_available)
          existing.updated_at = now()
        } else {
          db.hours.push({
            id: nextId('hour'),
            technician_profile_id: tech.id,
            day_of_week: Number(row.day_of_week),
            starts_at: starts,
            ends_at: ends,
            is_available: Boolean(row.is_available),
            created_at: now(),
            updated_at: now(),
          })
        }
      })
      persist(db)
      return send(res, 200, { working_hours: db.hours.filter((item) => item.technician_profile_id === tech.id) })
    }

    const statusMatch = path.match(/^\/bookings\/(\d+)\/status$/)
    if (statusMatch && method === 'PATCH') {
      const booking = db.bookings.find((item) => item.id === Number(statusMatch[1]))
      if (!booking || booking.technician_profile_id !== tech?.id) return fail(res, 403, 'Forbidden.')
      const status = payload.status
      const allowed = {
        accepted: booking.status === 'pending',
        rejected: booking.status === 'pending',
        in_progress: booking.status === 'accepted',
        done: ['accepted', 'in_progress'].includes(booking.status),
      }
      if (!allowed[status]) return fail(res, 422, 'This booking cannot move to that status right now.')

      booking.status = status
      if ('transport_fee' in payload) booking.transport_fee = payload.transport_fee === null || payload.transport_fee === '' ? null : Number(payload.transport_fee)
      booking.updated_at = now()

      const messages = {
        accepted: 'Your booking request was accepted.',
        rejected: 'Your booking request was declined.',
        done: 'The technician marked the work as finished. Please confirm completion.',
      }
      if (messages[status]) {
        const notificationId = nextId('notification')
        db.notifications.push({
          id: notificationId,
          type: `booking.${status}`,
          notifiable_type: 'user',
          notifiable_id: booking.client_id,
          data: { message: messages[status], booking_id: booking.id },
          read_at: null,
          created_at: now(),
          updated_at: now(),
        })
      }
      persist(db)
      return send(res, 200, { booking: bookingShape(booking) })
    }

    if (locationMatch && method === 'PUT') {
      const booking = db.bookings.find((item) => item.id === Number(locationMatch[1]))
      if (!booking || booking.technician_profile_id !== tech?.id) return fail(res, 403, 'Forbidden.')
      if (!['accepted', 'in_progress'].includes(booking.status)) {
        return fail(res, 422, 'Location sharing is only available for accepted bookings.')
      }
      let location = db.bookingLocations.find((item) => item.booking_id === booking.id)
      if (location) {
        location.latitude = Number(payload.latitude)
        location.longitude = Number(payload.longitude)
        location.recorded_at = now()
        location.updated_at = now()
      } else {
        location = {
          id: db.bookingLocations.length + 1,
          booking_id: booking.id,
          latitude: Number(payload.latitude),
          longitude: Number(payload.longitude),
          recorded_at: now(),
          created_at: now(),
          updated_at: now(),
        }
        db.bookingLocations.push(location)
      }
      persist(db)
      return send(res, 200, { location })
    }
  }

  /* ---------------- admin only ---------------- */

  if (user.role === 'admin') {
    if (method === 'GET' && path === '/admin/summary') {
      return send(res, 200, {
        users: db.users.length,
        clients: db.users.filter((item) => item.role === 'client').length,
        technicians: db.users.filter((item) => item.role === 'provider').length,
        pending_verification: db.technicians.filter((item) => item.verification_status === 'pending').length,
        approved_technicians: db.technicians.filter((item) => item.verification_status === 'approved').length,
        categories: db.categories.filter((item) => item.is_active).length,
        bookings: db.bookings.length,
        reviews: db.reviews.length,
      })
    }

    if (method === 'GET' && path === '/admin/users') {
      const users = db.users
        .slice()
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((item) => ({ id: item.id, name: item.name, email: item.email, role: item.role, created_at: item.created_at }))
      return send(res, 200, { users: paginate(users) })
    }

    if (method === 'GET' && path === '/admin/technicians') {
      const techs = db.technicians
        .slice()
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((item) => ({
          ...clone(item),
          user: userShape(db.users.find((u) => u.id === item.user_id)),
          locations: db.locations.filter((l) => l.technician_profile_id === item.id),
        }))
      return send(res, 200, { technicians: paginate(techs) })
    }

    const verifyMatch = path.match(/^\/admin\/technicians\/(\d+)\/verification$/)
    if (verifyMatch && method === 'PATCH') {
      const tech = db.technicians.find((item) => item.id === Number(verifyMatch[1]))
      if (!tech) return fail(res, 404, 'Not found.')
      if (!['approved', 'rejected', 'pending'].includes(payload.verification_status)) {
        return fail(res, 422, 'The verification status is invalid.')
      }
      tech.verification_status = payload.verification_status
      tech.updated_at = now()
      persist(db)
      return send(res, 200, { technician: { ...clone(tech), user: userShape(db.users.find((u) => u.id === tech.user_id)) } })
    }

    if (method === 'GET' && path === '/admin/categories') {
      return send(res, 200, { categories: clone(db.categories) })
    }

    if (method === 'POST' && path === '/admin/categories') {
      if (db.categories.some((item) => item.name === payload.name || item.slug === payload.slug)) {
        return fail(res, 422, 'A category with that name or slug already exists.')
      }
      const category = {
        id: nextId('category'),
        name: payload.name,
        slug: payload.slug,
        description: payload.description || null,
        is_active: true,
        created_at: now(),
        updated_at: now(),
      }
      db.categories.push(category)
      persist(db)
      return send(res, 201, { category })
    }

    const categoryMatch = path.match(/^\/admin\/categories\/(\d+)$/)
    if (categoryMatch) {
      const category = db.categories.find((item) => item.id === Number(categoryMatch[1]))
      if (!category) return fail(res, 404, 'Not found.')
      if (method === 'PATCH') {
        if ('name' in payload) category.name = payload.name
        if ('description' in payload) category.description = payload.description
        if ('is_active' in payload) category.is_active = Boolean(payload.is_active)
        category.updated_at = now()
        persist(db)
        return send(res, 200, { category })
      }
      if (method === 'DELETE') {
        if (db.services.some((item) => item.service_category_id === category.id)) {
          return fail(res, 422, 'This category has services attached and cannot be deleted. Deactivate it instead.')
        }
        db.categories = db.categories.filter((item) => item.id !== category.id)
        persist(db)
        return send(res, 200, { message: 'Category deleted.' })
      }
    }

    if (method === 'GET' && path === '/admin/bookings') {
      const bookings = db.bookings
        .slice()
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(bookingShape)
      return send(res, 200, { bookings: paginate(bookings) })
    }

    if (method === 'GET' && path === '/admin/reviews') {
      const reviews = db.reviews
        .slice()
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((item) => ({
          ...item,
          client: userShape(db.users.find((u) => u.id === item.client_id)),
          technician: (() => {
            const tech = db.technicians.find((t) => t.id === item.technician_profile_id)
            const techUser = tech ? db.users.find((u) => u.id === tech.user_id) : null
            return tech && techUser ? { id: tech.id, user: { id: techUser.id, name: techUser.name } } : null
          })(),
        }))
      return send(res, 200, { reviews: paginate(reviews) })
    }

    const reviewDeleteMatch = path.match(/^\/admin\/reviews\/(\d+)$/)
    if (reviewDeleteMatch && method === 'DELETE') {
      const review = db.reviews.find((item) => item.id === Number(reviewDeleteMatch[1]))
      if (!review) return fail(res, 404, 'Not found.')
      db.reviews = db.reviews.filter((item) => item.id !== review.id)
      refreshRatingFor(review.technician_profile_id)
      persist(db)
      return send(res, 200, { message: 'Review removed.' })
    }
  }

  return fail(res, 404, 'Not found.')
}

function refreshRatingFor(techId) {
  const tech = db.technicians.find((item) => item.id === techId)
  if (!tech) return
  const reviews = db.reviews.filter((item) => item.technician_profile_id === techId)
  tech.average_rating = reviews.length
    ? Math.round((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length) * 100) / 100
    : 0
  tech.reviews_count = reviews.length
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mock-api] WorkMan mock API running on http://0.0.0.0:${PORT}/api`)
  console.log('[mock-api] Demo accounts (password: "password"):')
  console.log('  client@workman.local · michael@workman.local · fatou@workman.local · admin@workman.local')
})

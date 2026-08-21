# WorkMan — Frontend

React 19 + Vite SPA for WorkMan. All application actions live inside a role-based dashboard with sidebar navigation (Dribbble-style shell): clients, technicians and administrators each get their own workspace.

## Run it

### Option A — with the Laravel API (recommended)

1. Start the backend first (see `../backend/README.md`):

   ```bash
   cd ../backend && php artisan serve
   ```

2. Start the frontend:

   ```bash
   npm install
   npm run dev
   ```

Vite proxies `/api` to `http://127.0.0.1:8000`, so no CORS configuration is needed.

### Option B — preview without PHP (mock API)

A zero-dependency Node server implements the exact same `/api` contract with the same demo data:

```bash
node dev/mock-api.mjs          # API on http://127.0.0.1:8000/api
node dev/mock-api.mjs --fresh  # ignore saved state and reseed
npm run dev                    # frontend on :5173
```

State is saved in `dev/.mock-state.json` (git-ignored).

## Demo accounts

Seeded by both the Laravel seeder and the mock API (password: `password`):

| Role | Email |
| --- | --- |
| Administrator | `admin@workman.local` |
| Client | `client@workman.local` |
| Technician (Plumbing, verified) | `michael@workman.local` |
| Technician (Electrical, verified) | `fatou@workman.local` |
| Technician (Carpentry, verified) | `samuel@workman.local` |
| Technician (Gas, pending verification) | `eric@workman.local` |

## Structure

```
src/
├── App.jsx                  # Route map + auth/role guards
├── main.jsx                 # BrowserRouter + AuthProvider
├── index.css                # Design tokens & shared utilities
├── context/AuthContext.jsx  # Session state (login/register/logout)
├── services/api.js          # Typed API layer (axios)
├── utils/format.js          # Currency, dates, booking statuses
├── components/
│   ├── dashboard/           # Dashboard shell (sidebar, topbar, notifications)
│   └── …                    # Brand, Icon, StarRating, Avatar, badges, modal…
└── pages/
    ├── LandingPage/         # Public site (client + technician messaging)
    ├── AuthPage/            # Login / register with role choice
    └── dashboard/           # Every dashboard page, grouped by role
```

### Dashboard routes

| Route | Who | What |
| --- | --- | --- |
| `/dashboard` | all | Role-specific overview |
| `/dashboard/discover` | client | Search & filter verified technicians |
| `/dashboard/technicians/:id` | client | Full profile, reviews, chat, booking request |
| `/dashboard/bookings` | client | Cancel, pay transport, track, confirm, review |
| `/dashboard/favorites` | client | Saved technicians |
| `/dashboard/settings` | client | Personal information |
| `/dashboard/messages` | client / technician | Private chat |
| `/dashboard/tracking/:bookingId` | client / technician | Live GPS map |
| `/dashboard/jobs` | technician | Accept/reject, start/finish, share location |
| `/dashboard/profile-setup` | technician | Services, areas, working hours, availability |
| `/dashboard/verification` | admin | Approve / reject technicians |
| `/dashboard/users` | admin | Everyone on the platform |
| `/dashboard/categories` | admin | Service category management |
| `/dashboard/platform-bookings` | admin | Booking monitoring |
| `/dashboard/reviews` | admin | Review moderation |

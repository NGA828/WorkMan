# WorkMan

**WorkMan** is a complete service-interaction platform that connects clients with verified local technicians. It is not just a directory — it covers the full journey:

**Discovery → Verification → Communication → Booking → Transport Payment → Tracking → Service → Confirmation → Rating → History**

The platform has three roles, each with its own dashboard:

| Role | What they can do |
| --- | --- |
| **Client** | Search & filter technicians, view profiles, chat, book, pay the transport fee, track the technician live, confirm completion, rate & review, manage favorites |
| **Technician** | Build a professional profile (services, service areas, working hours), pass admin verification, accept/reject bookings, set transport fees, share live GPS location, manage availability |
| **Administrator** | Verify technician ID & profile information, manage service categories, monitor bookings & reviews, moderate the platform |

## Repository layout

```
WorkMan/
├── backend/    Laravel 13 API (PHP 8.3+)
└── frontend/   React 19 + Vite SPA (react-router)
```

## Running locally

### 1. Backend (Laravel API on :8000)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve
```

The seeder creates a fully explorable demo environment:

| Account | Email | Password | Role |
| --- | --- | --- | --- |
| Admin | `admin@workman.local` | `password` | Administrator |
| Awa Diallo | `client@workman.local` | `password` | Client |
| Jean Mbarga | `jean@workman.local` | `password` | Client |
| Michael Kone | `michael@workman.local` | `password` | Technician (Plumbing, verified) |
| Fatou Ndiaye | `fatou@workman.local` | `password` | Technician (Electrical, verified) |
| Samuel Bate | `samuel@workman.local` | `password` | Technician (Carpentry, verified) |
| Eric Talla | `eric@workman.local` | `password` | Technician (Gas, **pending verification**) |

### 2. Frontend (Vite dev server on :5173)

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://127.0.0.1:8000` — no CORS setup needed in development.

Open **http://localhost:5173** and sign in with one of the demo accounts above.

## API surface

All endpoints live under `/api`. See `backend/routes/api.php` for the complete, formatted route map:

- **Public:** `GET /health`, `GET /categories`, `GET /technicians` (search + filters), `GET /technicians/{id}`, `GET /technicians/{id}/reviews`, `POST /auth/register`, `POST /auth/login`
- **Authenticated:** profile, notifications, bookings, payments, conversations & messages
- **Client:** create/cancel/confirm bookings, create & confirm transport payments, favorites
- **Technician:** services, service areas, working hours, availability toggle, booking status transitions, live location sharing
- **Admin:** summary, users, verification approvals, categories, bookings, reviews

### Booking lifecycle

```
pending → accepted → in_progress → done → completed
             ↘ rejected            (client confirms)
pending → cancelled (client)
```

Transport fees are paid through WorkMan **after acceptance**; the service price itself is agreed after diagnosis, as specified.

> Note: mobile money confirmation (`POST /payments/{id}/confirm`) is simulated in local development. In production it would verify the MTN MoMo / Orange Money webhook.

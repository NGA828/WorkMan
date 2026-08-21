# WorkMan — Backend

Laravel 13 API (PHP 8.3+) for the WorkMan platform. SQLite is used for local development; switch `DB_CONNECTION` to MySQL for production.

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve            # API on http://127.0.0.1:8000
```

The seeder creates demo accounts for all three roles (password: `password`):

| Role | Email |
| --- | --- |
| Administrator | `admin@workman.local` |
| Client | `client@workman.local` · `jean@workman.local` |
| Technician | `michael@workman.local` · `fatou@workman.local` · `samuel@workman.local` · `eric@workman.local` |

## Authentication

API tokens are random 64-character strings stored as SHA-256 hashes in `users.api_token_hash`. Send the token as `Authorization: Bearer <token>`. Logging in replaces any previous token for that user.

## Structure

- `routes/api.php` — the complete, formatted route map (public / client / technician / admin groups).
- `app/Http/Controllers/Api/` — one controller per concern (auth, bookings, payments, messaging, reviews, discovery, admin, …).
- `app/Http/Middleware/` — `auth.api` (token lookup) and `role` (role gates).
- `database/migrations/` — schema for users, profiles, services, bookings, conversations, payments, locations, reviews, notifications.
- `database/seeders/DatabaseSeeder.php` — full demo environment covering every booking stage.

## Booking lifecycle

```
pending ──(technician)──▶ accepted ──▶ in_progress ──▶ done
   │                        │                           │
   └─(client cancel)─▶ cancelled       rejected ◀─(tech) └─(client confirm)─▶ completed ──▶ review
```

- Booking requests are validated against the technician's working hours and existing bookings.
- The transport fee is set by the technician when accepting and paid by the client through WorkMan; the service price is agreed after diagnosis.
- Live GPS sharing is restricted to accepted / in-progress bookings.

## Payment provider note

`POST /payments/{payment}/confirm` simulates a successful mobile money confirmation in local development. Wire the real MTN MoMo / Orange Money webhook there for production.

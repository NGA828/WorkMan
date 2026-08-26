# WorkMan Role-Based Pages — Task List

## Backend (Laravel)

### Migration: ID document columns
- [x] Create migration to add `id_document_path` + `id_document_status` to `client_profiles`
- [x] Create migration to add `id_document_path` to `technician_profiles` (it only uses the existing `verification_status`)
- [x] Update `ClientProfile` model `$fillable`
- [x] Update `TechnicianProfile` model `$fillable`
- [x] Run `php artisan migrate`

### Migration: User deactivation
- [x] Create migration to add `is_active boolean default true` to `users`
- [x] Update `User` model `$fillable`
- [x] Run `php artisan migrate`

### Backend: Admin user management endpoints
- [x] Add `PATCH /admin/users/{user}` (deactivate/reactivate) to `AdminController`
- [x] Add route to `api.php`
- [x] Add `GET /admin/users` filter to support `?role=` param (optional, can filter client-side)

### Backend: Identity document upload
- [x] Add `POST /profile/identity` (multipart) to `ProfileController` — stores file, updates `id_document_path`
- [x] Add route to `api.php`

### Backend: Admin reports/issues
- [x] Create `reports` migration (reporter_id, reported_user_id, type, description, status, resolved_at)
- [x] Create `Report` model
- [x] Add `ReportController` with `index`, `store`, `resolve` methods
- [x] Add routes: `POST /reports` (auth), `GET /admin/reports`, `PATCH /admin/reports/{report}`

## Frontend (React)

### api.js
- [x] Add `uploadIdentityDocument(formData)` 
- [x] Add `getAdminReports()`, `resolveReport(id)` 
- [x] Add `deactivateUser(id)`, `reactivateUser(id)` 
- [x] Add `submitReport(payload)` (for future use by clients/technicians)

### SettingsPage.jsx (Client)
- [x] Add Identity Verification section card
- [x] ID upload file input (front of document)
- [x] Status indicator (unverified / pending / verified)
- [x] Submit button wired to `uploadIdentityDocument`

### ProviderProfileSetup.jsx (Technician)
- [x] Add Verification Documents SectionCard
- [x] ID upload file input
- [x] Wired to `uploadIdentityDocument`

### ProviderHistory.jsx (NEW)
- [x] Fetch bookings, filter client-side to completed/cancelled
- [x] Summary stat row (total completed, average rating received)
- [x] Clean read-only card list per job

### AdminReports.jsx (NEW)
- [x] Fetch `GET /admin/reports`
- [x] List view with reporter, type, description, date, status badge
- [x] Resolve button per open report
- [x] Graceful empty state

### AdminUsers.jsx
- [x] Add role filter tabs (All / Client / Technician / Admin)
- [x] Add name/email search input (client-side)
- [x] Add Deactivate / Reactivate action per user row

### App.jsx
- [x] Route `/dashboard/history` → ProviderHistory
- [x] Route `/dashboard/reports` → AdminReports

### DashboardLayout.jsx
- [x] Add "Service history" to PROVIDER_NAV
- [x] Add "Reports & issues" to ADMIN_NAV
- [x] Add title entries for new pages in TITLES map

# WorkMan — User Guide

**[WorkMan-User-Guide.pdf](WorkMan-User-Guide.pdf)** (42 pages, A4) explains:

- **Part 1: Setup and start-up.** Prerequisites, then how to start the **database** (MySQL/XAMPP or SQLite), the **backend** (Laravel API on `:8000`) and the **frontend** (Vite on `:5173`). Also covers the daily start-up checklist, demo accounts, optional AI configuration and troubleshooting.
- **Part 2: Using the application.** A page-by-page tour of the public pages, the dashboard layout, and the client, technician and administrator workspaces, plus a complete booking walkthrough.

## Files

| Path | Purpose |
| --- | --- |
| `WorkMan-User-Guide.pdf` | The finished guide |
| `user-guide.html` | Source of the guide (edit this) |
| `screenshots/` | App screenshots used in the guide |
| `scripts/` | Tools to recapture the screenshots and rebuild the PDF |

## Rebuilding

```bash
# 1. Run the app with fresh demo data (the mock API is enough)
cd frontend && node dev/mock-api.mjs --fresh      # terminal 1
cd frontend && npm run dev                        # terminal 2

# 2. Recapture screenshots and rebuild the PDF
cd docs/user-guide/scripts
npm install
npm run screenshots        # optional: only needed when the UI changes
npm run pdf
```

Set `CHROME_PATH` if you want to use an existing Chrome/Chromium instead of the one Puppeteer downloads.

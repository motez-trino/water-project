# Taiba Water Billing (HTML/CSS/JS Only)

A single‑page web app for water billing management with a splash screen and role‑based UI. Data is persisted locally using `localStorage`. No backend is required to run the app, but a MongoDB backend can be added following the plan below.

## Quick Start
- Prerequisites: any static server (Python or Node) on Windows/macOS/Linux
- Start a static server from the project root:
  - Python: `python -m http.server 8000`
  - Node (if installed): `npx serve .` or `npx http-server -p 8000`
- Open `http://localhost:8000/index.html` in the browser
- Click the mug (or wait a few seconds) to enter the app (`app.html`)

## Default Accounts
- Admin: `admin@taiba.local` / `admin123`
- User: `user@taiba.local` / `user123`
- Seeded in `localStorage` when first run. Keys are in `app.js` (`DB_KEY`, `SESSION_KEY`).
  - `app.js:1–2`

## Reset or Export/Import Data
- Reset: open DevTools → Application → Local Storage → remove `taiba_db_v2` and `taiba_session_v2`
- Export: use the “Export JSON” button in the Admin section (creates a downloadable JSON snapshot)
- Import: use “Import JSON” to replace current data with a JSON file matching the app’s structure

## App Features
- Authentication: login/logout, session stored in `localStorage`
- Authorization: role‑based UI (Admin vs User)
- Requests:
  - Types: new connection, usage adjustment, disconnection, access
  - Approval/rejection by admin; status tracking; clear‑all by admin
- Households:
  - Add household, update usage records, mark inactive/disconnected
  - Filter by block and type; maintain monthly consumption history
- Billing:
  - Generate monthly bills from usage; due vs late status; mark as paid
  - Notifications list for due/late bills
- Dashboard:
  - High consumption list and simple stats (active households, pending requests, due/late bills)


## Data Model (Local Storage)
- `users`: `{ id, email, password, role }`
- `households`: `{ id, ownerEmail, block, connectionType, status, currentUsage, consumptionHistory[] }`
- `consumptionHistory[]`: `{ month, year, m3 }`
- `bills`: `{ id, householdId, ownerEmail, month, year, amount, status, dueDate, createdAt }`
- `requests`: `{ id, type, payload, requesterEmail, status, createdAt, resolvedAt?, reviewerEmail? }`
- `settings`: `{ pricePerM3 }`

## Integrating a MongoDB Backend (Simple Plan)
This app can be upgraded to use a MongoDB database with a minimal API. Below is a pragmatic path using Node.js + Express. Python/Flask would be similar.

### 1) Backend Setup (Node.js + Express)
- Create a new folder `server/` next to this frontend
- Initialize and install dependencies:
  - `npm init -y`
  - `npm i express cors mongodb dotenv bcrypt jsonwebtoken`
- Create `.env` with:
  - `PORT=5000`
  - `MONGODB_URI=mongodb://localhost:27017/taiba`
  - `JWT_SECRET=replace-with-a-strong-secret`
- Minimal server structure:
  - `server/index.js` – boot Express, CORS, JSON parsing
  - `server/db.js` – connect to MongoDB (shared client)
  - Route modules: `auth.js`, `households.js`, `requests.js`, `bills.js`

### 2) Collections
- `users`
  - Fields: `email` (unique), `passwordHash`, `role` (`admin` | `user`)
  - Index: `{ email: 1 }`, unique
- `households`
  - Fields: `ownerEmail`, `block`, `connectionType`, `status`, `currentUsage`, `consumptionHistory[]`
  - Indices: `{ ownerEmail: 1 }`, `{ status: 1 }`
- `bills`
  - Fields: `householdId`, `ownerEmail`, `month`, `year`, `amount`, `status`, `dueDate`, `createdAt`
  - Indices: `{ householdId: 1 }`, `{ status: 1 }`, compound `{ month: 1, year: 1 }`
- `requests`
  - Fields: `type`, `payload`, `requesterEmail`, `status`, `createdAt`, `resolvedAt?`, `reviewerEmail?`
  - Indices: `{ status: 1 }`, `{ requesterEmail: 1 }`

### 3) API Endpoints (Contract)
- `POST /login` → `{ email, password }` → `200 { email, role, token }` or `401`
- `POST /register` → `{ email, password }` → `201 { email, role }` or `409`
- `GET /me` (auth) → user profile
- `GET /households` (auth)
- `POST /households` (admin)
- `PATCH /households/:id` (admin)
- `DELETE /households/:id` (admin)
- `POST /requests` (auth)
- `GET /requests` (auth; admin sees all; user sees own)
- `POST /requests/:id/approve` (admin)
- `POST /requests/:id/reject` (admin)
- `POST /bills/generate` (admin) → `{ month, year, pricePerM3 }`
- `GET /bills` (auth)
- `POST /bills/:id/pay` (admin)

### 4) Frontend Changes
- Replace local `login(...)` with backend call and session token storage:
  - app.js:24`
  - Store `{ email, role, token }` in `localStorage` (use `SESSION_KEY`)
- Replace direct local mutations with `fetch(...)` calls to the API:
  - Requests flow: `app.js:29–31`
  - Households: `app.js:32`
  - Bills: `capp.js:34–37`
- Keep the same JSON shapes so the UI rendering functions don’t need major changes
- Add an auth header: `Authorization: Bearer <token>` to protected endpoints

### 5) Security & Auth Notes
- Hash passwords with `bcrypt`; never store plaintext (frontend seeds will be replaced)
- Use JWT (short TTL) or secure cookies; implement refresh if needed
- Validate inputs server‑side; enforce roles on every route
- Enable CORS only for your frontend origin, not `*`

### 6) Migration Strategy
- Export current local data (Admin → Export JSON)
- Write one‑off import scripts in the backend to seed MongoDB from the exported JSON
- Switch the frontend to read/write from the API instead of `localStorage`

### 7) Development Workflow
- Run backend: `node server/index.js` (or `nodemon`)
- Run frontend static server as above
- Point frontend to `http://localhost:5000` via constants or environment (e.g., add a `BASE_URL` constant in `app.js`)

## Troubleshooting
- If login doesn’t respond, hard refresh (`Ctrl+F5`) to reload updated scripts
- Clear `localStorage` keys `taiba_db_v2` and `taiba_session_v2` if seed data is stale
- Use DevTools console logs to confirm event binding and toast notifications


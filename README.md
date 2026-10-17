# TransitOps

TransitOps is a full-stack fleet operations application for managing vehicles, drivers, trips, maintenance, fuel logs, expenses, and operational reports. It is an educational/hackathon project built with React, Express, and MongoDB.

## Features

- JWT-based login and registration, bcrypt password hashing, and password reset by email OTP.
- Role checks on selected API write routes for Fleet Manager, Driver, Safety Officer, and Financial Analyst roles.
- Vehicle and driver registry with status filters and unique registration/license numbers.
- Trip workflow: Draft → Dispatched → Completed or Cancelled. Dispatch checks vehicle availability, driver status/license expiry, and cargo capacity.
- Maintenance records that move a vehicle to `In Shop`; closing a record restores it to `Available` or marks it `Retired`.
- Fuel logs and categorized expenses. Completing a trip creates a fuel log when both fuel consumed and fuel cost are supplied.
- Dashboard KPIs, recent trips, and vehicle status counts.
- Vehicle reports, fleet utilization, Recharts visualizations, and CSV export.
- Light/dark theme preference stored in the browser.
- Background daily driver-license-expiry email checks. SMTP can be configured; without SMTP settings the backend uses an Ethereal test account.

## Tech stack

### Frontend

- React 19 for the UI and component state.
- Vite for local development and production builds.
- Tailwind CSS v4 for styling.
- React Router DOM for client-side routes.
- Axios for API requests and JWT header handling.
- Recharts for report visualizations; Lucide React for icons.

### Backend

- Node.js and Express for the HTTP API and middleware.
- MongoDB and Mongoose for persistence, schemas, validation, and document references.
- `jsonwebtoken` for signed access tokens and `bcryptjs` for password hashing.
- Nodemailer for password-reset and license-expiry emails.

## Project layout

```text
backend/
  controllers/       API business logic
  middleware/        JWT authentication and role checks
  models/            Mongoose schemas
  routes/            Express route definitions
  utils/             Environment loading, seed data, license email job
  server.js          Express setup, database connection, route mounting
frontend/
  src/
    api/             Shared Axios client
    components/      Reusable interface components
    context/         Authentication and theme contexts
    pages/           Login and application pages
    App.jsx          Providers and client-side routes
    main.jsx         React entry point
```

## Requirements

- Node.js and npm
- A MongoDB connection string

## Run locally

### Backend

Create `backend/.env` with at least:

```env
MONGO_URI=mongodb://127.0.0.1:27017/transitops
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=8h
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

SMTP settings are optional in local development. To send real email, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and optionally `SMTP_FROM`. When SMTP credentials are absent, the code attempts to use an Ethereal test account.

Then install and start the API:

```bash
cd backend
npm install
npm run dev
```

The API listens on `http://localhost:5000` by default. Health check: `GET /api/health`.

### Seed demo data (optional)

```bash
cd backend
npm run seed
```

**Warning:** the seed script deletes all existing documents in the User, Vehicle, Driver, Trip, FuelLog, Maintenance, and Expense collections before inserting demo data. Use only with a disposable development database.

Demo login password: `password123`

| Role | Email |
|---|---|
| Fleet Manager | `fleet.manager@transitops.demo` |
| Driver | `driver@transitops.demo` |
| Safety Officer | `safety.officer@transitops.demo` |
| Financial Analyst | `analyst@transitops.demo` |

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173`. The API URL can be overridden with `VITE_API_URL`; its default is `http://localhost:5000/api`.

Available frontend scripts: `npm run dev`, `npm run build`, `npm run preview`, and `npm run lint`.

## API overview

All routes below are mounted under `/api`. Except for auth routes and `/health`, API routes require a valid Bearer JWT. Role checks apply to the write routes listed below; read routes generally allow any authenticated role.

| Resource | Main routes | Write authorization |
|---|---|---|
| Auth | `/auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/roles` | Public endpoints; registration currently accepts a role from the request body. |
| Vehicles | `/vehicles` | Create, update, delete: Fleet Manager |
| Drivers | `/drivers` | Create/update: Fleet Manager or Safety Officer; delete: Fleet Manager |
| Trips | `/trips`, `/:id/dispatch`, `/:id/complete`, `/:id/cancel` | Fleet Manager or Driver |
| Maintenance | `/maintenance` | Create, update, close: Fleet Manager |
| Fuel | `/fuel` | Create: Fleet Manager or Driver; delete: Fleet Manager |
| Expenses | `/expenses` | Create: Fleet Manager, Driver, or Financial Analyst; delete: Fleet Manager or Financial Analyst |
| Dashboard | `/dashboard/kpis`, `/filters`, `/recent-trips`, `/vehicle-status` | Authenticated roles can read |
| Reports | `/reports/vehicles`, `/fleet-utilization`, `/export.csv` | Authenticated roles can read/export |

Authorization is enforced by backend middleware on selected routes. The frontend also hides some controls based on role, but client-side UI checks are not a security boundary. The current registration endpoint accepts the requested role; this should be restricted before production use.

## Business rules represented in the API

- Vehicle registration numbers and driver license numbers are unique.
- A trip cannot be dispatched with a retired, in-shop, or already-on-trip vehicle.
- A driver must be `Available` and have a license valid through its expiry date to be dispatched.
- Cargo weight is checked against vehicle capacity when a trip is created and again when it is dispatched.
- Dispatch marks the trip `Dispatched` and its vehicle and driver `On Trip`.
- Completion requires a final odometer reading not lower than the stored vehicle odometer; it updates the odometer and makes vehicle and driver available.
- Cancelling a dispatched trip makes its vehicle and driver available.
- Maintenance cannot be opened for a vehicle currently on a trip. Opening maintenance marks the vehicle `In Shop`; closing can restore it to `Available` or retire it.

## Dashboard and report calculations

The dashboard calculates active/available/in-maintenance vehicles, active and pending trips, drivers on duty, and fleet utilization. Type and region filters are applied to vehicle-based metrics; driver totals are currently calculated across all drivers.

Vehicle reports include completed trip counts, planned distance, fuel volume/cost, maintenance cost, other expenses, revenue, fuel efficiency, operational cost, and ROI. In the current implementation, operational cost is fuel cost plus maintenance cost, while other expenses are reported separately. Fuel efficiency uses planned trip distance divided by recorded fuel liters. These definitions may need adjustment for production reporting.

## Deployment notes

`frontend/vercel.json` rewrites client-side routes to `index.html` for a Vercel-hosted frontend. The backend must be hosted separately with MongoDB and environment variables configured. Set `VITE_API_URL` at frontend build time and configure `CLIENT_ORIGIN` on the backend for the deployed frontend origin.

## Known limitations

- Trip lifecycle actions update multiple MongoDB documents without a transaction, so partial failures or concurrent requests can leave inconsistent state.
- Driver trip actions do not currently verify that the driver owns or is assigned to that trip.
- Public registration accepts a role supplied by the requester.
- Report generation performs repeated per-vehicle queries and may become slow with larger datasets.
- The project does not currently include an automated test suite, pagination, GPS tracking, or a mobile client.

## License

This project was developed for educational and hackathon purposes. No separate license file is present in the repository.

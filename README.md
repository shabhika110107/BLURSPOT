# BlurSpot - Civic Issue Reporting Platform

A full-stack web application for reporting and managing urban problems with real-time updates and gamification.

## Tech Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken + bcryptjs)
- **Maps**: Leaflet.js (react-leaflet) with color-coded status markers
- **Notifications**: Discord Webhooks
- **Real-time**: WebSockets (ws)

## Features

- User registration with OTP verification (email + SMS via console mock in local dev)
- Three roles: Citizen, Authority, Admin
- Role-based dashboards
- Real-time map with color-coded report pins (updates live via WebSocket)
- Geo-duplicate detection — flags nearby reports of the same type
- Priority scoring based on seriousness and reporter karma
- Report upvoting
- Citizen verification flow (Work Over → Completed)
- Before/After photo slider
- Discord notifications on new reports, upvotes, and status changes
- Privacy blur tool for images
- Report timeline tracking
- Gamification with Karma points (+10 on report completion)
- Admin dashboard with stats and department performance

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 13+
- Discord webhook URLs (optional)

## Database Setup

### 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE blurspot;"
```

### 2. Run migrations and seed

```bash
cd src/backend
npm run db:setup
```

This runs `001_schema.sql` to create all tables, then seeds 4 default authorities and a test user.

## Installation

### Backend

```bash
cd src/backend
npm install
```

Create `src/backend/.env` (see `.env.example`):

```env
PORT=5000

PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=blurspot
PG_USER=postgres
PG_PASSWORD=postgres

# Set to local-dev to mock OTP emails/SMS to console
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local-dev
AWS_SECRET_ACCESS_KEY=local-dev

S3_BUCKET_NAME=blurspot-images-bucket

DISCORD_WEBHOOK_GENERAL=<your-webhook-url>
DISCORD_WEBHOOK_WATER=<your-webhook-url>
DISCORD_WEBHOOK_ROADS=<your-webhook-url>
DISCORD_WEBHOOK_SANITATION=<your-webhook-url>
DISCORD_WEBHOOK_ELECTRICITY=<your-webhook-url>

ADMIN_USERNAME=admin
ADMIN_PASSWORD=securepass

JWT_SECRET=your-jwt-secret-key

SES_FROM_EMAIL=noreply@blurspot.com
```

### Frontend

```bash
cd src/frontend
npm install
```

Create `src/frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000
```

## Running Locally

```bash
# Terminal 1 — Backend
cd src/backend
npm run dev

# Terminal 2 — Frontend
cd src/frontend
npm start
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

> OTP codes are printed to the backend console when `AWS_ACCESS_KEY_ID=local-dev`.

## Default Credentials

### Admin
- Username: `admin`
- Password: `securepass`

### Authorities (pre-seeded)

| Username     | Password | Department  |
|--------------|----------|-------------|
| authority1   | auth123  | Roads       |
| authority2   | auth123  | Water       |
| authority3   | auth123  | Sanitation  |
| authority4   | auth123  | Electricity |

### Test User
- Email: `testuser@blurspot.com`
- Password: `password123`

## Testing

```bash
# Backend
cd src/backend
npm test

# Frontend
cd src/frontend
npm test
```

## Project Structure

```
blurspot/
├── config/
│   └── s3-cors.json
├── src/
│   ├── frontend/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── AdminReports.js
│   │   │   │   ├── AdminStats.js
│   │   │   │   ├── AdminUsers.js
│   │   │   │   ├── AuthorityReports.js
│   │   │   │   ├── KarmaDisplay.js
│   │   │   │   ├── MapView.js
│   │   │   │   ├── MyReports.js
│   │   │   │   └── ReportProblem.js
│   │   │   ├── pages/
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── AuthorityDashboard.js
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   └── UserDashboard.js
│   │   │   ├── services/
│   │   │   │   ├── authService.js
│   │   │   │   ├── reportService.js
│   │   │   │   └── wsService.js
│   │   │   ├── utils/
│   │   │   │   └── imageUtils.js
│   │   │   ├── App.js
│   │   │   └── index.js
│   │   └── package.json
│   └── backend/
│       ├── src/
│       │   ├── db/
│       │   │   ├── migrations/
│       │   │   │   └── 001_schema.sql
│       │   │   ├── migrate.js
│       │   │   ├── pool.js
│       │   │   └── seed.js
│       │   ├── middleware/
│       │   │   ├── auth.js
│       │   │   └── errorHandler.js
│       │   ├── models/
│       │   │   ├── authorityModel.js
│       │   │   ├── reportModel.js
│       │   │   └── userModel.js
│       │   ├── routes/
│       │   │   ├── admin.js
│       │   │   ├── auth.js
│       │   │   ├── reports.js
│       │   │   └── users.js
│       │   ├── services/
│       │   │   ├── authService.js
│       │   │   ├── discordService.js
│       │   │   ├── geoService.js
│       │   │   ├── rekognitionService.js
│       │   │   └── reportService.js
│       │   ├── utils/
│       │   │   ├── initAuthorities.js
│       │   │   └── mockDB.js
│       │   └── server.js
│       └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register user, sends OTP
- `POST /api/auth/verify-otp` — Verify OTP, returns JWT
- `POST /api/auth/login` — Login (user / authority / admin), returns JWT
- `POST /api/auth/logout` — Logout (client-side token discard)
- `POST /api/auth/resend-otp` — Resend OTP

### Reports
- `POST /api/reports` — Create report (multipart with images)
- `GET /api/reports` — Get reports filtered by role
- `GET /api/reports/all` — Get all reports (for upvote state)
- `GET /api/reports/:id` — Get report by ID
- `PUT /api/reports/:id/status` — Update status (authority/admin)
- `POST /api/reports/:id/verify` — Citizen verification
- `POST /api/reports/:id/upvote` — Upvote a report
- `POST /api/reports/:id/proof` — Upload proof images
- `POST /api/reports/check-duplicate` — Geo-duplicate check

### Users
- `GET /api/users/profile` — Get profile
- `PUT /api/users/profile` — Update profile
- `GET /api/users/karma` — Get karma points
- `GET /api/users/reports` — Get own reports

### Admin
- `GET /api/admin/users` — All users
- `GET /api/admin/authorities` — All authorities
- `GET /api/admin/reports` — All reports
- `GET /api/admin/stats` — Dashboard stats and department performance
- `DELETE /api/admin/reports/:id` — Delete a report
- `PUT /api/admin/users/:id/karma` — Adjust user karma

### Health
- `GET /health` — Server health check

## License

MIT

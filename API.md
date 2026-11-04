# BlurSpot API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "OTP sent to email and phone",
  "userId": "uuid"
}
```

#### POST /auth/verify-otp
Verify OTP and activate account

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "userId": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

#### POST /auth/login
Login user/authority/admin

**Request:**
```json
{
  "username": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": { ... }
}
```

### Reports

#### POST /reports
Create a new report (requires authentication)

**Request:** multipart/form-data
- description: string
- type: string
- category: string
- seriousness: string
- latitude: number
- longitude: number
- images: file[]

**Response:**
```json
{
  "report": {
    "reportId": "uuid",
    "status": "Reported",
    ...
  },
  "message": "Report created successfully"
}
```

#### GET /reports
Get reports (filtered by role)

**Query Parameters:**
- status: string (optional)
- category: string (optional)

**Response:**
```json
[
  {
    "reportId": "uuid",
    "description": "Pothole on Main St",
    "status": "Reported",
    ...
  }
]
```

#### GET /reports/:id
Get report by ID

**Response:**
```json
{
  "reportId": "uuid",
  "description": "...",
  "timeline": [...],
  ...
}
```

#### PUT /reports/:id/status
Update report status (authority only)

**Request:**
```json
{
  "status": "Assigned",
  "proofImages": ["url1", "url2"],
  "notes": "Workers assigned"
}
```

#### POST /reports/:id/verify
Citizen verification

**Request:**
```json
{
  "verified": true
}
```

### Users

#### GET /users/profile
Get user profile

**Response:**
```json
{
  "userId": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "karma": 10
}
```

#### PUT /users/profile
Update user profile

**Request:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

#### GET /users/karma
Get karma points

**Response:**
```json
{
  "karma": 10
}
```

### Admin

#### GET /admin/users
Get all users (admin only)

#### GET /admin/authorities
Get all authorities (admin only)

#### GET /admin/reports
Get all reports (admin only)

#### DELETE /admin/reports/:id
Delete report (admin only)

#### GET /admin/stats
Get dashboard statistics

**Response:**
```json
{
  "totalUsers": 100,
  "totalReports": 50,
  "totalAuthorities": 5,
  "reportsByStatus": {
    "Reported": 10,
    "Reviewed": 5,
    ...
  }
}
```

## WebSocket Events

Connect to: `ws://localhost:5000`

### Events from Server

**NEW_REPORT**
```json
{
  "type": "NEW_REPORT",
  "data": { report object }
}
```

**REPORT_UPDATE**
```json
{
  "type": "REPORT_UPDATE",
  "data": {
    "reportId": "uuid",
    "status": "Assigned",
    "proofImages": [...]
  }
}
```

**REPORT_COMPLETED**
```json
{
  "type": "REPORT_COMPLETED",
  "data": {
    "reportId": "uuid"
  }
}
```

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message"
}
```

Status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

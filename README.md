# BlurSpot - Civic Issue Reporting Platform

A full-stack web application for reporting and managing urban problems with real-time updates, AI validation, and gamification.

## Tech Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: AWS DynamoDB
- **Authentication**: AWS Cognito
- **Storage**: AWS S3
- **AI**: AWS Rekognition
- **Maps**: Leaflet.js with MarkerCluster
- **Notifications**: Discord Webhooks
- **Real-time**: WebSockets

## Features

- User registration with OTP verification (email/phone)
- Authority pre-defined login
- Admin dashboard
- Real-time map with clustered pins
- AI-powered image validation
- Geo-fencing and deduplication
- Gamification with Karma points
- Before/After photo slider
- Discord notifications
- Privacy blur tool

## Prerequisites

- Node.js 16+ and npm
- AWS Account with CLI configured
- Discord webhook URLs

## AWS Setup

### 1. Create DynamoDB Tables

```bash
aws dynamodb create-table --table-name BlurSpot-Users --attribute-definitions AttributeName=userId,AttributeType=S --key-schema AttributeName=userId,KeyType=HASH --billing-mode PAY_PER_REQUEST

aws dynamodb create-table --table-name BlurSpot-Reports --attribute-definitions AttributeName=reportId,AttributeType=S AttributeName=userId,AttributeType=S --key-schema AttributeName=reportId,KeyType=HASH --global-secondary-indexes IndexName=UserIdIndex,KeySchema=[{AttributeName=userId,KeyType=HASH}],Projection={ProjectionType=ALL} --billing-mode PAY_PER_REQUEST

aws dynamodb create-table --table-name BlurSpot-Authorities --attribute-definitions AttributeName=authorityId,AttributeType=S --key-schema AttributeName=authorityId,KeyType=HASH --billing-mode PAY_PER_REQUEST
```

### 2. Create S3 Bucket

```bash
aws s3 mb s3://blurspot-images-bucket
aws s3api put-bucket-cors --bucket blurspot-images-bucket --cors-configuration file://config/s3-cors.json
```

### 3. Create Cognito User Pool

```bash
aws cognito-idp create-user-pool --pool-name BlurSpotUserPool --auto-verified-attributes email phone_number --mfa-configuration OPTIONAL
```

Note the UserPoolId and create an app client:

```bash
aws cognito-idp create-user-pool-client --user-pool-id <YOUR_POOL_ID> --client-name BlurSpotWebClient --generate-secret
```

### 4. Configure IAM Roles

Create an IAM role with permissions for:
- DynamoDB read/write
- S3 read/write
- Rekognition detect labels
- SNS publish (for SMS)
- SES send email

## Installation

### Backend Setup

```bash
cd src/backend
npm install
```

Create `.env` file in `src/backend`:

```env
PORT=5000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
COGNITO_USER_POOL_ID=<your-pool-id>
COGNITO_CLIENT_ID=<your-client-id>
S3_BUCKET_NAME=blurspot-images-bucket
DYNAMODB_USERS_TABLE=BlurSpot-Users
DYNAMODB_REPORTS_TABLE=BlurSpot-Reports
DYNAMODB_AUTHORITIES_TABLE=BlurSpot-Authorities
DISCORD_WEBHOOK_GENERAL=<your-webhook-url>
DISCORD_WEBHOOK_WATER=<your-webhook-url>
DISCORD_WEBHOOK_ROADS=<your-webhook-url>
DISCORD_WEBHOOK_SANITATION=<your-webhook-url>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=securepass
JWT_SECRET=your-jwt-secret-key
```

### Frontend Setup

```bash
cd src/frontend
npm install
```

Create `.env` file in `src/frontend`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_COGNITO_USER_POOL_ID=<your-pool-id>
REACT_APP_COGNITO_CLIENT_ID=<your-client-id>
REACT_APP_AWS_REGION=us-east-1
REACT_APP_WS_URL=ws://localhost:5000
```

## Running Locally

### Start Backend

```bash
cd src/backend
npm start
```

Backend runs on http://localhost:5000

### Start Frontend

```bash
cd src/frontend
npm start
```

Frontend runs on http://localhost:3000

## Deployment

### Backend (AWS EC2 or Elastic Beanstalk)

```bash
cd src/backend
zip -r backend.zip .
aws elasticbeanstalk create-application-version --application-name BlurSpot --version-label v1 --source-bundle S3Bucket=your-bucket,S3Key=backend.zip
```

### Frontend (AWS Amplify)

```bash
cd src/frontend
npm run build
aws s3 sync build/ s3://your-frontend-bucket --acl public-read
```

Or use AWS Amplify Console for continuous deployment from Git.

## Default Credentials

### Admin
- Username: `admin`
- Password: `securepass`

### Authority (Pre-configured)
- Username: `authority1`
- Password: `auth123`
- Department: Roads

Add more authorities via backend API or directly in DynamoDB.

## Testing

```bash
# Backend tests
cd src/backend
npm test

# Frontend tests
cd src/frontend
npm test
```

## Project Structure

```
blurspot/
├── config/
│   ├── s3-cors.json
│   └── aws-config.json
├── src/
│   ├── frontend/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   ├── App.js
│   │   │   └── index.js
│   │   └── package.json
│   └── backend/
│       ├── src/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── services/
│       │   ├── models/
│       │   ├── utils/
│       │   └── server.js
│       └── package.json
└── README.md
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/verify-otp` - OTP verification
- POST `/api/auth/login` - User/Authority/Admin login
- POST `/api/auth/logout` - Logout

### Reports
- POST `/api/reports` - Create report
- GET `/api/reports` - Get all reports (filtered by role)
- GET `/api/reports/:id` - Get report details
- PUT `/api/reports/:id/status` - Update report status
- POST `/api/reports/:id/verify` - Citizen verification

### Users
- GET `/api/users/profile` - Get user profile
- PUT `/api/users/profile` - Update profile
- GET `/api/users/karma` - Get karma points

### Admin
- GET `/api/admin/users` - Get all users
- GET `/api/admin/authorities` - Get all authorities
- DELETE `/api/admin/reports/:id` - Delete fake report

## License

MIT

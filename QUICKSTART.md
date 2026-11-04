# BlurSpot - Quick Start Guide

## Prerequisites
- Node.js 16+ installed
- AWS account with CLI configured
- Discord webhook URLs

## 1. Clone and Install

```bash
cd blurspot

# Install backend dependencies
cd src/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 2. Configure AWS Services

Run these AWS CLI commands:

```bash
# Create DynamoDB tables
aws dynamodb create-table --table-name BlurSpot-Users --attribute-definitions AttributeName=userId,AttributeType=S --key-schema AttributeName=userId,KeyType=HASH --billing-mode PAY_PER_REQUEST

aws dynamodb create-table --table-name BlurSpot-Reports --attribute-definitions AttributeName=reportId,AttributeType=S AttributeName=userId,AttributeType=S --key-schema AttributeName=reportId,KeyType=HASH --global-secondary-indexes IndexName=UserIdIndex,KeySchema=[{AttributeName=userId,KeyType=HASH}],Projection={ProjectionType=ALL} --billing-mode PAY_PER_REQUEST

aws dynamodb create-table --table-name BlurSpot-Authorities --attribute-definitions AttributeName=authorityId,AttributeType=S --key-schema AttributeName=authorityId,KeyType=HASH --billing-mode PAY_PER_REQUEST

# Create S3 bucket
aws s3 mb s3://blurspot-images-bucket
aws s3api put-bucket-cors --bucket blurspot-images-bucket --cors-configuration file://config/s3-cors.json
```

## 3. Setup Environment Variables

**Backend (.env in src/backend/):**
```env
PORT=5000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id
S3_BUCKET_NAME=blurspot-images-bucket
DYNAMODB_USERS_TABLE=BlurSpot-Users
DYNAMODB_REPORTS_TABLE=BlurSpot-Reports
DYNAMODB_AUTHORITIES_TABLE=BlurSpot-Authorities
DISCORD_WEBHOOK_GENERAL=your-webhook-url
DISCORD_WEBHOOK_WATER=your-webhook-url
DISCORD_WEBHOOK_ROADS=your-webhook-url
DISCORD_WEBHOOK_SANITATION=your-webhook-url
ADMIN_USERNAME=admin
ADMIN_PASSWORD=securepass
JWT_SECRET=your-secret-key
SES_FROM_EMAIL=noreply@blurspot.com
```

**Frontend (.env in src/frontend/):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000
```

## 4. Initialize Default Authorities

```bash
cd src/backend
node src/utils/initAuthorities.js
```

## 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd src/backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd src/frontend
npm start
```

## 6. Access the Application

Open browser: http://localhost:3000

### Default Credentials

**Admin:**
- Username: admin
- Password: securepass

**Authority:**
- Username: authority1
- Password: auth123

**User:**
- Register new account with email/phone
- Verify with OTP

## 7. Test the Features

1. **Register as User**: Create account, verify OTP
2. **Report Problem**: Upload geotagged photo, select location
3. **Login as Authority**: View and update report status
4. **Login as Admin**: View all users, reports, statistics
5. **Check Discord**: Notifications sent to webhooks
6. **View Map**: See clustered pins with real-time updates

## Troubleshooting

**Port already in use:**
```bash
# Change PORT in backend .env
PORT=5001
```

**AWS credentials error:**
```bash
aws configure
# Enter your access key and secret
```

**DynamoDB table not found:**
```bash
# Verify tables exist
aws dynamodb list-tables
```

**CORS error:**
```bash
# Check S3 CORS configuration
aws s3api get-bucket-cors --bucket blurspot-images-bucket
```

## Next Steps

- Configure production environment variables
- Set up SSL certificates
- Deploy to AWS (see DEPLOYMENT.md)
- Configure custom domain
- Set up monitoring and alerts

## Support

For issues, check:
- README.md for detailed documentation
- API.md for API reference
- DEPLOYMENT.md for deployment guide

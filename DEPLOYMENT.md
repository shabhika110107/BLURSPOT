# BlurSpot Deployment Guide

## AWS Services Setup

### 1. DynamoDB Tables

Create three tables with the following configurations:

**BlurSpot-Users**
- Primary Key: userId (String)
- Billing Mode: PAY_PER_REQUEST

**BlurSpot-Reports**
- Primary Key: reportId (String)
- Global Secondary Index: UserIdIndex
  - Partition Key: userId (String)
- Billing Mode: PAY_PER_REQUEST

**BlurSpot-Authorities**
- Primary Key: authorityId (String)
- Billing Mode: PAY_PER_REQUEST

### 2. S3 Bucket

Create bucket: `blurspot-images-bucket`
- Enable public read access for images
- Configure CORS (use config/s3-cors.json)
- Enable versioning (optional)

### 3. Cognito User Pool

Create user pool with:
- Email and phone number as required attributes
- Auto-verify email and phone
- MFA optional
- Create app client (no secret for web)

### 4. IAM Role

Create role with policies:
- DynamoDB: GetItem, PutItem, UpdateItem, DeleteItem, Scan, Query
- S3: PutObject, GetObject, DeleteObject
- Rekognition: DetectLabels, DetectText
- SES: SendEmail
- SNS: Publish

### 5. Discord Webhooks

Create webhooks for each department:
- General notifications
- Water department
- Roads department
- Sanitation department

## Backend Deployment (AWS Elastic Beanstalk)

```bash
cd src/backend
zip -r backend.zip .
eb init -p node.js-16 blurspot-backend
eb create blurspot-env
eb deploy
```

Or use EC2:
```bash
# SSH into EC2 instance
sudo yum install nodejs npm
git clone <your-repo>
cd blurspot/src/backend
npm install
pm2 start src/server.js --name blurspot-backend
```

## Frontend Deployment (AWS Amplify)

```bash
cd src/frontend
npm run build

# Upload to S3
aws s3 sync build/ s3://blurspot-frontend --acl public-read

# Or use Amplify Console
amplify init
amplify add hosting
amplify publish
```

## Environment Variables

Set all environment variables in:
- Elastic Beanstalk: Configuration > Software > Environment properties
- EC2: Create .env file
- Amplify: Environment variables in console

## Post-Deployment

1. Initialize default authorities:
```bash
node src/utils/initAuthorities.js
```

2. Test endpoints:
```bash
curl https://your-api-url/health
```

3. Configure DNS and SSL certificates

## Monitoring

- CloudWatch for logs and metrics
- Set up alarms for errors
- Monitor DynamoDB capacity
- Track S3 storage costs

## Security Checklist

- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable CloudTrail
- [ ] Regular security audits
- [ ] Rotate credentials
- [ ] Enable MFA for admin accounts

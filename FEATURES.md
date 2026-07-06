# BlurSpot Features Documentation

## Core Features

### 1. User Registration & Authentication
- **Email/Phone Registration**: Users register with personal details
- **OTP Verification**: AWS Cognito sends OTP via email (SES) and SMS (SNS)
- **Secure Login**: JWT-based authentication with role-based access
- **Authority Pre-defined Login**: Authorities use pre-configured credentials
- **Admin Single Login**: Hardcoded admin credentials (configurable)

### 2. Report Problem (User)
- **Rich Form**: Description, type, category, seriousness, noticed time
- **Interactive Map**: Leaflet.js map for location selection
- **Geotagged Photos**: Upload up to 5 images with EXIF GPS data
- **Geo-fencing**: Validates photo GPS matches user's current location
- **Privacy Blur Tool**: Canvas API to blur faces/license plates
- **AI Validation**: AWS Rekognition validates image relevance
- **Deduplication**: Checks for reports within 10m radius
- **Real-time Pin**: Red pin appears on map immediately

### 3. My Reports (User)
- **Status Tracking**: View all reports with current status
- **Timeline View**: Complete history of status changes
- **Before/After Slider**: Interactive comparison of original and completion photos
- **Citizen Verification**: Verify work completion (original reporter or 3 nearby users)
- **Real-time Updates**: WebSocket notifications for status changes

### 4. Map View (All Roles)
- **Clustered Markers**: MarkerCluster plugin groups nearby pins
- **Color-coded Pins**: 
  - Red: Reported
  - Yellow: Reviewed
  - Green: Assigned/Work Over
  - Removed: Completed
- **Interactive Popups**: Click pins to view report details
- **Real-time Updates**: New reports appear instantly

### 5. Karma System (User)
- **Points Earning**:
  - +10 points: Report verified and completed
  - +5 points: Citizen verification participation
  - +2 bonus: High-quality reports with photos
- **Levels**: Beginner → Bronze (20) → Silver (50) → Gold (100)
- **Priority Queue**: Higher karma = higher priority for authorities
- **Leaderboard**: Gold users featured (future enhancement)

### 6. Authority Dashboard
- **Filtered Reports**: View reports for their department only
- **Priority Sorting**: Reports sorted by priority (seriousness + karma)
- **Status Updates**:
  - Reported → Reviewed
  - Reviewed → Assigned (with worker assignment proof)
  - Assigned → Work Over (with completion proof photos)
- **Proof Upload**: Geotagged photos at each stage
- **Discord Notifications**: Automatic alerts to department channels
- **Real-time Alerts**: WebSocket notifications for new reports

### 7. Admin Dashboard
- **Statistics Overview**: Total users, reports, authorities
- **Reports by Status**: Visual breakdown
- **User Management**: View all users, karma, verification status
- **Authority Management**: View all authorities and departments
- **Report Management**: Delete fake/spam reports
- **Karma Adjustment**: Manually adjust user karma
- **Integrity Verification**: Monitor system health

### 8. AI-Powered Validation
- **AWS Rekognition Integration**:
  - Detects labels in images (roads, trash, water, etc.)
  - Category-specific validation rules
  - Rejects irrelevant images (food, selfies)
  - Confidence threshold: 60%
- **Spam Prevention**: Blocks non-civic issue photos

### 9. Automated Routing
- **Category-based**: Reports auto-route to correct department
- **Discord Channels**:
  - #roads-dept → Roads authority
  - #water-dept → Water authority
  - #sanitation-dept → Sanitation authority
  - #general → Other categories
- **Rich Embeds**: Images, location, priority in notifications

### 10. Citizen Verification
- **Completion Verification**:
  - Original reporter can verify immediately
  - OR 3 nearby users must verify
  - Prevents false completion claims
- **Revert Mechanism**: If 3 users reject, status reverts to "Assigned"
- **Karma Award**: Only after successful verification

### 11. Real-time Features
- **WebSocket Integration**: Bidirectional communication
- **Live Map Updates**: Pins appear/update/disappear instantly
- **Push Notifications**: Status changes notify users immediately
- **Authority Alerts**: New reports trigger instant notifications
- **Broadcast System**: All connected clients receive updates

### 12. Security Features
- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: User/Authority/Admin permissions
- **Input Validation**: Express-validator for all inputs
- **Rate Limiting**: Prevent API abuse
- **Helmet.js**: Security headers
- **HTTPS Only**: Production deployment
- **Geo-fencing**: Prevent location spoofing
- **CORS Configuration**: Controlled cross-origin access

### 13. Mobile-Friendly UI
- **Responsive Design**: Material-UI components
- **Mobile Navigation**: Collapsible sidebar
- **Touch-friendly**: Large buttons, easy forms
- **Progressive Web App**: Can be installed on mobile
- **Geolocation API**: Automatic location detection

### 14. Dark Mode
- **Theme Toggle**: Switch between light/dark modes
- **Persistent**: Saved in local storage
- **All Dashboards**: User, Authority, Admin support

### 15. Image Handling
- **AWS S3 Storage**: Scalable image storage
- **Public URLs**: Direct access to images
- **EXIF Data Extraction**: GPS coordinates from photos
- **Multiple Upload**: Up to 5 images per report
- **Proof Images**: Before/after documentation

## Workflow Example

1. **User Reports**:
   - Takes geotagged photo of pothole
   - Uploads to app (AI validates it's a road issue)
   - Selects location on map
   - Submits report
   - Red pin appears on map
   - Discord notification sent to #roads-dept

2. **Authority Reviews**:
   - Receives Discord alert
   - Logs in, sees report (high priority due to user's karma)
   - Updates status to "Reviewed"
   - Assigns workers, uploads assignment proof
   - Status → "Assigned", pin turns green

3. **Work Completion**:
   - Workers fix pothole
   - Authority uploads completion photos
   - Status → "Work Over"
   - User receives notification

4. **Citizen Verification**:
   - Original user verifies completion
   - Status → "Completed"
   - User earns +10 karma
   - Pin removed from map
   - Discord completion notification

## Technical Highlights

- **Scalable Architecture**: AWS services handle growth
- **Real-time Performance**: WebSocket for instant updates
- **AI Integration**: Smart validation reduces spam
- **Gamification**: Karma system encourages participation
- **Professional UI**: Material-UI for polished look
- **Comprehensive Testing**: Jest tests for backend
- **Documentation**: API, deployment, quick start guides
- **Error Handling**: Graceful failures with user feedback
- **Loading States**: Spinners and progress indicators
- **Toast Notifications**: Success/error messages

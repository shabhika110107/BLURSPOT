# BlurSpot - Simple Local Setup (No AWS Required)

## You're Ready to Run!

I've configured the app to run in **local development mode** without needing AWS services.

### Start the Application:

**Step 1: Open Terminal 1 - Start Backend**
```bash
cd C:\blurspot\src\backend
npm start
```

Wait until you see: "Server running on port 5000"

**Step 2: Open Terminal 2 - Start Frontend**
```bash
cd C:\blurspot\src\frontend
npm start
```

Browser will open automatically at http://localhost:3000

### Login Credentials:

**Admin:**
- Username: `admin`
- Password: `securepass`

**Authority:**
- Username: `authority1`
- Password: `auth123`

**User:**
- For now, use admin or authority login
- User registration requires AWS (we'll set up later)

### What Works in Local Mode:
✅ Login (admin/authority)
✅ View dashboards
✅ Basic navigation
✅ UI components

### What Needs AWS (We'll Add Later):
❌ User registration with OTP
❌ Image upload to S3
❌ AI image validation
❌ Discord notifications
❌ Email/SMS

---

## Next: Let's Get AWS Set Up (After You Test Locally)

Once you've tested the app locally, I'll guide you through:
1. Creating a free AWS account
2. Setting up required services
3. Getting Discord webhooks
4. Enabling all features

**For now, just run the app and explore!**

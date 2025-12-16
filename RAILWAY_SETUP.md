# Railway.app Deployment Guide

## Required Environment Variables

Set these in your Railway project dashboard (Settings → Variables):

### Required Variables:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
SESSION_SECRET=your_random_session_secret_here
```

### Optional Variables (for full functionality):

**Google OAuth** (if not set, Google login will be disabled):
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CALLBACK_URL=https://your-app-name.railway.app/auth/google/callback
```

**Stripe Payments** (if not set, payment functionality will be disabled):
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

**Server Port** (Railway sets this automatically, but you can override):
```
PORT=3001
```

## Important Notes:

1. **CALLBACK_URL**: Update your Google OAuth callback URL in Google Cloud Console to match your Railway domain:
   - Format: `https://your-app-name.railway.app/auth/google/callback`
   - Add this to "Authorized redirect URIs" in Google Cloud Console

2. **MongoDB Atlas**: Make sure your MongoDB Atlas IP whitelist includes Railway's IP ranges, or set it to `0.0.0.0/0` for development.

3. **Session Secret**: Generate a strong random string for `SESSION_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **The app will start even without Google OAuth or Stripe** - those features will simply be disabled.

## Deployment Steps:

1. Connect your GitHub repository to Railway
2. Add all required environment variables in Railway dashboard
3. Railway will automatically detect Node.js and deploy
4. Your app will be available at `https://your-app-name.railway.app`


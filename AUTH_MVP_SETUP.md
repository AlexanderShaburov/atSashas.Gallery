# Admin Authentication MVP - Setup Guide

## 🎯 What's Been Implemented

✅ **Backend (FastAPI)**
- Session-based authentication with HTTP-only cookies
- Password hashing with bcrypt
- JWT session tokens
- Single concurrent session enforcement per user
- Activity timeout (30 minutes)
- Session expiration (4 hours)
- Protected admin API endpoints

✅ **Frontend (React)**
- Login page (`/admin/login`)
- Auth context and state management
- Protected admin routes (auto-redirect if not authenticated)
- Logout button in admin header
- User info display

---

## 📋 Setup Instructions

### Step 1: Install Backend Dependencies

```bash
cd apps/admin-backend
poetry install
```

This will install `passlib[bcrypt]` and `python-jose[cryptography]` for authentication.

### Step 2: Generate Password Hashes

Use the provided CLI script to generate password hashes for your users:

```bash
# Still in apps/admin-backend directory
python scripts/hash_password.py YOUR_PASSWORD_HERE
```

Example:
```bash
python scripts/hash_password.py MySecurePassword123
```

The script will output:
```
Password: MySecurePassword123
Hash: $2b$12$...

Copy the hash to users.json
```

Do this twice - once for your admin password and once for your daughter's password.

### Step 3: Update users.json

Edit `vault/json/users.json` and replace the placeholder hashes:

```json
{
  "users": [
    {
      "username": "admin",
      "hashed_password": "$2b$12$PASTE_YOUR_HASH_HERE",
      "full_name": "Main Admin",
      "is_active": true
    },
    {
      "username": "daughter",
      "hashed_password": "$2b$12$PASTE_DAUGHTER_HASH_HERE",
      "full_name": "Daughter Name",
      "is_active": true
    }
  ]
}
```

**Important:**
- Change `"daughter"` to the actual username you want
- Change `"Daughter Name"` to the actual full name
- Keep the hashed_password values secure (don't commit real passwords to git)

### Step 4: Generate Production Secret Key

For production, generate a secure secret key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Update `docker/.env` and replace:
```env
SECRET_KEY=dev-secret-key-CHANGE-IN-PRODUCTION
```

With:
```env
SECRET_KEY=<your-generated-secret-key>
```

### Step 5: Rebuild Docker Containers

```bash
cd docker
docker compose down
docker compose up --build
```

This will:
- Install new backend dependencies (passlib, python-jose)
- Apply all authentication changes
- Start the services

---

## 🧪 Testing Checklist

### Test 1: Login Flow
1. Navigate to `http://localhost:8080/admin`
2. Should redirect to `http://localhost:8080/admin/login`
3. Enter username and password
4. Should login successfully and redirect to `/admin`
5. Should see user's full name in header
6. Should see "Logout" button

### Test 2: Invalid Credentials
1. Go to `/admin/login`
2. Enter wrong username or password
3. Should show error message: "Invalid username or password"
4. Should NOT log in

### Test 3: Session Persistence
1. Login successfully
2. Refresh the page (F5)
3. Should remain logged in (no redirect to login)
4. Navigate to different admin pages
5. Should remain logged in

### Test 4: Logout
1. While logged in, click "Logout" button
2. Should redirect to `/admin/login`
3. Try to access `/admin` directly
4. Should redirect back to `/admin/login`

### Test 5: Direct API Access (Without Login)
1. Logout or open incognito window
2. Try to access API directly:
   ```bash
   curl http://localhost:8080/api/admin/streams
   ```
3. Should return `401 Unauthorized`

### Test 6: Single Session Enforcement
1. Login with user "admin" in Browser 1
2. Open Browser 2 (or incognito)
3. Login with same user "admin"
4. Go back to Browser 1
5. Try to make API request (navigate to a page)
6. Should get 401 and be redirected to login

### Test 7: Activity Timeout
1. Login successfully
2. Wait 30 minutes without any activity
3. Try to navigate to any admin page
4. Should be logged out and redirected to login
5. Message should indicate session expired

### Test 8: Session Expiration
1. Login successfully
2. Keep browser open for 4+ hours
3. Try to navigate to any admin page
4. Should be logged out and redirected to login

---

## 🔐 Security Features Implemented

✅ **HTTP-only cookies** - JavaScript cannot access session token
✅ **SameSite=lax** - CSRF protection
✅ **Password hashing** - Passwords never stored in plaintext
✅ **Single session** - Only one active session per user
✅ **Activity timeout** - Auto-logout after 30min inactivity
✅ **Session expiration** - Sessions expire after 4 hours
✅ **Protected routes** - All admin API endpoints require authentication
✅ **JWT tokens** - Cryptographically signed session tokens

---

## 📁 Files Modified/Created

### Backend
- ✨ `app/auth/` - New authentication module
  - `models.py` - User model
  - `schemas.py` - Request/response schemas
  - `security.py` - Password hashing, token generation
  - `repository.py` - User storage
  - `session.py` - Session management
  - `dependencies.py` - Auth dependency for routes
- ✨ `app/routers/auth/auth.py` - Login/logout endpoints
- ✨ `scripts/hash_password.py` - Password hashing CLI
- 📝 `app/settings.py` - Added auth settings
- 📝 `app/main.py` - Registered auth router
- 📝 All admin routers - Added auth dependency
- ✨ `vault/json/users.json` - User storage

### Frontend
- ✨ `features/auth/` - New auth feature
  - `authApi.ts` - API client
  - `authContext.tsx` - Auth state management
- ✨ `pages/admin/LoginPage.tsx` - Login UI
- ✨ `pages/admin/LoginPage.css` - Login styles
- ✨ `app/guards/RequireAuth.tsx` - Route guard
- 📝 `app/providers/AppProviders.tsx` - Added AuthProvider
- 📝 `app/router.tsx` - Added login route, protected admin routes
- 📝 `features/admin/shared/ui/adminHeader/AdminHeader.tsx` - Added logout button

### Config
- 📝 `apps/admin-backend/pyproject.toml` - Added auth dependencies
- 📝 `docker/.env` - Added auth environment variables

---

## 🚀 Next Steps (Post-MVP)

After testing the MVP, you can optionally add:

### Phase 3: Security Enhancements
- [ ] CSRF token validation
- [ ] Rate limiting on login attempts
- [ ] Audit logging for login/logout events

### Phase 4: Production
- [ ] Enable HTTPS in Caddy
- [ ] Set `Secure=True` for cookies (HTTPS only)
- [ ] Optional: Add Caddy basic auth as double layer
- [ ] Backup admin credentials securely

### Phase 5: Nice-to-Have
- [ ] Password change UI
- [ ] Session management UI (show last login, active sessions)
- [ ] 2FA/TOTP support (probably overkill for 2 users)

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'passlib'"
- Run `cd apps/admin-backend && poetry install`
- Rebuild Docker container: `docker compose up --build admin-backend`

### "Users file not found" Error
- Ensure `vault/json/users.json` exists
- Check file path in Docker volume mount

### Login succeeds but immediate 401 on next request
- Check that cookies are being sent (`credentials: 'include'` in fetch)
- Check browser console for CORS errors
- Ensure `allow_credentials=True` in CORS middleware

### "Invalid session token" Error
- SECRET_KEY might have changed between login and validation
- Session might be expired (4 hours)
- Check backend logs for JWT decode errors

---

## 📞 Support

If you encounter issues:
1. Check backend logs: `docker compose logs admin-backend`
2. Check frontend browser console for errors
3. Test API endpoints directly with curl to isolate frontend/backend issues

---

## ✅ MVP Complete!

You now have a working authentication system with:
- Secure password-based login
- Protected admin routes
- Single concurrent session per user
- Automatic session expiration
- Activity timeout
- Clean logout flow

Ready to deploy! 🎉

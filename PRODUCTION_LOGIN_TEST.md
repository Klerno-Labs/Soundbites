# PRODUCTION LOGIN TEST CHECKLIST

## Backend Status
1. Backend URL: https://soundbites-quiz-backend.onrender.com
2. Health Check: curl https://soundbites-quiz-backend.onrender.com/health
3. Expected: {"status":"ok","timestamp":"...","database":"postgresql"...}

## Test Login API Directly
```bash
curl -X POST https://soundbites-quiz-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://otis.soundbites.com" \
  -d '{"email":"c.hatfield309@gmail.com","password":"Hearing2025"}'
```

Expected Response:
- HTTP 200
- Headers MUST include: Access-Control-Allow-Origin: https://otis.soundbites.com
- Body: {"success":true,"token":"...","user":{...}}

## Test Frontend Login
1. Open: https://otis.soundbites.com/admin/login.html
2. Enter:
   - Email: c.hatfield309@gmail.com
   - Password: Hearing2025
3. Click Log In
4. Expected: Redirect to /admin dashboard

## If Still Failing:
- Check browser console for CORS errors
- Verify backend CORS headers are present
- Ensure backend deployed latest code from GitHub

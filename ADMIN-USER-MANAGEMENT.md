# 👥 Admin User Management Guide

## Overview
This guide shows you how to add, manage, and remove admin users for your Soundbites admin panel.

---

## Quick Start: Add a New Admin User

### Method 1: Using the Script (Easiest) ⭐

1. **Open PowerShell/Terminal** in the backend folder
2. **Run the add-admin script:**
   ```powershell
   cd backend
   node scripts/add-admin.js
   ```
3. **Follow the prompts:**
   - Enter username (e.g., "john")
   - Enter password (minimum 6 characters)
   - Enter email (optional)
4. **Done!** The user can now login

**Example:**
```
=== Add New Admin User ===

Enter username: sarah
Enter password: ********
Enter email (optional): sarah@example.com

Creating admin user...

✅ Admin user created successfully!
-----------------------------------
ID: 2
Username: sarah
Email: sarah@example.com
Created: 2024-10-19 10:30:00
-----------------------------------
```

---

### Method 2: Using PostgreSQL Directly

If you prefer to use SQL commands:

1. **Connect to your database:**
   ```bash
   psql postgresql://soundbites:sGrzsLyde4NXM7lGyC8hAfgyl9lM79yz@dpg-d3q5v7c9c44c73cgssbg-a/soundbites_dzq2
   ```

2. **Generate a password hash** (using Node.js):
   ```javascript
   const bcrypt = require('bcrypt');
   bcrypt.hash('your-password', 10, (err, hash) => {
       console.log(hash);
   });
   ```

3. **Insert the admin user:**
   ```sql
   INSERT INTO admin_users (username, password_hash, email)
   VALUES ('username', 'hashed-password-here', 'email@example.com');
   ```

---

### Method 3: Using the API (For Existing Admins)

If you're already logged in as an admin:

1. **Get your token** (from browser localStorage):
   - Press F12 in browser
   - Go to Application → Local Storage
   - Copy the `sb-admin-token` value

2. **Make API request:**
   ```bash
   curl -X POST https://soundbites-quiz-backend.onrender.com/api/auth/create-admin \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -d '{
       "username": "newadmin",
       "password": "securepassword",
       "email": "admin@example.com"
     }'
   ```

---

## Managing Admin Users

### View All Admin Users

**Using PostgreSQL:**
```sql
SELECT id, username, email, created_at 
FROM admin_users 
ORDER BY created_at DESC;
```

**Expected output:**
```
 id | username |      email       |     created_at      
----+----------+------------------+---------------------
  1 | admin    | NULL             | 2024-10-18 15:30:00
  2 | sarah    | sarah@email.com  | 2024-10-19 10:30:00
```

---

### Change Admin Password

**Using the script (easiest):**

1. **Delete the old user:**
   ```sql
   DELETE FROM admin_users WHERE username = 'username';
   ```

2. **Re-add with new password:**
   ```bash
   node scripts/add-admin.js
   ```

**Or update directly in database:**

1. **Generate new password hash:**
   ```javascript
   const bcrypt = require('bcrypt');
   bcrypt.hash('new-password', 10, (err, hash) => {
       console.log(hash);
   });
   ```

2. **Update in database:**
   ```sql
   UPDATE admin_users 
   SET password_hash = 'new-hashed-password'
   WHERE username = 'username';
   ```

---

### Remove Admin User

**Using PostgreSQL:**
```sql
DELETE FROM admin_users WHERE username = 'username';
```

**⚠️ Warning:** Make sure you don't delete the last admin user!

**Check before deleting:**
```sql
SELECT COUNT(*) FROM admin_users;
```

---

## Best Practices 🔒

### 1. **Strong Passwords**
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, symbols
- Don't use common passwords like "password123"

**Good examples:**
- `P@ssw0rd2024!`
- `SecureAdmin#99`
- `MyC0mplex!Pass`

### 2. **Change Default Password**
The default admin account (`admin`/`admin123`) should be changed:

**Option A: Change password**
```sql
-- Generate hash for new password first
UPDATE admin_users 
SET password_hash = '$2b$10$NEW_HASH_HERE'
WHERE username = 'admin';
```

**Option B: Delete and create new admin**
```sql
-- First create new admin
node scripts/add-admin.js

-- Then delete default admin
DELETE FROM admin_users WHERE username = 'admin';
```

### 3. **Use Email Addresses**
Always add email addresses for password recovery (future feature):
```bash
node scripts/add-admin.js
# Enter email when prompted
```

### 4. **Limit Admin Users**
Only create admin accounts for people who need them. Fewer admins = better security.

### 5. **Regular Audits**
Periodically review who has admin access:
```sql
SELECT username, email, created_at, last_login 
FROM admin_users;
```

---

## Troubleshooting 🔧

### "Username already exists" error
The username is already taken. Choose a different username or delete the existing user first.

### "Password must be at least 6 characters"
Use a longer password. We recommend 8+ characters.

### "Connection refused" when running script
Make sure:
1. PostgreSQL is running
2. Database credentials are correct in `config/database-local.js`
3. You're in the backend directory

### "bcrypt not found"
Install dependencies:
```bash
cd backend
npm install
```

### Can't connect to database
Check your connection string in `backend/config/database-local.js`:
```javascript
postgresql://username:password@host/database
```

---

## Quick Reference Commands

### Add new admin:
```bash
node scripts/add-admin.js
```

### List all admins:
```sql
SELECT * FROM admin_users;
```

### Delete admin:
```sql
DELETE FROM admin_users WHERE username = 'username';
```

### Change password:
```sql
-- Generate hash first, then:
UPDATE admin_users SET password_hash = 'new_hash' WHERE username = 'user';
```

### Count total admins:
```sql
SELECT COUNT(*) FROM admin_users;
```

---

## Example Scenarios

### Scenario 1: Adding a Team Member
**Sarah joins the team and needs admin access:**
```bash
cd backend
node scripts/add-admin.js
# Username: sarah
# Password: Sarah#2024Secure
# Email: sarah@company.com
```

✅ Sarah can now login at the admin panel!

---

### Scenario 2: Employee Leaves
**John left the company, remove his access:**
```sql
DELETE FROM admin_users WHERE username = 'john';
```

✅ John can no longer access the admin panel.

---

### Scenario 3: Forgot Password
**You forgot your password:**

1. **Create new admin account:**
   ```bash
   node scripts/add-admin.js
   # Username: admin2
   # Password: NewPassword123!
   ```

2. **Login with new account**

3. **Delete old account:**
   ```sql
   DELETE FROM admin_users WHERE username = 'old-username';
   ```

---

### Scenario 4: Production Setup
**Setting up for first time in production:**

1. **Login as default admin** (`admin`/`admin123`)

2. **Create your personal admin account:**
   ```bash
   node scripts/add-admin.js
   # Username: your-name
   # Password: YourSecurePassword!
   ```

3. **Test new account** - logout and login with new credentials

4. **Delete default admin:**
   ```sql
   DELETE FROM admin_users WHERE username = 'admin';
   ```

✅ Now only your secure account has access!

---

## Security Tips 🛡️

1. **Never share passwords** - each person gets their own account
2. **Use unique passwords** - don't reuse passwords from other sites
3. **Enable 2FA** (coming in future update)
4. **Regular password changes** - update passwords every 3-6 months
5. **Monitor login attempts** - check analytics for suspicious activity
6. **Remove inactive users** - delete accounts that are no longer needed

---

## Database Schema

The `admin_users` table structure:

```sql
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

---

## Support

Need help? Check:
- `SECURE-AUTH-GUIDE.md` - Authentication system docs
- `AUTH-IMPLEMENTATION-SUMMARY.md` - Technical details
- Backend console logs - Run `node server.js` to see errors

---

**Last Updated:** October 2024  
**Version:** 1.0

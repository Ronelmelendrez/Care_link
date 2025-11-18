# 🚀 Quick Start Guide - CareLink Database

## ⚡ Fast Setup (5 minutes)

### Step 1: Go to Supabase
1. Visit [app.supabase.com](https://app.supabase.com/)
2. Sign in or create account
3. Create a new project or select existing one

### Step 2: Run SQL Script
1. Click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy all content from `supabase_schema.sql`
4. Paste and click **Run**
5. Wait for success message ✅

### Step 3: Get Your Keys
1. Go to **Settings** → **API**
2. Copy **Project URL**
3. Copy **anon public key**

### Step 4: Update .env File
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: Restart Server
```powershell
# Stop current server (Ctrl+C)
npm run dev
```

### Step 6: Test It!
1. Open http://localhost:5174/
2. Register as Doctor
3. Create time slots
4. Register as Patient (new email)
5. Book appointment
6. Done! 🎉

---

## 📊 What Was Created

### 3 Tables:
- ✅ **profiles** - Users (Patients & Doctors)
- ✅ **available_slots** - Doctor's time slots
- ✅ **appointments** - Bookings

### Security:
- ✅ Row Level Security enabled
- ✅ Only users can access their own data
- ✅ Doctors manage their slots
- ✅ Patients manage their appointments

### Automation:
- ✅ Auto-update timestamps
- ✅ Auto-manage slot booking status
- ✅ Prevent double bookings

---

## 🧪 Quick Test

### Test 1: Register Doctor
```
Email: doctor@test.com
Password: test123
Role: Doctor
Specialty: General Medicine
```

### Test 2: Create Slot
- Pick tomorrow's date
- Choose 9:00 AM
- Duration: 30 minutes

### Test 3: Register Patient
```
Email: patient@test.com
Password: test123
Role: Patient
```

### Test 4: Book Appointment
- Select the doctor
- Choose the available slot
- Confirm booking

---

## 🔍 Verify in Supabase

Go to **Table Editor**:
- **profiles** → Should show 2 users
- **available_slots** → Should show 1 slot (is_booked = true)
- **appointments** → Should show 1 appointment (status = pending)

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `supabase_schema.sql` | Complete SQL script |
| `DATABASE_SETUP.md` | Detailed setup guide |
| `DATABASE_DIAGRAM.txt` | Visual schema diagram |
| `QUICK_START.md` | This file |

---

## ❓ Common Issues

### "No Supabase URL/Key found"
→ Check your `.env` file  
→ Restart dev server

### "Permission denied"
→ RLS policies are working  
→ Make sure you're logged in

### "Slot already booked"
→ This is correct behavior  
→ Try a different time slot

### Can't see data
→ Check Supabase Table Editor  
→ Verify RLS policies

---

## 🎯 Next Features to Add

- ✅ Email notifications
- ✅ Appointment reminders
- ✅ Patient history
- ✅ Doctor reviews
- ✅ Video consultations
- ✅ Prescription management

---

## 📞 Need Help?

1. Check `DATABASE_SETUP.md` for details
2. Check `DATABASE_DIAGRAM.txt` for schema
3. Check browser console for errors
4. Check Supabase logs in dashboard

---

**You're all set! Start building! 🚀**

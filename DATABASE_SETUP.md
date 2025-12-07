# CareLink Database Setup Guide

## 📋 Overview

This guide will help you set up the complete database structure for the CareLink University Clinic Appointment System in Supabase.

## 🗄️ Database Structure

### Tables Created:

1. **profiles** - Stores user information (Patients & Doctors)
2. **available_slots** - Stores doctor's available time slots
3. **appointments** - Stores appointment bookings

### Features Included:

✅ Row Level Security (RLS) policies for data protection  
✅ Automatic timestamp updates  
✅ Automatic slot booking status management  
✅ Indexes for better performance  
✅ Referential integrity with foreign keys  
✅ Data validation with CHECK constraints

---

## 🚀 Setup Instructions

### Step 1: Access Supabase Dashboard

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Sign in to your account
3. Select your project (or create a new one)

### Step 2: Run the SQL Schema

1. Click on **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `supabase_schema.sql` in this folder
4. Copy **ALL** the SQL content
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Installation

After running the script, you should see:

- ✅ 3 tables created successfully
- ✅ Multiple indexes created
- ✅ RLS policies enabled
- ✅ Triggers created

You can verify by:

1. Going to **Table Editor** in Supabase
2. You should see: `profiles`, `available_slots`, and `appointments` tables

### Step 4: Get Your Supabase Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy your **Project URL**
3. Copy your **anon/public key**

### Step 5: Update Your .env File

Replace the placeholders in your `.env` file with your actual credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 📊 Database Schema Details

### 1. Profiles Table

Stores information for all users (Patients, Doctors, Staff)

| Column     | Type      | Description                          |
| ---------- | --------- | ------------------------------------ |
| id         | UUID      | Primary key (linked to auth.users)   |
| role       | VARCHAR   | User role: Patient, Doctor, or Staff |
| first_name | VARCHAR   | User's first name                    |
| last_name  | VARCHAR   | User's last name                     |
| email      | VARCHAR   | User's email (unique)                |
| phone      | VARCHAR   | Phone number (optional)              |
| specialty  | VARCHAR   | Doctor's specialty (optional)        |
| created_at | TIMESTAMP | Record creation time                 |
| updated_at | TIMESTAMP | Last update time                     |

### 2. Available Slots Table

Stores time slots created by doctors

| Column     | Type      | Description                       |
| ---------- | --------- | --------------------------------- |
| id         | UUID      | Primary key                       |
| doctor_id  | UUID      | Reference to doctor's profile     |
| date       | DATE      | Slot date                         |
| time       | TIME      | Slot time                         |
| duration   | INTEGER   | Duration in minutes (default: 30) |
| is_booked  | BOOLEAN   | Booking status                    |
| notes      | TEXT      | Additional notes (optional)       |
| created_at | TIMESTAMP | Record creation time              |
| updated_at | TIMESTAMP | Last update time                  |

### 3. Appointments Table

Stores appointment bookings

| Column     | Type      | Description                              |
| ---------- | --------- | ---------------------------------------- |
| id         | UUID      | Primary key                              |
| patient_id | UUID      | Reference to patient's profile           |
| slot_id    | UUID      | Reference to time slot                   |
| status     | VARCHAR   | pending, confirmed, cancelled, completed |
| notes      | TEXT      | Doctor's notes (optional)                |
| created_at | TIMESTAMP | Record creation time                     |
| updated_at | TIMESTAMP | Last update time                         |

---

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

**Profiles:**

- ✅ Users can view all profiles
- ✅ Users can only insert/update their own profile

**Available Slots:**

- ✅ Anyone can view slots
- ✅ Only doctors can create/update/delete their own slots

**Appointments:**

- ✅ Patients can view their own appointments
- ✅ Doctors can view appointments for their slots
- ✅ Patients can create and cancel appointments
- ✅ Doctors can update appointment status

---

## 🔄 Automatic Features

### 1. Auto-Update Timestamps

All tables automatically update the `updated_at` field when a record is modified.

### 2. Auto-Manage Slot Booking

When an appointment is:

- **Created** → Slot is marked as booked (`is_booked = true`)
- **Cancelled** → Slot becomes available (`is_booked = false`)
- **Deleted** → Slot becomes available (`is_booked = false`)

---

## 🧪 Testing Your Database

### Test 1: Create a Test Doctor Account

1. Go to your app and register as a Doctor
2. Fill in all required fields including specialty
3. Check the `profiles` table - you should see your record

### Test 2: Create Available Slots

1. Login as the doctor
2. Create some time slots for future dates
3. Check the `available_slots` table

### Test 3: Book an Appointment

1. Register a patient account
2. Select the doctor you created
3. Book one of the available slots
4. Check:
   - `appointments` table should have a new record
   - The corresponding slot in `available_slots` should have `is_booked = true`

---

## 🐛 Troubleshooting

### Issue: "relation does not exist"

**Solution:** Make sure you ran the entire SQL script. Go back to SQL Editor and run it again.

### Issue: "permission denied"

**Solution:** Check if RLS policies are correctly set up. You may need to review the policies section in the SQL script.

### Issue: "duplicate key value"

**Solution:** This is expected if you're trying to create duplicate records. Check the UNIQUE constraints in the schema.

### Issue: "foreign key constraint"

**Solution:** Make sure the referenced records exist. For example, a doctor must exist in `profiles` before creating slots.

---

## 📝 Next Steps

After setting up the database:

1. ✅ Update your `.env` file with Supabase credentials
2. ✅ Restart your development server (`npm run dev`)
3. ✅ Test user registration (both Patient and Doctor)
4. ✅ Test appointment booking flow
5. ✅ Test doctor's slot management

---

## 🆘 Need Help?

If you encounter any issues:

1. Check the Supabase logs in the Dashboard
2. Verify your RLS policies are correct
3. Make sure your `.env` file has the correct credentials
4. Check browser console for any JavaScript errors

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Your CareLink database is ready to use! 🎉**

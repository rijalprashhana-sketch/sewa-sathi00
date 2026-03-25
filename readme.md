# SewaSathi — Home Services Platform

## 🚀 Setup & Run

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Start MongoDB
Make sure MongoDB is running locally on port 27017.

### 3. Seed the database (adds sample workers including doctors)
```bash
# Run from the project root folder (not inside server/)
node seed/workers-customers.js
```

### 4. Start the server
```bash
cd server
npm start
```

### 5. Open the website
Visit: http://localhost:5000

---

## 🗂️ Worker Categories
| Category ID | Display Name  | Example Professions              |
|-------------|---------------|----------------------------------|
| plumbing    | Plumbers      | Plumber                          |
| electrical  | Electricians  | Electrician, AC Mechanic         |
| painting    | Painters      | Painter                          |
| cleaning    | Housemaids    | Housemaid, Cleaner, Cook         |
| carpentry   | Carpenters    | Carpenter, Welder                |
| health      | Doctors       | Doctor, Nurse, Physiotherapist   |
| other       | Others        | Driver, Tutor, Security Guard    |

---

## 🔑 Sample Credentials (after seeding)

Workers password: `worker123`
- rajesh.electrician@sewasathi.com (Electrician)
- priya.plumber@sewasathi.com (Plumber)
- amit.carpenter@sewasathi.com (Carpenter)
- sunita.cleaner@sewasathi.com (Housemaid)
- vikram.painter@sewasathi.com (Painter)
- ali.acrepair@sewasathi.com (AC Mechanic)
- anjali.doctor@sewasathi.com (Doctor)
- suresh.doctor@sewasathi.com (Doctor)
- kavita.nurse@sewasathi.com (Nurse)
- ramesh.physio@sewasathi.com (Physiotherapist)

Customers password: `customer123`
- rahul.mehta@gmail.com
- neha.gupta@yahoo.com

---

## 🔧 Key Bug Fixes

1. Workers not appearing on services page — renderWorkers() was doing profession.includes(categoryId) which never matched real profession names like "Plumber" against "plumbing". Fixed with a dedicated `category` field.
2. City not saved to MongoDB — authController destructured city but never put it in userData.
3. Added Health/Doctor category throughout frontend and backend.
4. Register form profession changed from free-text to structured dropdown that auto-sets category.
5. Seed DB name unified to `sewasathi`.
6. Removed mysql2 dependency (project uses MongoDB only).

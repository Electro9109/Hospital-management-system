# 🏥 MediCare Hospital Management System

A comprehensive web-based hospital management system built with **Node.js/Express** and **Oracle Database**, designed to streamline healthcare operations and improve hospital workflow management.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Demo Credentials](#demo-credentials)
- [Project Structure](#project-structure)
- [Key Features by Role](#key-features-by-role)
- [API Routes](#api-routes)
- [Database Schema](#database-schema)

---

## ✨ Features

### Core Functionality
- **User Authentication** - Role-based login system with secure password hashing (bcryptjs)
- **Patient Management** - Register, view, and manage patient records with medical history
- **Appointment Scheduling** - Book, track, and manage doctor appointments
- **Doctor Management** - Doctor profiles, specializations, availability slots, and consultation fees
- **Prescriptions** - Digital prescription creation, verification, and medicine tracking
- **Room Management** - Hospital room inventory, availability status, and department assignment
- **Staff Management** - Staff roster, role assignments, department allocation, and shift scheduling
- **Billing** - Generate invoices and track payment status
- **Department Management** - Organize hospital departments with staff and room allocation

### Role-Based Access Control
- **Admin** - Full system access, user management, reporting
- **Receptionist** - Patient check-in, appointment booking, billing
- **Doctor** - View patient info, write prescriptions, manage appointments
- **Nurse** - Floor management, patient care coordination, shift tracking

---

## 💻 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Node.js v20+, Express.js v5.2.1 |
| **Frontend** | EJS (Embedded JavaScript Templates) |
| **Database** | Oracle Database 23c FREE Edition |
| **Language** | JavaScript (ES6+) |
| **Authentication** | bcryptjs, express-session |
| **Database Driver** | oracledb v6.10.0 (thin mode) |
| **CSS** | Custom responsive CSS |

---

## 🔧 System Requirements

### Prerequisites
- **Node.js** v20 or higher
- **Oracle Database** 23c FREE Edition (or any Oracle 19c+)
- **npm** (comes with Node.js)
- **Windows** (or applicable OS with Oracle support)

### Recommended Hardware
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 1GB for Oracle + 500MB for application
- **CPU**: 2 cores minimum

### Oracle Database
The system expects Oracle FREE edition listening on:
```
Database: FREE
Host: localhost
Port: 1521
Connection String: localhost:1521/FREE
```

---

## 📦 Installation

### 1. Clone or Download the Project

```bash
cd C:\Users\ASUS\Coding\hospital
```

### 2. Install Dependencies

```bash
npm install
```

**Key npm packages installed:**
- `express@5.2.1` - Web framework
- `ejs@3.1.9` - Templating engine
- `oracledb@6.10.0` - Oracle database driver
- `bcryptjs@3.0.3` - Password hashing
- `express-session@1.19.0` - Session management
- `dotenv@16.3.1` - Environment variable management

### 3. Configure Environment Variables

Create or update `.env` file in the root directory:

```env
DB_USER=system
DB_PASSWORD=iam100k
DB_CONNECT_STRING=localhost:1521/FREE
PORT=3000
SESSION_SECRET=hospital_secret
```

**⚠️ Important:** Update `DB_PASSWORD` with your actual Oracle SYSTEM password.

---

## 🗄️ Database Setup

### Option 1: Automated Setup (Recommended)

Run the setup script to create all tables and seed demo data:

```bash
node db/setup-db.js
```

This script will:
- ✅ Create 12 tables with proper constraints
- ✅ Insert 6 demo users (Admin, Receptionist, Doctor, Nurse)
- ✅ Create 5 departments with doctors and staff
- ✅ Seed 4 patients with medical records
- ✅ Add sample appointments and prescriptions

### Option 2: Create BILLING Table (if needed)

```bash
node db/create-billing.js
```

### Manual Database Setup

If you prefer to create tables manually, connect to Oracle and execute the SQL from [db/setup-db.js](db/setup-db.js). The schema includes:

**Tables:**
1. `USERS` - System users with roles
2. `DEPARTMENT` - Hospital departments
3. `PATIENT` - Patient records with demographics
4. `DOCTOR` - Doctor profiles and specializations
5. `STAFF` - Staff members (nurses, etc.)
6. `ROOM` - Hospital rooms and availability
7. `DOCTOR_AVAILABILITY` - Doctor consultation slots
8. `MEDICINE` - Pharmacy medicines
9. `APPOINTMENT` - Patient appointments
10. `PRESCRIPTION` - Doctor prescriptions
11. `PRESCRIPTION_MEDICINE` - Medicine-prescription mapping
12. `STAFF_SHIFT` - Staff shift schedules
13. `BILLING` - Invoice and payment tracking

---

## 🚀 Running the Application

### Start the Server

```bash
node server.js
```

Expected output:
```
✅ Oracle DB connection pool created
🏥 Hospital Management System running at http://localhost:3000
```

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You'll be redirected to the login page. Enter credentials from the [Demo Credentials](#demo-credentials) section.

### Stop the Server

Press `Ctrl + C` in the terminal.

---

## 👤 Demo Credentials

Use these test accounts to explore the system:

| Username | Password | Role | Access |
|----------|----------|------|--------|
| `admin1` | `Admin@123` | Admin | Full system access, dashboards |
| `recept1` | `Recept@123` | Receptionist | Patients, appointments, billing |
| `dr.arun` | `DrArun@123` | Doctor | My schedule, prescriptions |
| `nurse.anitha` | `Nurse@123` | Nurse | Floor view, shifts, rooms |

**⚠️ Security Note:** These are demo credentials only. Change passwords in production.

---

## 📁 Project Structure

```
hospital/
├── routes/                    # Express route handlers (10 modules)
│   ├── auth.js               # Login/logout/authentication
│   ├── dashboard.js          # Role-specific dashboards
│   ├── patients.js           # Patient management
│   ├── appointments.js       # Appointment booking & tracking
│   ├── doctors.js            # Doctor profiles & availability
│   ├── prescriptions.js      # Prescription management
│   ├── rooms.js              # Room availability & allocation
│   ├── billing.js            # Invoice generation
│   ├── staff.js              # Staff & shift management
│   └── departments.js        # Department management
│
├── views/                     # EJS templates
│   ├── auth/                 # Login page
│   ├── dashboard/            # Role-based dashboards
│   ├── patients/             # Patient views
│   ├── appointments/         # Appointment views
│   ├── doctors/              # Doctor profiles
│   ├── prescriptions/        # Prescription forms
│   ├── rooms/                # Room management
│   ├── billing/              # Invoice pages
│   ├── staff/                # Staff & shifts
│   ├── departments/          # Department views
│   ├── errors/               # Error pages (403, 404, 500)
│   └── partials/             # Reusable components
│       ├── header.ejs        # Page header
│       ├── sidebar.ejs       # Navigation sidebar
│       └── footer.ejs        # Page footer
│
├── public/                    # Static files
│   ├── css/
│   │   └── style.css         # Main stylesheet
│   └── js/
│       └── app.js            # Client-side JavaScript
│
├── db/                        # Database utilities
│   ├── connection.js         # Oracle connection pool
│   ├── setup-db.js           # Database initialization
│   ├── create-billing.js     # BILLING table creation
│   └── seed.js               # Original seed script
│
├── middleware/                # Express middleware
│   ├── auth.js               # Authentication checks
│   └── helpers.js            # EJS helper functions
│
├── server.js                  # Express server entry point
├── .env                       # Environment configuration
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

---

## 🎯 Key Features by Role

### 👨‍💼 Admin Dashboard
- System statistics (patients, doctors, rooms, appointments)
- Department breakdown with staff and resource allocation
- Recent appointments history
- Monthly revenue tracking
- User management interface

### 👩‍💼 Receptionist Dashboard
- Today's appointments list
- Room availability overview
- Patient statistics
- Pending billing records
- Quick access to patient check-in

### 🩺 Doctor Dashboard
- My appointments for today
- Upcoming appointments (7 days)
- Patient medical history
- Prescription writing interface
- Consultation fee management

### 👩‍⚕️ Nurse Dashboard
- Floor view with room status
- Active appointments requiring workflow updates
- My shifts this week
- Patient care coordination
- Equipment and supply tracking

---

## 🔗 API Routes

### Authentication
- `GET /login` - Login page
- `POST /login` - Submit login credentials
- `GET /logout` - Logout user

### Dashboard
- `GET /dashboard` - Role-based dashboard (protected)

### Patients
- `GET /patients` - List all patients
- `GET /patients/:id` - Patient detail view
- `POST /patients` - Register new patient
- `GET /patients/:id/appointments` - Patient's appointments

### Appointments
- `GET /appointments` - List appointments
- `POST /appointments` - Book new appointment
- `GET /appointments/:id` - Appointment details
- `PATCH /appointments/:id` - Update appointment status
- `DELETE /appointments/:id` - Cancel appointment

### Doctors
- `GET /doctors` - List doctors
- `GET /doctors/:id` - Doctor profile
- `GET /doctors/availability` - Doctor availability slots

### Prescriptions
- `GET /prescriptions` - List prescriptions
- `POST /prescriptions` - Create prescription
- `GET /prescriptions/:id` - View prescription details

### Rooms
- `GET /rooms` - List hospital rooms
- `PATCH /rooms/:id/status` - Update room status

### Billing
- `GET /billing` - List bills
- `GET /billing/generate/:appointmentId` - Generate invoice
- `POST /billing/generate/:appointmentId` - Save bill
- `GET /billing/:id` - View invoice

### Staff
- `GET /staff` - List staff members
- `GET /staff/shifts` - My shifts
- `POST /staff/shifts` - Add shift

### Departments
- `GET /departments` - List departments
- `GET /departments/:id` - Department details

---

## 🗃️ Database Schema

### USERS Table
```sql
user_id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
username        VARCHAR2(50) NOT NULL UNIQUE
password        VARCHAR2(255) NOT NULL (bcrypt hash)
role            VARCHAR2(20) CHECK (role IN ('Doctor','Patient','Receptionist','Nurse','Admin'))
status          VARCHAR2(10) CHECK (status IN ('Active','Inactive'))
created_at      DATE DEFAULT SYSDATE
```

### APPOINTMENT Table
```sql
appointment_id      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
patient_id         NUMBER NOT NULL FOREIGN KEY
doctor_id          NUMBER NOT NULL FOREIGN KEY
room_id            NUMBER FOREIGN KEY
staff_id           NUMBER FOREIGN KEY
created_by_user_id NUMBER NOT NULL FOREIGN KEY
appointment_date   DATE NOT NULL
start_time         VARCHAR2(5) NOT NULL (HH:MM format)
end_time           VARCHAR2(5) NOT NULL
status             VARCHAR2(15) CHECK (status IN ('Scheduled','Completed','Cancelled'))
workflow_stage     VARCHAR2(50) DEFAULT 'Booked'
```

### PRESCRIPTION Table
```sql
prescription_id      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
appointment_id      NUMBER NOT NULL UNIQUE FOREIGN KEY
verified_by_staff_id NUMBER FOREIGN KEY
diagnosis           VARCHAR2(500)
notes               VARCHAR2(1000)
follow_up_date      DATE
```

---

## 🚨 Troubleshooting

### Connection Error: "Cannot connect to host 127.0.0.1 port 1521"

**Solution:** Ensure Oracle Database is running:
```bash
# Windows Command Prompt
sqlplus -v  # Check if SQL*Plus works

# Or check Oracle services
Get-Service | Where-Object {$_.Name -like "*Oracle*"}
```

### Error: "ORA-00904: invalid identifier"

**Solution:** Column name mismatch in SQL query. All column references should match the schema:
- Use `APPOINTMENT_DATE` (not `DATE_OF_VISIT`)
- Use `ROOM_TYPE` (not `TYPE`)
- Use `CONSULTATION_FEE` (not `FEE`)

### Error: "ORA-02290: check constraint violated"

**Solution:** Ensure role values are capitalized:
- `'Admin'`, `'Doctor'`, `'Nurse'`, `'Receptionist'`, `'Patient'` (not lowercase)
- `'Active'`, `'Inactive'` (not lowercase)

### Port 3000 Already in Use

**Solution:** Change the port or kill the process:
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env:
PORT=3001
```

### EJS Template Syntax Errors

**Solution:** Check template files for proper bracket matching:
- `<%` ... `%>` for code
- `<%=` ... `%>` for output
- `<%- include() %>` for partials (no escaping)

---

## 🔐 Security Considerations

### In Development ✅
- Demo credentials provided for testing
- Password hashing with bcryptjs (10 salt rounds)
- Session-based authentication
- Role-based access control (RBAC)

### In Production ⚠️
- Change all demo user passwords immediately
- Use strong, unique `.env` secrets
- Enable HTTPS/SSL
- Implement rate limiting
- Add request validation
- Use CORS appropriately
- Enable SQL injection prevention
- Implement comprehensive logging
- Regular security audits

---

## 📝 License

This is a demonstration/educational hospital management system. Use at your own discretion.

---

## 👨‍💻 Development Notes

### Adding New Routes

1. Create handler in `routes/newfeature.js`
2. Import and mount in `server.js`:
   ```javascript
   const newFeatureRoutes = require('./routes/newfeature');
   app.use('/newfeature', newFeatureRoutes);
   ```
3. Create EJS templates in `views/newfeature/`
4. Add sidebar navigation in `views/partials/sidebar.ejs`

### Database Modifications

1. Update `db/setup-db.js` to include new tables
2. Run `node db/setup-db.js` to rebuild database
3. Update Oracle connection strings if needed

### Adding Middleware

Place custom middleware in `middleware/` folder and require in `server.js`.

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review error messages in server logs
3. Verify database connection string in `.env`
4. Ensure all dependencies are installed: `npm install`

---

## 🎉 Quick Start Cheatsheet

```bash
# Install dependencies
npm install

# Setup database and seed data
node db/setup-db.js

# Start the server
node server.js

# Access the application
# Open browser: http://localhost:3000

# Login with
# Username: admin1
# Password: Admin@123
```

---

**Last Updated:** March 26, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅

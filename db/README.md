# Database Setup & Initialization

This directory contains the scripts and configurations required to set up the Oracle 23c database for the Hospital Management System.

## Files Overview

### Configuration
* **`connection.js`**: Exports the Oracle database connection pool configuration and a helper wrapper around `oracledb.getConnection()`.

### Automated Setup (Recommended)
* **`setup-db.js`**: The main, comprehensive script. It drops existing tables (if any), creates the database schema from scratch, and seeds a robust set of demo data for all roles and workflows (Admin, Doctor, Receptionist, Nurse, Patients, Appointments, etc.).
  * **Run with:** `node db/setup-db.js`

### Manual / Partial Scripts
* **`setup.sql`**: Contains raw SQL commands for the `BILLING` table and ID generation `SEQUENCES`. You can execute this directly in SQL*Plus or Oracle SQL Developer if you prefer manual setup over the automated scripts.
* **`create-billing.js`**: A dedicated script to create only the `BILLING` table and corresponding sequence if the rest of the database is already initialized.
* **`seed.js` / `seed-clean.js`**: Scripts dedicated to purely inserting demo data. Usually, `setup-db.js` handles seeding immediately after schema creation, but these can be used if you need to re-seed without dropping tables.

## Prerequisites
Ensure your `.env` file in the root project directory is properly configured with your Oracle database credentials:
```env
DB_USER=system
DB_PASSWORD=your_password
DB_CONNECT_STRING=localhost:1521/FREE
```

## Quick Start
To perform a full wipe and installation of the database schema and sample data, navigate to the root directory of the project and run:

```bash
node db/setup-db.js
```

/**
 * Database Setup - Creates schema and seed data
 * Recreates all tables with proper constraints and inserts demo data
 * Run: node db/setup-db.js
 */

const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');

async function setupDB() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionString: process.env.DB_CONNECT_STRING
    });
    console.log('✅ Connected to Oracle\n');

    // ============================================================
    // CREATE ALL TABLES
    // ============================================================
    console.log('📋 Creating tables...');

    await conn.execute(`
      CREATE TABLE USERS (
        user_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        username   VARCHAR2(50)  NOT NULL UNIQUE,
        password   VARCHAR2(255) NOT NULL,
        role       VARCHAR2(20)  NOT NULL CHECK (role IN ('Doctor','Patient','Receptionist','Nurse','Admin')),
        status     VARCHAR2(10)  DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
        created_at DATE          DEFAULT SYSDATE
      )
    `);
    console.log('  ✓ USERS');

    await conn.execute(`
      CREATE TABLE DEPARTMENT (
        department_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        dept_name     VARCHAR2(100) NOT NULL,
        location      VARCHAR2(100),
        floor_no      NUMBER
      )
    `);
    console.log('  ✓ DEPARTMENT');

    await conn.execute(`
      CREATE TABLE PATIENT (
        patient_id  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id     NUMBER,
        name        VARCHAR2(100) NOT NULL,
        phone       VARCHAR2(15),
        dob         DATE,
        gender      VARCHAR2(10)  CHECK (gender IN ('Male','Female','Other')),
        email       VARCHAR2(100),
        blood_group VARCHAR2(5),
        CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES USERS(user_id)
      )
    `);
    console.log('  ✓ PATIENT');

    await conn.execute(`
      CREATE TABLE DOCTOR (
        doctor_id        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id          NUMBER NOT NULL,
        department_id    NUMBER NOT NULL,
        name             VARCHAR2(100) NOT NULL,
        specialization   VARCHAR2(100),
        phone            VARCHAR2(15),
        consultation_fee NUMBER(8,2),
        CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES USERS(user_id),
        CONSTRAINT fk_doctor_dept FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id)
      )
    `);
    console.log('  ✓ DOCTOR');

    await conn.execute(`
      CREATE TABLE STAFF (
        staff_id      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id       NUMBER,
        department_id NUMBER NOT NULL,
        name          VARCHAR2(100) NOT NULL,
        role          VARCHAR2(50),
        phone         VARCHAR2(15),
        hire_date     DATE,
        CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES USERS(user_id),
        CONSTRAINT fk_staff_dept FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id)
      )
    `);
    console.log('  ✓ STAFF');

    await conn.execute(`
      CREATE TABLE ROOM (
        room_id           NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        department_id     NUMBER NOT NULL,
        assigned_staff_id NUMBER,
        room_number       VARCHAR2(10) NOT NULL UNIQUE,
        room_type         VARCHAR2(50),
        status            VARCHAR2(10) DEFAULT 'Available' CHECK (status IN ('Available','Occupied','Cleaning')),
        capacity          NUMBER DEFAULT 1,
        CONSTRAINT fk_room_dept  FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id),
        CONSTRAINT fk_room_staff FOREIGN KEY (assigned_staff_id) REFERENCES STAFF(staff_id)
      )
    `);
    console.log('  ✓ ROOM');

    await conn.execute(`
      CREATE TABLE DOCTOR_AVAILABILITY (
        availability_id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        doctor_id             NUMBER NOT NULL,
        day_of_week           VARCHAR2(3) CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
        start_time            VARCHAR2(5),
        end_time              VARCHAR2(5),
        slot_duration_minutes NUMBER DEFAULT 30,
        CONSTRAINT fk_avail_doctor FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id)
      )
    `);
    console.log('  ✓ DOCTOR_AVAILABILITY');

    await conn.execute(`
      CREATE TABLE MEDICINE (
        medicine_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name        VARCHAR2(100) NOT NULL,
        dosage_form VARCHAR2(50),
        strength    VARCHAR2(50),
        unit_price  NUMBER(8,2)
      )
    `);
    console.log('  ✓ MEDICINE');

    await conn.execute(`
      CREATE TABLE APPOINTMENT (
        appointment_id     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        patient_id         NUMBER NOT NULL,
        doctor_id          NUMBER NOT NULL,
        room_id            NUMBER,
        staff_id           NUMBER,
        created_by_user_id NUMBER NOT NULL,
        appointment_date   DATE NOT NULL,
        start_time         VARCHAR2(5) NOT NULL,
        end_time           VARCHAR2(5) NOT NULL,
        status             VARCHAR2(15) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','Completed','Cancelled')),
        workflow_stage     VARCHAR2(50) DEFAULT 'Booked',
        CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id),
        CONSTRAINT fk_appt_doctor  FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id),
        CONSTRAINT fk_appt_room    FOREIGN KEY (room_id) REFERENCES ROOM(room_id),
        CONSTRAINT fk_appt_staff   FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id),
        CONSTRAINT fk_appt_user    FOREIGN KEY (created_by_user_id) REFERENCES USERS(user_id)
      )
    `);
    console.log('  ✓ APPOINTMENT');

    await conn.execute(`
      CREATE TABLE PRESCRIPTION (
        prescription_id      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        appointment_id       NUMBER NOT NULL UNIQUE,
        verified_by_staff_id NUMBER,
        diagnosis            VARCHAR2(500),
        notes                VARCHAR2(1000),
        follow_up_date       DATE,
        CONSTRAINT fk_presc_appt  FOREIGN KEY (appointment_id) REFERENCES APPOINTMENT(appointment_id),
        CONSTRAINT fk_presc_staff FOREIGN KEY (verified_by_staff_id) REFERENCES STAFF(staff_id)
      )
    `);
    console.log('  ✓ PRESCRIPTION');

    await conn.execute(`
      CREATE TABLE PRESCRIPTION_MEDICINE (
        prescription_id NUMBER NOT NULL,
        medicine_id     NUMBER NOT NULL,
        dosage          VARCHAR2(50),
        frequency       VARCHAR2(50),
        duration        VARCHAR2(50),
        CONSTRAINT pk_presc_med PRIMARY KEY (prescription_id, medicine_id),
        CONSTRAINT fk_pm_presc  FOREIGN KEY (prescription_id) REFERENCES PRESCRIPTION(prescription_id),
        CONSTRAINT fk_pm_med    FOREIGN KEY (medicine_id) REFERENCES MEDICINE(medicine_id)
      )
    `);
    console.log('  ✓ PRESCRIPTION_MEDICINE');

    await conn.execute(`
      CREATE TABLE STAFF_SHIFT (
        staff_shift_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        staff_id       NUMBER NOT NULL,
        shift_date     DATE NOT NULL,
        start_time     VARCHAR2(5) NOT NULL,
        end_time       VARCHAR2(5) NOT NULL,
        shift_type     VARCHAR2(10) CHECK (shift_type IN ('Morning','Afternoon','Night')),
        CONSTRAINT fk_shift_staff FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id)
      )
    `);
    console.log('  ✓ STAFF_SHIFT\n');

    // ============================================================
    // INSERT DATA
    // ============================================================
    console.log('📝 Inserting demo data...');

    // Hash passwords
    const hash1 = await bcrypt.hash('Admin@123', 10);
    const hash2 = await bcrypt.hash('Recept@123', 10);
    const hash3 = await bcrypt.hash('DrArun@123', 10);
    const hash4 = await bcrypt.hash('DrPriya@123', 10);
    const hash5 = await bcrypt.hash('DrRamesh@123', 10);
    const hash6 = await bcrypt.hash('Nurse@123', 10);

    // 1. USERS (4+ demo accounts)
    await conn.execute(`INSERT INTO USERS (username, password, role, status) VALUES ('admin1', :1, 'Admin', 'Active')`, [hash1]);
    await conn.execute(`INSERT INTO USERS (username, password, role, status) VALUES ('recept1', :1, 'Receptionist', 'Active')`, [hash2]);
    await conn.execute(`INSERT INTO USERS (username, password, role, status) VALUES ('dr.arun', :1, 'Doctor', 'Active')`, [hash3]);
    await conn.execute(`INSERT INTO USERS (username, password, role, status) VALUES ('dr.priya', :1, 'Doctor', 'Active')`, [hash4]);
    await conn.execute(`INSERT INTO USERS (username, password, role, status) VALUES ('dr.ramesh', :1, 'Doctor', 'Active')`, [hash5]);
    await conn.execute(`INSERT INTO USERS (username, password, role, status) VALUES ('nurse.anitha', :1, 'Nurse', 'Active')`, [hash6]);
    console.log('  ✓ 6 Users');

    // 2. DEPARTMENTS
    await conn.execute(`INSERT INTO DEPARTMENT (dept_name, location, floor_no) VALUES ('Cardiology', 'Block A', 2)`);
    await conn.execute(`INSERT INTO DEPARTMENT (dept_name, location, floor_no) VALUES ('Neurology', 'Block B', 3)`);
    await conn.execute(`INSERT INTO DEPARTMENT (dept_name, location, floor_no) VALUES ('General Medicine', 'Block A', 1)`);
    await conn.execute(`INSERT INTO DEPARTMENT (dept_name, location, floor_no) VALUES ('Orthopedics', 'Block C', 2)`);
    await conn.execute(`INSERT INTO DEPARTMENT (dept_name, location, floor_no) VALUES ('Pediatrics', 'Block D', 1)`);
    console.log('  ✓ 5 Departments');

    // 3. DOCTORS
    await conn.execute(`INSERT INTO DOCTOR (user_id, department_id, name, specialization, phone, consultation_fee) VALUES (3, 1, 'Dr. Arun Kumar', 'Interventional Cardiologist', '9800000001', 1200)`);
    await conn.execute(`INSERT INTO DOCTOR (user_id, department_id, name, specialization, phone, consultation_fee) VALUES (4, 2, 'Dr. Priya Nair', 'Neurologist', '9800000002', 900)`);
    await conn.execute(`INSERT INTO DOCTOR (user_id, department_id, name, specialization, phone, consultation_fee) VALUES (5, 3, 'Dr. Ramesh Babu', 'General Physician', '9800000003', 500)`);
    console.log('  ✓ 3 Doctors');

    // 4. STAFF
    await conn.execute(`INSERT INTO STAFF (user_id, department_id, name, role, phone, hire_date) VALUES (6, 1, 'Anitha S', 'Nurse', '9700000001', TO_DATE('2020-06-01', 'YYYY-MM-DD'))`);
    await conn.execute(`INSERT INTO STAFF (department_id, name, role, phone, hire_date) VALUES (2, 'Balu K', 'Nurse', '9700000002', TO_DATE('2021-01-15', 'YYYY-MM-DD'))`);
    await conn.execute(`INSERT INTO STAFF (department_id, name, role, phone, hire_date) VALUES (3, 'Chitra M', 'Nurse', '9700000003', TO_DATE('2019-03-10', 'YYYY-MM-DD'))`);
    console.log('  ✓ 3 Staff members');

    // 5. ROOMS
    await conn.execute(`INSERT INTO ROOM (department_id, assigned_staff_id, room_number, room_type, status, capacity) VALUES (1, 1, 'A-101', 'Consultation', 'Available', 1)`);
    await conn.execute(`INSERT INTO ROOM (department_id, room_number, room_type, status, capacity) VALUES (1, 'A-102', 'ICU', 'Available', 2)`);
    await conn.execute(`INSERT INTO ROOM (department_id, assigned_staff_id, room_number, room_type, status, capacity) VALUES (2, 2, 'B-201', 'Consultation', 'Available', 1)`);
    await conn.execute(`INSERT INTO ROOM (department_id, room_number, room_type, status, capacity) VALUES (2, 'B-202', 'Consultation', 'Occupied', 1)`);
    await conn.execute(`INSERT INTO ROOM (department_id, assigned_staff_id, room_number, room_type, status, capacity) VALUES (3, 3, 'A-103', 'Consultation', 'Available', 1)`);
    console.log('  ✓ 5 Rooms');

    // 6. PATIENTS
    await conn.execute(`INSERT INTO PATIENT (name, phone, dob, gender, email, blood_group) VALUES ('Rajesh Murugan', '9876543210', TO_DATE('1990-04-15', 'YYYY-MM-DD'), 'Male', 'rajesh@mail.com', 'B+')`);
    await conn.execute(`INSERT INTO PATIENT (name, phone, dob, gender, email, blood_group) VALUES ('Meena Sundaram', '9876543211', TO_DATE('1985-07-22', 'YYYY-MM-DD'), 'Female', 'meena@mail.com', 'O+')`);
    await conn.execute(`INSERT INTO PATIENT (name, phone, dob, gender, email, blood_group) VALUES ('Arjun Krishnan', '9876543212', TO_DATE('1975-11-03', 'YYYY-MM-DD'), 'Male', 'arjun@mail.com', 'A+')`);
    await conn.execute(`INSERT INTO PATIENT (name, phone, dob, gender, email, blood_group) VALUES ('Lakshmi Devi', '9876543213', TO_DATE('2000-01-28', 'YYYY-MM-DD'), 'Female', 'lakshmi@mail.com', 'AB-')`);
    console.log('  ✓ 4 Patients');

    // 7. MEDICINES
    await conn.execute(`INSERT INTO MEDICINE (name, dosage_form, strength, unit_price) VALUES ('Paracetamol', 'Tablet', '500 mg', 2.50)`);
    await conn.execute(`INSERT INTO MEDICINE (name, dosage_form, strength, unit_price) VALUES ('Amlodipine', 'Tablet', '5 mg', 12.00)`);
    await conn.execute(`INSERT INTO MEDICINE (name, dosage_form, strength, unit_price) VALUES ('Metformin', 'Tablet', '500 mg', 8.00)`);
    await conn.execute(`INSERT INTO MEDICINE (name, dosage_form, strength, unit_price) VALUES ('Cetirizine', 'Tablet', '10 mg', 4.50)`);
    await conn.execute(`INSERT INTO MEDICINE (name, dosage_form, strength, unit_price) VALUES ('Amoxicillin', 'Capsule', '500 mg', 15.00)`);
    console.log('  ✓ 5 Medicines');

    // 8. DOCTOR AVAILABILITY
    await conn.execute(`INSERT INTO DOCTOR_AVAILABILITY (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes) VALUES (1, 'Mon', '09:00', '13:00', 30)`);
    await conn.execute(`INSERT INTO DOCTOR_AVAILABILITY (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes) VALUES (1, 'Wed', '09:00', '13:00', 30)`);
    await conn.execute(`INSERT INTO DOCTOR_AVAILABILITY (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes) VALUES (2, 'Tue', '10:00', '14:00', 30)`);
    await conn.execute(`INSERT INTO DOCTOR_AVAILABILITY (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes) VALUES (3, 'Mon', '08:00', '12:00', 20)`);
    console.log('  ✓ 4 Doctor availability slots');

    // 9. APPOINTMENTS
    await conn.execute(`INSERT INTO APPOINTMENT (patient_id, doctor_id, room_id, staff_id, created_by_user_id, appointment_date, start_time, end_time, status, workflow_stage) 
      VALUES (1, 1, 1, 1, 2, TRUNC(SYSDATE), '09:00', '09:30', 'Scheduled', 'Booked')`);
    await conn.execute(`INSERT INTO APPOINTMENT (patient_id, doctor_id, room_id, staff_id, created_by_user_id, appointment_date, start_time, end_time, status, workflow_stage) 
      VALUES (2, 1, 1, 1, 2, TRUNC(SYSDATE), '10:00', '10:30', 'Scheduled', 'Booked')`);
    await conn.execute(`INSERT INTO APPOINTMENT (patient_id, doctor_id, room_id, staff_id, created_by_user_id, appointment_date, start_time, end_time, status, workflow_stage) 
      VALUES (3, 2, 3, 2, 2, TRUNC(SYSDATE), '11:00', '11:30', 'Scheduled', 'Booked')`);
    console.log('  ✓ 3 Appointments');

    // 10. PRESCRIPTIONS
    await conn.execute(`INSERT INTO PRESCRIPTION (appointment_id, verified_by_staff_id, diagnosis, notes, follow_up_date) 
      VALUES (1, 1, 'Hypertension', 'Low sodium diet, daily BP log', TO_DATE('2026-04-01', 'YYYY-MM-DD'))`);
    console.log('  ✓ 1 Prescription');

    // 11. PRESCRIPTION MEDICINES
    await conn.execute(`INSERT INTO PRESCRIPTION_MEDICINE (prescription_id, medicine_id, dosage, frequency, duration) 
      VALUES (1, 2, '5 mg', 'OD', '60 days')`);
    console.log('  ✓ 1 Prescription medicine');

    // 12. STAFF SHIFTS
    await conn.execute(`INSERT INTO STAFF_SHIFT (staff_id, shift_date, start_time, end_time, shift_type) 
      VALUES (1, TRUNC(SYSDATE), '07:00', '15:00', 'Morning')`);
    await conn.execute(`INSERT INTO STAFF_SHIFT (staff_id, shift_date, start_time, end_time, shift_type) 
      VALUES (2, TRUNC(SYSDATE), '15:00', '23:00', 'Afternoon')`);
    await conn.execute(`INSERT INTO STAFF_SHIFT (staff_id, shift_date, start_time, end_time, shift_type) 
      VALUES (3, TRUNC(SYSDATE), '23:00', '07:00', 'Night')`);
    console.log('  ✓ 3 Staff shifts\n');

    // Commit all changes
    await conn.commit();

    console.log('='.repeat(60));
    console.log('✅ DATABASE SETUP COMPLETE!\n');
    console.log('📝 Test Login Credentials:');
    console.log('  🔐 Admin:       admin1 / Admin@123');
    console.log('  🔐 Receptionist: recept1 / Recept@123');
    console.log('  🔐 Doctor:      dr.arun / DrArun@123');
    console.log('  🔐 Nurse:       nurse.anitha / Nurse@123');
    console.log('='.repeat(60) + '\n');

  } catch (err) {
    console.error('❌ Setup error:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.close();
  }
}

setupDB();

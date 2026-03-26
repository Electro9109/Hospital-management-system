/**
 * Seed Script — Inserts demo data into Oracle DB
 * Run: node db/seed-clean.js
 * 
 * Creates 4 users (one per role), departments, doctors, staff,
 * patients, rooms, medicines, and sample appointments.
 * 
 * DEFAULT PASSWORDS:
 * admin1 / Admin@123
 * recept1 / Recept@123
 * dr.arun / DrArun@123
 * nurse.anitha / Nurse@123
 */

const bcrypt = require('bcryptjs');
const db = require('./connection');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function seed() {
    let connection;
    try {
        await db.initialize();
        connection = await db.getConnection();

        console.log('🔑 Hashing passwords...');
        const hashedAdmin = await bcrypt.hash('Admin@123', 10);
        const hashedRecep = await bcrypt.hash('Recept@123', 10);
        const hashedDoctor = await bcrypt.hash('DrArun@123', 10);
        const hashedNurse = await bcrypt.hash('Nurse@123', 10);

        // ============================
        // USERS (4 roles)
        // ============================
        console.log('👤 Inserting users...');
        await connection.execute(`INSERT INTO USERS (username, password, role, status) VALUES ('admin1', :pw, 'Admin', 'Active')`, [hashedAdmin]);
        await connection.execute(`INSERT INTO USERS (username, password, role, status) VALUES ('recept1', :pw, 'Receptionist', 'Active')`, [hashedRecep]);
        await connection.execute(`INSERT INTO USERS (username, password, role, status) VALUES ('dr.arun', :pw, 'Doctor', 'Active')`, [hashedDoctor]);
        await connection.execute(`INSERT INTO USERS (username, password, role, status) VALUES ('nurse.anitha', :pw, 'Nurse', 'Active')`, [hashedNurse]);

        // ============================
        // DEPARTMENTS
        // ============================
        console.log('🏢 Inserting departments...');
        await connection.execute(`INSERT INTO DEPARTMENT (dept_name, location, floor_no) VALUES ('Cardiology', 'Block A', 2)`);
        await connection.execute(`INSERT INTO DEPARTMENT (dept_name, location, floor_no) VALUES ('Neurology', 'Block B', 3)`);
        await connection.execute(`INSERT INTO DEPARTMENT (dept_name, location, floor_no) VALUES ('General Medicine', 'Block A', 1)`);

        // ============================
        // DOCTOR
        // ============================
        console.log('🩺 Inserting doctors...');
        await connection.execute(`INSERT INTO DOCTOR (user_id, department_id, name, specialization, phone, consultation_fee) VALUES (3, 1, 'Dr. Arun Kumar', 'Cardiologist', '9800000001', 1200)`);
        await connection.execute(`INSERT INTO DOCTOR (department_id, name, specialization, phone, consultation_fee) VALUES (2, 'Dr. Priya Nair', 'Neurologist', '9800000002', 900)`);
        await connection.execute(`INSERT INTO DOCTOR (department_id, name, specialization, phone, consultation_fee) VALUES (3, 'Dr. Ramesh Babu', 'General Physician', '9800000003', 500)`);

        // ============================
        // STAFF (nurses + others)
        // ============================
        console.log('👥 Inserting staff...');
        await connection.execute(`INSERT INTO STAFF (user_id, department_id, name, role, phone, hire_date) VALUES (4, 1, 'Anitha S', 'Nurse', '9700000001', TO_DATE('2020-06-01', 'YYYY-MM-DD'))`);
        await connection.execute(`INSERT INTO STAFF (department_id, name, role, phone, hire_date) VALUES (2, 'Balu K', 'Nurse', '9700000002', TO_DATE('2021-01-15', 'YYYY-MM-DD'))`);
        await connection.execute(`INSERT INTO STAFF (department_id, name, role, phone, hire_date) VALUES (3, 'Chitra M', 'Nurse', '9700000003', TO_DATE('2019-03-10', 'YYYY-MM-DD'))`);

        // ============================
        // ROOMS
        // ============================
        console.log('🚪 Inserting rooms...');
        await connection.execute(`INSERT INTO ROOM (department_id, assigned_staff_id, room_number, room_type, status, capacity) VALUES (1, 1, 'A-101', 'Consultation', 'Available', 1)`);
        await connection.execute(`INSERT INTO ROOM (department_id, room_number, room_type, status, capacity) VALUES (1, 'A-102', 'ICU', 'Available', 2)`);
        await connection.execute(`INSERT INTO ROOM (department_id, assigned_staff_id, room_number, room_type, status, capacity) VALUES (2, 2, 'B-201', 'Consultation', 'Available', 1)`);
        await connection.execute(`INSERT INTO ROOM (department_id, room_number, room_type, status, capacity) VALUES (2, 'B-202', 'Consultation', 'Occupied', 1)`);
        await connection.execute(`INSERT INTO ROOM (department_id, assigned_staff_id, room_number, room_type, status, capacity) VALUES (3, 3, 'A-103', 'Consultation', 'Available', 1)`);
        await connection.execute(`INSERT INTO ROOM (department_id, room_number, room_type, status, capacity) VALUES (3, 'A-104', 'Emergency', 'Available', 2)`);

        // ============================
        // PATIENT
        // ============================
        console.log('👤 Inserting patients...');
        await connection.execute(`INSERT INTO PATIENT (name, phone, dob, gender, email, blood_group) VALUES ('Rajesh Murugan', '9876543210', TO_DATE('1990-04-15', 'YYYY-MM-DD'), 'Male', 'rajesh@mail.com', 'B+')`);
        await connection.execute(`INSERT INTO PATIENT (name, phone, dob, gender, email, blood_group) VALUES ('Meena Sundaram', '9876543211', TO_DATE('1985-07-22', 'YYYY-MM-DD'), 'Female', 'meena@mail.com', 'O+')`);
        await connection.execute(`INSERT INTO PATIENT (name, phone, dob, gender, email, blood_group) VALUES ('Arjun Krishnan', '9876543212', TO_DATE('1975-11-03', 'YYYY-MM-DD'), 'Male', 'arjun@mail.com', 'A+')`);
        await connection.execute(`INSERT INTO PATIENT (name, phone, dob, gender, email, blood_group) VALUES ('Lakshmi Devi', '9876543213', TO_DATE('2000-01-28', 'YYYY-MM-DD'), 'Female', 'lakshmi@mail.com', 'AB-')`);
        await connection.execute(`INSERT INTO PATIENT (name, phone, dob, gender, email, blood_group) VALUES ('Suresh Venkatesh', '9876543214', TO_DATE('1968-09-10', 'YYYY-MM-DD'), 'Male', 'suresh@mail.com', 'O-')`);

        // ============================
        // MEDICINE
        // ============================
        console.log('💊 Inserting medicines...');
        await connection.execute(`INSERT INTO MEDICINE (name, dosage_form, strength, unit_price) VALUES ('Paracetamol', 'Tablet', '500 mg', 2.50)`);
        await connection.execute(`INSERT INTO MEDICINE (name, dosage_form, strength, unit_price) VALUES ('Amlodipine', 'Tablet', '5 mg', 12.00)`);
        await connection.execute(`INSERT INTO MEDICINE (name, dosage_form, strength, unit_price) VALUES ('Metformin', 'Tablet', '500 mg', 8.00)`);
        await connection.execute(`INSERT INTO MEDICINE (name, dosage_form, strength, unit_price) VALUES ('Cetirizine', 'Tablet', '10 mg', 4.50)`);
        await connection.execute(`INSERT INTO MEDICINE (name, dosage_form, strength, unit_price) VALUES ('Amoxicillin', 'Capsule', '500 mg', 15.00)`);

        // ============================
        // DOCTOR_AVAILABILITY
        // ============================
        console.log('📅 Inserting doctor availability...');
        await connection.execute(`INSERT INTO DOCTOR_AVAILABILITY (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes) VALUES (1, 'Mon', '09:00', '13:00', 30)`);
        await connection.execute(`INSERT INTO DOCTOR_AVAILABILITY (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes) VALUES (1, 'Wed', '09:00', '13:00', 30)`);
        await connection.execute(`INSERT INTO DOCTOR_AVAILABILITY (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes) VALUES (2, 'Tue', '10:00', '14:00', 30)`);
        await connection.execute(`INSERT INTO DOCTOR_AVAILABILITY (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes) VALUES (3, 'Mon', '08:00', '12:00', 20)`);

        // ============================
        // APPOINTMENT
        // ============================
        console.log('📋 Inserting sample appointments...');
        await connection.execute(`INSERT INTO APPOINTMENT (patient_id, doctor_id, room_id, staff_id, created_by_user_id, appointment_date, start_time, end_time, status, workflow_stage) VALUES (1, 1, 1, 1, 2, TRUNC(SYSDATE), '09:00', '09:30', 'Scheduled', 'Booked')`);
        await connection.execute(`INSERT INTO APPOINTMENT (patient_id, doctor_id, room_id, staff_id, created_by_user_id, appointment_date, start_time, end_time, status, workflow_stage) VALUES (2, 1, 1, 1, 2, TRUNC(SYSDATE), '10:00', '10:30', 'Scheduled', 'Booked')`);
        await connection.execute(`INSERT INTO APPOINTMENT (patient_id, doctor_id, room_id, staff_id, created_by_user_id, appointment_date, start_time, end_time, status, workflow_stage) VALUES (3, 2, 3, 2, 2, TRUNC(SYSDATE), '11:00', '11:30', 'Scheduled', 'Booked')`);

        // ============================
        // PRESCRIPTION
        // ============================
        console.log('💊 Inserting sample prescription...');
        await connection.execute(`INSERT INTO PRESCRIPTION (appointment_id, verified_by_staff_id, diagnosis, notes, follow_up_date) VALUES (1, 1, 'Hypertension', 'Low sodium diet, daily BP log', TO_DATE('2026-04-01', 'YYYY-MM-DD'))`);
        await connection.execute(`INSERT INTO PRESCRIPTION_MEDICINE (prescription_id, medicine_id, dosage, frequency, duration) VALUES (1, 2, '5 mg', 'OD', '60 days')`);

        // ============================
        // STAFF_SHIFT
        // ============================
        console.log('🕐 Inserting staff shifts...');
        await connection.execute(`INSERT INTO STAFF_SHIFT (staff_id, shift_date, start_time, end_time, shift_type) VALUES (1, TRUNC(SYSDATE), '07:00', '15:00', 'Morning')`);
        await connection.execute(`INSERT INTO STAFF_SHIFT (staff_id, shift_date, start_time, end_time, shift_type) VALUES (2, TRUNC(SYSDATE), '15:00', '23:00', 'Afternoon')`);
        await connection.execute(`INSERT INTO STAFF_SHIFT (staff_id, shift_date, start_time, end_time, shift_type) VALUES (3, TRUNC(SYSDATE), '23:00', '07:00', 'Night')`);

        // Commit all changes
        await connection.commit();

        console.log('\n✅ Seed data inserted successfully!');
        console.log('\n📝 Test Credentials:');
        console.log('  Admin:       admin1 / Admin@123');
        console.log('  Receptionist: recept1 / Recept@123');
        console.log('  Doctor:      dr.arun / DrArun@123');
        console.log('  Nurse:       nurse.anitha / Nurse@123');

    } catch (err) {
        console.error('❌ Seed error:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.close();
        await db.close();
    }
}

seed();

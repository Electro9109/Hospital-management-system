/**
 * Seed Script — Inserts demo data into Oracle DB
 * Run: node db/seed.js
 * 
 * Creates 4 users (one per role), departments, doctors, staff,
 * patients, rooms, medicines, and sample appointments.
 * 
 * DEFAULT PASSWORD for all users: password123
 */

const bcrypt = require('bcryptjs');
const db = require('./connection');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function seed() {
    let connection;
    try {
        await db.initialize();
        connection = await db.getConnection();

        const hashedPassword = await bcrypt.hash('password123', 10);
        console.log('🔑 Hashed password generated');

        // ============================
        // USERS (4 roles)
        // ============================
        console.log('👤 Inserting users...');
        await connection.execute(`INSERT INTO USERS (USER_ID, USERNAME, PASSWORD, ROLE, STATUS) VALUES (1, 'admin', :pw, 'admin', 'active')`, [hashedPassword]);
        await connection.execute(`INSERT INTO USERS (USER_ID, USERNAME, PASSWORD, ROLE, STATUS) VALUES (2, 'reception', :pw, 'receptionist', 'active')`, [hashedPassword]);
        await connection.execute(`INSERT INTO USERS (USER_ID, USERNAME, PASSWORD, ROLE, STATUS) VALUES (3, 'drsmith', :pw, 'doctor', 'active')`, [hashedPassword]);
        await connection.execute(`INSERT INTO USERS (USER_ID, USERNAME, PASSWORD, ROLE, STATUS) VALUES (4, 'nurse_jane', :pw, 'nurse', 'active')`, [hashedPassword]);

        // ============================
        // DEPARTMENTS
        // ============================
        console.log('🏢 Inserting departments...');
        await connection.execute(`INSERT INTO DEPARTMENT (DEPARTMENT_ID, DEPT_NAME, LOCATION, FLOOR_NO) VALUES (1, 'Cardiology', 'Building A, Wing 1', 2)`);
        await connection.execute(`INSERT INTO DEPARTMENT (DEPARTMENT_ID, DEPT_NAME, LOCATION, FLOOR_NO) VALUES (2, 'Orthopedics', 'Building A, Wing 2', 3)`);
        await connection.execute(`INSERT INTO DEPARTMENT (DEPARTMENT_ID, DEPT_NAME, LOCATION, FLOOR_NO) VALUES (3, 'General Medicine', 'Building B, Wing 1', 1)`);

        // ============================
        // DOCTORS
        // ============================
        console.log('🩺 Inserting doctors...');
        await connection.execute(`INSERT INTO DOCTOR (DOCTOR_ID, USER_ID, DEPARTMENT_ID, NAME, SPECIALIZATION, PHONE, FEE) VALUES (1, 3, 1, 'John Smith', 'Cardiologist', '9876543210', 500)`);
        await connection.execute(`INSERT INTO DOCTOR (DOCTOR_ID, USER_ID, DEPARTMENT_ID, NAME, SPECIALIZATION, PHONE, FEE) VALUES (2, NULL, 2, 'Sarah Johnson', 'Orthopedic Surgeon', '9876543211', 600)`);
        await connection.execute(`INSERT INTO DOCTOR (DOCTOR_ID, USER_ID, DEPARTMENT_ID, NAME, SPECIALIZATION, PHONE, FEE) VALUES (3, NULL, 3, 'Priya Patel', 'General Physician', '9876543212', 300)`);

        // ============================
        // STAFF (nurses + others)
        // ============================
        console.log('👥 Inserting staff...');
        await connection.execute(`INSERT INTO STAFF (STAFF_ID, USER_ID, DEPARTMENT_ID, NAME, ROLE, PHONE, HIRE_DATE) VALUES (1, 4, 1, 'Jane Wilson', 'Nurse', '9876543220', TO_DATE('2024-01-15', 'YYYY-MM-DD'))`);
        await connection.execute(`INSERT INTO STAFF (STAFF_ID, USER_ID, DEPARTMENT_ID, NAME, ROLE, PHONE, HIRE_DATE) VALUES (2, NULL, 2, 'Mike Brown', 'Nurse', '9876543221', TO_DATE('2024-03-20', 'YYYY-MM-DD'))`);
        await connection.execute(`INSERT INTO STAFF (STAFF_ID, USER_ID, DEPARTMENT_ID, NAME, ROLE, PHONE, HIRE_DATE) VALUES (3, NULL, 3, 'Lisa Chen', 'Lab Tech', '9876543222', TO_DATE('2024-06-10', 'YYYY-MM-DD'))`);
        await connection.execute(`INSERT INTO STAFF (STAFF_ID, USER_ID, DEPARTMENT_ID, NAME, ROLE, PHONE, HIRE_DATE) VALUES (4, NULL, 1, 'Raj Kumar', 'Nurse', '9876543223', TO_DATE('2025-01-05', 'YYYY-MM-DD'))`);

        // ============================
        // ROOMS
        // ============================
        console.log('🚪 Inserting rooms...');
        await connection.execute(`INSERT INTO ROOM (ROOM_ID, DEPARTMENT_ID, ASSIGNED_STAFF_ID, ROOM_NUMBER, TYPE, STATUS) VALUES (1, 1, 1, '101', 'Consultation', 'available')`);
        await connection.execute(`INSERT INTO ROOM (ROOM_ID, DEPARTMENT_ID, ASSIGNED_STAFF_ID, ROOM_NUMBER, TYPE, STATUS) VALUES (2, 1, NULL, '102', 'ICU', 'available')`);
        await connection.execute(`INSERT INTO ROOM (ROOM_ID, DEPARTMENT_ID, ASSIGNED_STAFF_ID, ROOM_NUMBER, TYPE, STATUS) VALUES (3, 2, 2, '201', 'Consultation', 'available')`);
        await connection.execute(`INSERT INTO ROOM (ROOM_ID, DEPARTMENT_ID, ASSIGNED_STAFF_ID, ROOM_NUMBER, TYPE, STATUS) VALUES (4, 2, NULL, '202', 'Ward', 'occupied')`);
        await connection.execute(`INSERT INTO ROOM (ROOM_ID, DEPARTMENT_ID, ASSIGNED_STAFF_ID, ROOM_NUMBER, TYPE, STATUS) VALUES (5, 3, 3, '301', 'Consultation', 'available')`);
        await connection.execute(`INSERT INTO ROOM (ROOM_ID, DEPARTMENT_ID, ASSIGNED_STAFF_ID, ROOM_NUMBER, TYPE, STATUS) VALUES (6, 3, NULL, '302', 'Emergency', 'available')`);

        // ============================
        // PATIENTS
        // ============================
        console.log('👤 Inserting patients...');
        await connection.execute(`INSERT INTO PATIENT (PATIENT_ID, USER_ID, NAME, PHONE, DOB, GENDER, EMAIL, BLOOD_GROUP) VALUES (1, NULL, 'Rahul Sharma', '9988776655', TO_DATE('1990-05-15', 'YYYY-MM-DD'), 'Male', 'rahul@email.com', 'B+')`);
        await connection.execute(`INSERT INTO PATIENT (PATIENT_ID, USER_ID, NAME, PHONE, DOB, GENDER, EMAIL, BLOOD_GROUP) VALUES (2, NULL, 'Ananya Gupta', '9988776656', TO_DATE('1985-08-22', 'YYYY-MM-DD'), 'Female', 'ananya@email.com', 'A+')`);
        await connection.execute(`INSERT INTO PATIENT (PATIENT_ID, USER_ID, NAME, PHONE, DOB, GENDER, EMAIL, BLOOD_GROUP) VALUES (3, NULL, 'Vikram Singh', '9988776657', TO_DATE('1978-12-03', 'YYYY-MM-DD'), 'Male', 'vikram@email.com', 'O+')`);
        await connection.execute(`INSERT INTO PATIENT (PATIENT_ID, USER_ID, NAME, PHONE, DOB, GENDER, EMAIL, BLOOD_GROUP) VALUES (4, NULL, 'Meera Krishnan', '9988776658', TO_DATE('1995-03-18', 'YYYY-MM-DD'), 'Female', 'meera@email.com', 'AB-')`);
        await connection.execute(`INSERT INTO PATIENT (PATIENT_ID, USER_ID, NAME, PHONE, DOB, GENDER, EMAIL, BLOOD_GROUP) VALUES (5, NULL, 'Arjun Nair', '9988776659', TO_DATE('2000-07-09', 'YYYY-MM-DD'), 'Male', 'arjun@email.com', 'O-')`);

        // ============================
        // MEDICINES
        // ============================
        console.log('💊 Inserting medicines...');
        await connection.execute(`INSERT INTO MEDICINE (MEDICINE_ID, NAME, DOSAGE_FORM, STRENGTH, UNIT_PRICE) VALUES (1, 'Paracetamol', 'Tablet', '500mg', 5)`);
        await connection.execute(`INSERT INTO MEDICINE (MEDICINE_ID, NAME, DOSAGE_FORM, STRENGTH, UNIT_PRICE) VALUES (2, 'Amoxicillin', 'Capsule', '250mg', 12)`);
        await connection.execute(`INSERT INTO MEDICINE (MEDICINE_ID, NAME, DOSAGE_FORM, STRENGTH, UNIT_PRICE) VALUES (3, 'Omeprazole', 'Capsule', '20mg', 8)`);
        await connection.execute(`INSERT INTO MEDICINE (MEDICINE_ID, NAME, DOSAGE_FORM, STRENGTH, UNIT_PRICE) VALUES (4, 'Cetirizine', 'Tablet', '10mg', 6)`);
        await connection.execute(`INSERT INTO MEDICINE (MEDICINE_ID, NAME, DOSAGE_FORM, STRENGTH, UNIT_PRICE) VALUES (5, 'Metformin', 'Tablet', '500mg', 10)`);
        await connection.execute(`INSERT INTO MEDICINE (MEDICINE_ID, NAME, DOSAGE_FORM, STRENGTH, UNIT_PRICE) VALUES (6, 'Aspirin', 'Tablet', '75mg', 3)`);
        await connection.execute(`INSERT INTO MEDICINE (MEDICINE_ID, NAME, DOSAGE_FORM, STRENGTH, UNIT_PRICE) VALUES (7, 'Atorvastatin', 'Tablet', '10mg', 15)`);
        await connection.execute(`INSERT INTO MEDICINE (MEDICINE_ID, NAME, DOSAGE_FORM, STRENGTH, UNIT_PRICE) VALUES (8, 'Azithromycin', 'Tablet', '500mg', 25)`);

        // ============================
        // DOCTOR AVAILABILITY
        // ============================
        console.log('📅 Inserting doctor availability...');
        await connection.execute(`INSERT INTO DOCTOR_AVAILABILITY (AVAILABILITY_ID, DOCTOR_ID, DAY, START_TIME, END_TIME, SLOT_MINS) VALUES (1, 1, 'Monday', '09:00', '17:00', 30)`);
        await connection.execute(`INSERT INTO DOCTOR_AVAILABILITY (AVAILABILITY_ID, DOCTOR_ID, DAY, START_TIME, END_TIME, SLOT_MINS) VALUES (2, 1, 'Wednesday', '09:00', '17:00', 30)`);
        await connection.execute(`INSERT INTO DOCTOR_AVAILABILITY (AVAILABILITY_ID, DOCTOR_ID, DAY, START_TIME, END_TIME, SLOT_MINS) VALUES (3, 1, 'Friday', '09:00', '13:00', 30)`);
        await connection.execute(`INSERT INTO DOCTOR_AVAILABILITY (AVAILABILITY_ID, DOCTOR_ID, DAY, START_TIME, END_TIME, SLOT_MINS) VALUES (4, 2, 'Tuesday', '10:00', '16:00', 30)`);
        await connection.execute(`INSERT INTO DOCTOR_AVAILABILITY (AVAILABILITY_ID, DOCTOR_ID, DAY, START_TIME, END_TIME, SLOT_MINS) VALUES (5, 2, 'Thursday', '10:00', '16:00', 30)`);
        await connection.execute(`INSERT INTO DOCTOR_AVAILABILITY (AVAILABILITY_ID, DOCTOR_ID, DAY, START_TIME, END_TIME, SLOT_MINS) VALUES (6, 3, 'Monday', '08:00', '14:00', 20)`);
        await connection.execute(`INSERT INTO DOCTOR_AVAILABILITY (AVAILABILITY_ID, DOCTOR_ID, DAY, START_TIME, END_TIME, SLOT_MINS) VALUES (7, 3, 'Wednesday', '08:00', '14:00', 20)`);
        await connection.execute(`INSERT INTO DOCTOR_AVAILABILITY (AVAILABILITY_ID, DOCTOR_ID, DAY, START_TIME, END_TIME, SLOT_MINS) VALUES (8, 3, 'Friday', '08:00', '14:00', 20)`);

        // ============================
        // SAMPLE APPOINTMENTS (today)
        // ============================
        console.log('📋 Inserting sample appointments...');
        await connection.execute(`INSERT INTO APPOINTMENT (APPOINTMENT_ID, PATIENT_ID, DOCTOR_ID, ROOM_ID, STAFF_ID, USER_ID, APPOINTMENT_DATE, START_TIME, END_TIME, STATUS, WORKFLOW_STAGE) VALUES (1, 1, 1, 1, 1, 2, TRUNC(SYSDATE), '09:00', '09:30', 'Scheduled', 'registered')`);
        await connection.execute(`INSERT INTO APPOINTMENT (APPOINTMENT_ID, PATIENT_ID, DOCTOR_ID, ROOM_ID, STAFF_ID, USER_ID, APPOINTMENT_DATE, START_TIME, END_TIME, STATUS, WORKFLOW_STAGE) VALUES (2, 2, 1, 1, 1, 2, TRUNC(SYSDATE), '10:00', '10:30', 'Scheduled', 'checked-in')`);
        await connection.execute(`INSERT INTO APPOINTMENT (APPOINTMENT_ID, PATIENT_ID, DOCTOR_ID, ROOM_ID, STAFF_ID, USER_ID, APPOINTMENT_DATE, START_TIME, END_TIME, STATUS, WORKFLOW_STAGE) VALUES (3, 3, 2, 3, 2, 2, TRUNC(SYSDATE), '11:00', '11:30', 'Scheduled', 'triage')`);
        await connection.execute(`INSERT INTO APPOINTMENT (APPOINTMENT_ID, PATIENT_ID, DOCTOR_ID, ROOM_ID, STAFF_ID, USER_ID, APPOINTMENT_DATE, START_TIME, END_TIME, STATUS, WORKFLOW_STAGE) VALUES (4, 4, 3, 5, 3, 2, TRUNC(SYSDATE), '14:00', '14:30', 'Scheduled', 'in-consultation')`);
        await connection.execute(`INSERT INTO APPOINTMENT (APPOINTMENT_ID, PATIENT_ID, DOCTOR_ID, ROOM_ID, STAFF_ID, USER_ID, APPOINTMENT_DATE, START_TIME, END_TIME, STATUS, WORKFLOW_STAGE) VALUES (5, 5, 1, 2, 4, 2, TRUNC(SYSDATE), '15:00', '15:30', 'Scheduled', 'post-consultation')`);

        // ============================
        // SAMPLE PRESCRIPTION
        // ============================
        console.log('💊 Inserting sample prescription...');
        await connection.execute(`INSERT INTO PRESCRIPTION (PRESCRIPTION_ID, APPOINTMENT_ID, STAFF_ID, DIAGNOSIS, NOTES, FOLLOW_UP) VALUES (1, 4, NULL, 'Acute viral fever with mild dehydration', 'Patient advised bed rest for 3 days. Increase fluid intake.', TO_DATE('2026-04-01', 'YYYY-MM-DD'))`);
        await connection.execute(`INSERT INTO PRESCRIPTION_MEDICINE (PRESCRIPTION_ID, MEDICINE_ID, DOSAGE, FREQUENCY, DURATION) VALUES (1, 1, '500mg', 'Thrice daily', '5 days')`);
        await connection.execute(`INSERT INTO PRESCRIPTION_MEDICINE (PRESCRIPTION_ID, MEDICINE_ID, DOSAGE, FREQUENCY, DURATION) VALUES (1, 4, '10mg', 'Once daily', '3 days')`);

        // ============================
        // STAFF SHIFTS
        // ============================
        console.log('🕐 Inserting staff shifts...');
        await connection.execute(`INSERT INTO STAFF_SHIFT (STAFF_SHIFT_ID, STAFF_ID, SHIFT_DATE, START_TIME, END_TIME, SHIFT_TYPE) VALUES (1, 1, TRUNC(SYSDATE), '08:00', '16:00', 'Morning')`);
        await connection.execute(`INSERT INTO STAFF_SHIFT (STAFF_SHIFT_ID, STAFF_ID, SHIFT_DATE, START_TIME, END_TIME, SHIFT_TYPE) VALUES (2, 1, TRUNC(SYSDATE)+1, '08:00', '16:00', 'Morning')`);
        await connection.execute(`INSERT INTO STAFF_SHIFT (STAFF_SHIFT_ID, STAFF_ID, SHIFT_DATE, START_TIME, END_TIME, SHIFT_TYPE) VALUES (3, 2, TRUNC(SYSDATE), '16:00', '00:00', 'Afternoon')`);
        await connection.execute(`INSERT INTO STAFF_SHIFT (STAFF_SHIFT_ID, STAFF_ID, SHIFT_DATE, START_TIME, END_TIME, SHIFT_TYPE) VALUES (4, 4, TRUNC(SYSDATE)+2, '00:00', '08:00', 'Night')`);

        await connection.commit();
        console.log('\n✅ Seed data inserted successfully!');
        console.log('\n📋 Login credentials (all passwords: password123):');
        console.log('   Admin:        username = admin');
        console.log('   Receptionist:  username = reception');
        console.log('   Doctor:        username = drsmith');
        console.log('   Nurse:         username = nurse_jane');

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('❌ Seed error:', err);
    } finally {
        if (connection) await connection.close();
        await db.close();
    }
}

seed();

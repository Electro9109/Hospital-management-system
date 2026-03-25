const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /patients — list all patients
router.get('/', requireAuth, async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT p.PATIENT_ID, p.NAME, p.PHONE, p.DOB, p.GENDER, p.EMAIL, p.BLOOD_GROUP,
                   u.USERNAME
            FROM PATIENT p
            LEFT JOIN USERS u ON p.USER_ID = u.USER_ID
            ORDER BY p.PATIENT_ID DESC
        `);
        res.render('patients/list', {
            pageTitle: 'Patients',
            currentPage: 'patients',
            user: req.session.user,
            patients: result.rows
        });
    } catch (err) {
        console.error('Patients list error:', err);
        req.session.error = 'Failed to load patients.';
        res.redirect('/dashboard');
    }
});

// GET /patients/register — registration form
router.get('/register', requireAuth, requireRole('receptionist', 'admin'), (req, res) => {
    res.render('patients/register', {
        pageTitle: 'Register Patient',
        currentPage: 'patients',
        user: req.session.user
    });
});

// POST /patients/register — create patient
router.post('/register', requireAuth, requireRole('receptionist', 'admin'), async (req, res) => {
    const { name, phone, dob, gender, email, blood_group } = req.body;
    try {
        await db.execute(`
            INSERT INTO PATIENT (PATIENT_ID, NAME, PHONE, DOB, GENDER, EMAIL, BLOOD_GROUP)
            VALUES (PATIENT_SEQ.NEXTVAL, :name, :phone, TO_DATE(:dob, 'YYYY-MM-DD'), :gender, :email, :blood_group)
        `, [name, phone, dob, gender, email, blood_group]);

        req.session.success = `Patient "${name}" registered successfully.`;
        res.redirect('/patients');
    } catch (err) {
        console.error('Patient registration error:', err);
        req.session.error = 'Failed to register patient. ' + (err.message || '');
        res.redirect('/patients/register');
    }
});

// GET /patients/:id — patient detail
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const patient = await db.execute(`
            SELECT p.*, u.USERNAME
            FROM PATIENT p
            LEFT JOIN USERS u ON p.USER_ID = u.USER_ID
            WHERE p.PATIENT_ID = :id
        `, [req.params.id]);

        if (patient.rows.length === 0) {
            req.session.error = 'Patient not found.';
            return res.redirect('/patients');
        }

        // Appointment history
        const appointments = await db.execute(`
            SELECT a.APPOINTMENT_ID, a.DATE_OF_VISIT, a.START_TIME, a.STATUS, a.WORKFLOW_STAGE,
                   d.NAME AS DOCTOR_NAME, d.SPECIALIZATION, dep.DEPT_NAME
            FROM APPOINTMENT a
            JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
            LEFT JOIN DEPARTMENT dep ON d.DEPARTMENT_ID = dep.DEPARTMENT_ID
            WHERE a.PATIENT_ID = :id
            ORDER BY a.DATE_OF_VISIT DESC, a.START_TIME DESC
        `, [req.params.id]);

        // Prescription history
        const prescriptions = await db.execute(`
            SELECT pr.PRESCRIPTION_ID, pr.DIAGNOSIS, pr.NOTES, pr.FOLLOW_UP,
                   a.DATE_OF_VISIT, d.NAME AS DOCTOR_NAME
            FROM PRESCRIPTION pr
            JOIN APPOINTMENT a ON pr.APPOINTMENT_ID = a.APPOINTMENT_ID
            JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
            WHERE a.PATIENT_ID = :id
            ORDER BY a.DATE_OF_VISIT DESC
        `, [req.params.id]);

        res.render('patients/detail', {
            pageTitle: patient.rows[0].NAME,
            currentPage: 'patients',
            user: req.session.user,
            patient: patient.rows[0],
            appointments: appointments.rows,
            prescriptions: prescriptions.rows
        });
    } catch (err) {
        console.error('Patient detail error:', err);
        req.session.error = 'Failed to load patient details.';
        res.redirect('/patients');
    }
});

module.exports = router;

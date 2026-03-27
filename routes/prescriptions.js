const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

// List all prescriptions
// List all prescriptions
router.get('/', requireAuth, async (req, res) => {
    try {
        const prescriptions = await db.execute(`
            SELECT pr.PRESCRIPTION_ID, pr.DIAGNOSIS, pr.NOTES,
                   pr.FOLLOW_UP_DATE, pr.VERIFIED_BY_STAFF_ID,
                   a.APPOINTMENT_DATE,
                   p.NAME AS PATIENT_NAME,
                   d.NAME AS DOCTOR_NAME
            FROM PRESCRIPTION pr
            JOIN APPOINTMENT a ON pr.APPOINTMENT_ID = a.APPOINTMENT_ID
            JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
            JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
            ORDER BY pr.PRESCRIPTION_ID DESC
        `);
        res.render('prescriptions/index', {
            pageTitle: 'Prescriptions',
            currentPage: 'prescriptions',
            user: req.session.user,
            prescriptions: prescriptions.rows
        });
    } catch (err) {
        console.error(err);
        res.render('errors/500', { user: req.session.user });
    }
});

// Create prescription form (doctors only)
router.get('/create', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.user_id;
        const doctorResult = await db.execute(
            `SELECT DOCTOR_ID FROM DOCTOR WHERE USER_ID = :uid`, [userId]
        );
        const doctor = doctorResult.rows[0];

        const patients = await db.execute(`SELECT PATIENT_ID, NAME FROM PATIENT ORDER BY NAME`);
        const appointments = await db.execute(`
            SELECT a.APPOINTMENT_ID, a.APPOINTMENT_DATE, p.NAME AS PATIENT_NAME
            FROM APPOINTMENT a
            JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
            WHERE a.DOCTOR_ID = :docId
            ORDER BY a.APPOINTMENT_DATE DESC
            FETCH FIRST 30 ROWS ONLY
        `, [doctor?.DOCTOR_ID]);

        res.render('prescription/create', {
            pageTitle: 'Write Prescription',
            currentPage: 'prescriptions',
            user: req.session.user,
            doctor,
            patients: patients.rows,
            appointments: appointments.rows
        });
    } catch (err) {
        console.error(err);
        res.render('errors/500', { user: req.session.user });
    }
});

// Save prescription
// Save prescription
router.post('/create', requireAuth, async (req, res) => {
    const { appointment_id, diagnosis, notes, follow_up_date } = req.body;
    try {
        await db.execute(`
            INSERT INTO PRESCRIPTION (APPOINTMENT_ID, DIAGNOSIS, NOTES, FOLLOW_UP_DATE)
            VALUES (:aid, :diag, :notes, TO_DATE(:fud, 'YYYY-MM-DD'))
        `, [appointment_id, diagnosis, notes, follow_up_date || null]);
        req.session.success = 'Prescription saved.';
        res.redirect('/prescriptions');
    } catch (err) {
        console.error(err);
        req.session.error = 'Failed to save prescription.';
        res.redirect('/prescriptions/create');
    }
});

// View single prescription
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT pr.PRESCRIPTION_ID, pr.DIAGNOSIS, pr.NOTES,
                   pr.FOLLOW_UP_DATE, pr.VERIFIED_BY_STAFF_ID,
                   a.APPOINTMENT_DATE,
                   p.NAME AS PATIENT_NAME, p.PHONE, p.GENDER, p.BLOOD_GROUP,
                   d.NAME AS DOCTOR_NAME, d.SPECIALIZATION
            FROM PRESCRIPTION pr
            JOIN APPOINTMENT a ON pr.APPOINTMENT_ID = a.APPOINTMENT_ID
            JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
            JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
            WHERE pr.PRESCRIPTION_ID = :id
        `, [req.params.id]);

        if (!result.rows.length) return res.render('errors/404', { user: req.session.user });

        res.render('prescriptions/view', {
            pageTitle: 'Prescription',
            currentPage: 'prescriptions',
            user: req.session.user,
            prescription: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.render('errors/500', { user: req.session.user });
    }
});

// View single prescription (printable)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT pr.PRESCRIPTION_ID, pr.MEDICINE_NAME, pr.DOSAGE, pr.INSTRUCTIONS,
                   pr.CREATED_AT, pr.VERIFIED_BY_STAFF_ID,
                   p.NAME AS PATIENT_NAME, p.PHONE, p.GENDER, p.BLOOD_GROUP,
                   d.NAME AS DOCTOR_NAME, d.SPECIALIZATION
            FROM PRESCRIPTION pr
            JOIN PATIENT p ON pr.PATIENT_ID = p.PATIENT_ID
            JOIN DOCTOR d ON pr.DOCTOR_ID = d.DOCTOR_ID
            WHERE pr.PRESCRIPTION_ID = :id
        `, [req.params.id]);

        if (!result.rows.length) return res.render('errors/404', { user: req.session.user });

        res.render('prescription/view', {
            pageTitle: 'Prescription',
            currentPage: 'prescriptions',
            user: req.session.user,
            prescription: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.render('errors/500', { user: req.session.user });
    }
});

// Verify prescription (receptionist/staff)
router.post('/:id/verify', requireAuth, async (req, res) => {
    try {
        const staffResult = await db.execute(
            `SELECT STAFF_ID FROM STAFF WHERE USER_ID = :uid`, [req.session.user.user_id]
        );
        const staff = staffResult.rows[0];
        await db.execute(`
            UPDATE PRESCRIPTION SET VERIFIED_BY_STAFF_ID = :sid WHERE PRESCRIPTION_ID = :id
        `, [staff.STAFF_ID, req.params.id]);
        req.session.success = 'Prescription verified.';
        res.redirect('/prescriptions');
    } catch (err) {
        console.error(err);
        req.session.error = 'Failed to verify.';
        res.redirect('/prescriptions');
    }
});

module.exports = router;
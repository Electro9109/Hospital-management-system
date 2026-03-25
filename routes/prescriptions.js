const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /prescriptions — list all prescriptions
router.get('/', requireAuth, async (req, res) => {
    try {
        const role = req.session.user.role.toLowerCase();
        const userId = req.session.user.user_id;
        let query, binds = [];

        if (role === 'doctor') {
            const doc = await db.execute(`SELECT DOCTOR_ID FROM DOCTOR WHERE USER_ID = :uid`, [userId]);
            const docId = doc.rows[0]?.DOCTOR_ID;
            query = `
                SELECT pr.PRESCRIPTION_ID, pr.DIAGNOSIS, pr.FOLLOW_UP,
                       a.DATE_OF_VISIT, a.APPOINTMENT_ID,
                       p.NAME AS PATIENT_NAME, d.NAME AS DOCTOR_NAME
                FROM PRESCRIPTION pr
                JOIN APPOINTMENT a ON pr.APPOINTMENT_ID = a.APPOINTMENT_ID
                JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
                JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
                WHERE a.DOCTOR_ID = :docId
                ORDER BY a.DATE_OF_VISIT DESC
            `;
            binds = [docId];
        } else {
            query = `
                SELECT pr.PRESCRIPTION_ID, pr.DIAGNOSIS, pr.FOLLOW_UP,
                       a.DATE_OF_VISIT, a.APPOINTMENT_ID,
                       p.NAME AS PATIENT_NAME, d.NAME AS DOCTOR_NAME
                FROM PRESCRIPTION pr
                JOIN APPOINTMENT a ON pr.APPOINTMENT_ID = a.APPOINTMENT_ID
                JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
                JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
                ORDER BY a.DATE_OF_VISIT DESC
            `;
        }

        const result = await db.execute(query, binds);
        res.render('prescriptions/list', {
            pageTitle: 'Prescriptions',
            currentPage: 'prescriptions',
            user: req.session.user,
            prescriptions: result.rows
        });
    } catch (err) {
        console.error('Prescriptions list error:', err);
        req.session.error = 'Failed to load prescriptions.';
        res.redirect('/dashboard');
    }
});

// GET /prescriptions/write/:appointmentId — prescription form
router.get('/write/:appointmentId', requireAuth, requireRole('doctor', 'admin'), async (req, res) => {
    try {
        const appt = await db.execute(`
            SELECT a.*, p.NAME AS PATIENT_NAME, p.GENDER, p.BLOOD_GROUP, p.DOB
            FROM APPOINTMENT a
            JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
            WHERE a.APPOINTMENT_ID = :id
        `, [req.params.appointmentId]);

        if (appt.rows.length === 0) {
            req.session.error = 'Appointment not found.';
            return res.redirect('/appointments');
        }

        const medicines = await db.execute(`
            SELECT MEDICINE_ID, NAME, DOSAGE_FORM, STRENGTH, UNIT_PRICE
            FROM MEDICINE ORDER BY NAME
        `);

        res.render('prescriptions/write', {
            pageTitle: 'Write Prescription',
            currentPage: 'prescriptions',
            user: req.session.user,
            appt: appt.rows[0],
            medicines: medicines.rows
        });
    } catch (err) {
        console.error('Prescription form error:', err);
        req.session.error = 'Failed to load prescription form.';
        res.redirect('/appointments');
    }
});

// POST /prescriptions/write/:appointmentId — save prescription
router.post('/write/:appointmentId', requireAuth, requireRole('doctor', 'admin'), async (req, res) => {
    const { diagnosis, notes, follow_up, medicine_ids, dosages, frequencies, durations } = req.body;
    let connection;

    try {
        connection = await db.getConnection();

        // Insert prescription
        const prescResult = await connection.execute(`
            INSERT INTO PRESCRIPTION (PRESCRIPTION_ID, APPOINTMENT_ID, DIAGNOSIS, NOTES, FOLLOW_UP)
            VALUES (PRESCRIPTION_SEQ.NEXTVAL, :apptId, :diagnosis, :notes, TO_DATE(:follow_up, 'YYYY-MM-DD'))
            RETURNING PRESCRIPTION_ID INTO :prescId
        `, {
            apptId: req.params.appointmentId,
            diagnosis,
            notes: notes || null,
            follow_up: follow_up || null,
            prescId: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
        });

        const prescId = prescResult.outBinds.prescId[0];

        // Insert prescription medicines
        if (medicine_ids) {
            const meds = Array.isArray(medicine_ids) ? medicine_ids : [medicine_ids];
            const doses = Array.isArray(dosages) ? dosages : [dosages];
            const freqs = Array.isArray(frequencies) ? frequencies : [frequencies];
            const durs = Array.isArray(durations) ? durations : [durations];

            for (let i = 0; i < meds.length; i++) {
                if (meds[i]) {
                    await connection.execute(`
                        INSERT INTO PRESCRIPTION_MEDICINE (PRESCRIPTION_ID, MEDICINE_ID, DOSAGE, FREQUENCY, DURATION)
                        VALUES (:prescId, :medId, :dosage, :frequency, :duration)
                    `, [prescId, meds[i], doses[i] || null, freqs[i] || null, durs[i] || null]);
                }
            }
        }

        // Update workflow stage to in-consultation
        await connection.execute(`
            UPDATE APPOINTMENT SET WORKFLOW_STAGE = 'in-consultation'
            WHERE APPOINTMENT_ID = :id AND LOWER(WORKFLOW_STAGE) IN ('triage', 'checked-in')
        `, [req.params.appointmentId]);

        await connection.commit();

        req.session.success = 'Prescription saved successfully!';
        res.redirect(`/appointments/${req.params.appointmentId}`);
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Prescription save error:', err);
        req.session.error = 'Failed to save prescription. ' + (err.message || '');
        res.redirect(`/prescriptions/write/${req.params.appointmentId}`);
    } finally {
        if (connection) await connection.close();
    }
});

// GET /prescriptions/:id — view prescription
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const presc = await db.execute(`
            SELECT pr.*, a.DATE_OF_VISIT, a.APPOINTMENT_ID,
                   p.NAME AS PATIENT_NAME, p.GENDER, p.BLOOD_GROUP, p.DOB, p.PHONE AS PATIENT_PHONE,
                   d.NAME AS DOCTOR_NAME, d.SPECIALIZATION, dep.DEPT_NAME
            FROM PRESCRIPTION pr
            JOIN APPOINTMENT a ON pr.APPOINTMENT_ID = a.APPOINTMENT_ID
            JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
            JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
            LEFT JOIN DEPARTMENT dep ON d.DEPARTMENT_ID = dep.DEPARTMENT_ID
            WHERE pr.PRESCRIPTION_ID = :id
        `, [req.params.id]);

        if (presc.rows.length === 0) {
            req.session.error = 'Prescription not found.';
            return res.redirect('/prescriptions');
        }

        const medicines = await db.execute(`
            SELECT pm.*, m.NAME AS MEDICINE_NAME, m.DOSAGE_FORM, m.STRENGTH, m.UNIT_PRICE
            FROM PRESCRIPTION_MEDICINE pm
            JOIN MEDICINE m ON pm.MEDICINE_ID = m.MEDICINE_ID
            WHERE pm.PRESCRIPTION_ID = :id
        `, [req.params.id]);

        res.render('prescriptions/view', {
            pageTitle: `Prescription #${req.params.id}`,
            currentPage: 'prescriptions',
            user: req.session.user,
            prescription: presc.rows[0],
            medicines: medicines.rows
        });
    } catch (err) {
        console.error('Prescription view error:', err);
        req.session.error = 'Failed to load prescription.';
        res.redirect('/prescriptions');
    }
});

module.exports = router;

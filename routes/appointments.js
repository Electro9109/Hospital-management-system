const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /appointments — list appointments
router.get('/', requireAuth, async (req, res) => {
    const role = req.session.user.role.toLowerCase();
    const userId = req.session.user.user_id;
    let query = '';
    let binds = [];

    if (role === 'doctor') {
        // Doctor sees only their own
        const doc = await db.execute(`SELECT DOCTOR_ID FROM DOCTOR WHERE USER_ID = :uid`, [userId]);
        const docId = doc.rows[0]?.DOCTOR_ID;
        query = `
            SELECT a.*, p.NAME AS PATIENT_NAME, d.NAME AS DOCTOR_NAME, dep.DEPT_NAME,
                   r.ROOM_NUMBER
            FROM APPOINTMENT a
            JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
            JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
            LEFT JOIN DEPARTMENT dep ON d.DEPARTMENT_ID = dep.DEPARTMENT_ID
            LEFT JOIN ROOM r ON a.ROOM_ID = r.ROOM_ID
            WHERE a.DOCTOR_ID = :docId
            ORDER BY a.DATE_OF_VISIT DESC, a.START_TIME DESC
        `;
        binds = [docId];
    } else {
        // Everyone else sees all
        query = `
            SELECT a.*, p.NAME AS PATIENT_NAME, d.NAME AS DOCTOR_NAME, dep.DEPT_NAME,
                   r.ROOM_NUMBER
            FROM APPOINTMENT a
            JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
            JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
            LEFT JOIN DEPARTMENT dep ON d.DEPARTMENT_ID = dep.DEPARTMENT_ID
            LEFT JOIN ROOM r ON a.ROOM_ID = r.ROOM_ID
            ORDER BY a.DATE_OF_VISIT DESC, a.START_TIME DESC
        `;
    }

    try {
        const result = await db.execute(query, binds);
        res.render('appointments/list', {
            pageTitle: role === 'doctor' ? 'My Appointments' : 'Appointments',
            currentPage: 'appointments',
            user: req.session.user,
            appointments: result.rows
        });
    } catch (err) {
        console.error('Appointments list error:', err);
        req.session.error = 'Failed to load appointments.';
        res.redirect('/dashboard');
    }
});

// GET /appointments/book — booking form
router.get('/book', requireAuth, requireRole('receptionist', 'admin'), async (req, res) => {
    try {
        const patients = await db.execute(`SELECT PATIENT_ID, NAME FROM PATIENT ORDER BY NAME`);
        const doctors = await db.execute(`
            SELECT d.DOCTOR_ID, d.NAME, d.SPECIALIZATION, dep.DEPT_NAME
            FROM DOCTOR d
            LEFT JOIN DEPARTMENT dep ON d.DEPARTMENT_ID = dep.DEPARTMENT_ID
            ORDER BY d.NAME
        `);
        const rooms = await db.execute(`
            SELECT r.ROOM_ID, r.ROOM_NUMBER, r.TYPE, dep.DEPT_NAME
            FROM ROOM r
            LEFT JOIN DEPARTMENT dep ON r.DEPARTMENT_ID = dep.DEPARTMENT_ID
            WHERE LOWER(r.STATUS) = 'available'
            ORDER BY r.ROOM_NUMBER
        `);
        const staff = await db.execute(`SELECT STAFF_ID, NAME, ROLE FROM STAFF ORDER BY NAME`);

        res.render('appointments/book', {
            pageTitle: 'Book Appointment',
            currentPage: 'appointments',
            user: req.session.user,
            patients: patients.rows,
            doctors: doctors.rows,
            rooms: rooms.rows,
            staffList: staff.rows
        });
    } catch (err) {
        console.error('Book form error:', err);
        req.session.error = 'Failed to load booking form.';
        res.redirect('/appointments');
    }
});

// POST /appointments/book — create appointment
router.post('/book', requireAuth, requireRole('receptionist', 'admin'), async (req, res) => {
    const { patient_id, doctor_id, room_id, staff_id, date, start_time, end_time } = req.body;
    const userId = req.session.user.user_id;
    try {
        await db.execute(`
            INSERT INTO APPOINTMENT (APPOINTMENT_ID, PATIENT_ID, DOCTOR_ID, ROOM_ID, STAFF_ID, USER_ID,
                                     DATE_OF_VISIT, START_TIME, END_TIME, STATUS, WORKFLOW_STAGE)
            VALUES (APPOINTMENT_SEQ.NEXTVAL, :patient_id, :doctor_id, :room_id, :staff_id, :user_id,
                    TO_DATE(:date_val, 'YYYY-MM-DD'), :start_time, :end_time, 'Scheduled', 'registered')
        `, [patient_id, doctor_id, room_id || null, staff_id || null, userId, date, start_time, end_time]);

        // Update room status if room assigned
        if (room_id) {
            await db.execute(`UPDATE ROOM SET STATUS = 'occupied' WHERE ROOM_ID = :rid`, [room_id]);
        }

        req.session.success = 'Appointment booked successfully!';
        res.redirect('/appointments');
    } catch (err) {
        console.error('Appointment booking error:', err);
        req.session.error = 'Failed to book appointment. ' + (err.message || '');
        res.redirect('/appointments/book');
    }
});

// GET /appointments/:id — appointment detail + workflow
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const appt = await db.execute(`
            SELECT a.*, p.NAME AS PATIENT_NAME, p.PATIENT_ID, p.PHONE AS PATIENT_PHONE, 
                   p.GENDER, p.BLOOD_GROUP, p.DOB,
                   d.NAME AS DOCTOR_NAME, d.SPECIALIZATION,
                   dep.DEPT_NAME, r.ROOM_NUMBER, r.TYPE AS ROOM_TYPE,
                   s.NAME AS STAFF_NAME
            FROM APPOINTMENT a
            JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
            JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
            LEFT JOIN DEPARTMENT dep ON d.DEPARTMENT_ID = dep.DEPARTMENT_ID
            LEFT JOIN ROOM r ON a.ROOM_ID = r.ROOM_ID
            LEFT JOIN STAFF s ON a.STAFF_ID = s.STAFF_ID
            WHERE a.APPOINTMENT_ID = :id
        `, [req.params.id]);

        if (appt.rows.length === 0) {
            req.session.error = 'Appointment not found.';
            return res.redirect('/appointments');
        }

        // Get prescription if exists
        const prescription = await db.execute(`
            SELECT pr.*, s.NAME AS PRESCRIBED_BY
            FROM PRESCRIPTION pr
            LEFT JOIN STAFF s ON pr.STAFF_ID = s.STAFF_ID
            WHERE pr.APPOINTMENT_ID = :id
        `, [req.params.id]);

        // Get prescription medicines
        let medicines = { rows: [] };
        if (prescription.rows.length > 0) {
            medicines = await db.execute(`
                SELECT pm.*, m.NAME AS MEDICINE_NAME, m.DOSAGE_FORM, m.STRENGTH, m.UNIT_PRICE
                FROM PRESCRIPTION_MEDICINE pm
                JOIN MEDICINE m ON pm.MEDICINE_ID = m.MEDICINE_ID
                WHERE pm.PRESCRIPTION_ID = :pid
            `, [prescription.rows[0].PRESCRIPTION_ID]);
        }

        // Get allowed next stages for this role
        const role = req.session.user.role.toLowerCase();
        const currentStage = (appt.rows[0].WORKFLOW_STAGE || '').toLowerCase();
        const allowedTransitions = getNextStages(role, currentStage);

        res.render('appointments/detail', {
            pageTitle: `Appointment #${req.params.id}`,
            currentPage: 'appointments',
            user: req.session.user,
            appt: appt.rows[0],
            prescription: prescription.rows[0] || null,
            medicines: medicines.rows,
            allowedTransitions
        });
    } catch (err) {
        console.error('Appointment detail error:', err);
        req.session.error = 'Failed to load appointment details.';
        res.redirect('/appointments');
    }
});

// POST /appointments/:id/stage — update workflow stage
router.post('/:id/stage', requireAuth, async (req, res) => {
    const { new_stage } = req.body;
    const role = req.session.user.role.toLowerCase();

    try {
        // Verify current stage and role permission
        const appt = await db.execute(
            `SELECT WORKFLOW_STAGE, ROOM_ID FROM APPOINTMENT WHERE APPOINTMENT_ID = :id`,
            [req.params.id]
        );
        if (appt.rows.length === 0) {
            req.session.error = 'Appointment not found.';
            return res.redirect('/appointments');
        }

        const currentStage = (appt.rows[0].WORKFLOW_STAGE || '').toLowerCase();
        const allowed = getNextStages(role, currentStage);

        if (!allowed.includes(new_stage)) {
            req.session.error = 'You are not authorized to make this transition.';
            return res.redirect(`/appointments/${req.params.id}`);
        }

        // Update stage
        await db.execute(
            `UPDATE APPOINTMENT SET WORKFLOW_STAGE = :stage WHERE APPOINTMENT_ID = :id`,
            [new_stage, req.params.id]
        );

        // If discharged, free up the room
        if (new_stage === 'discharged' && appt.rows[0].ROOM_ID) {
            await db.execute(
                `UPDATE ROOM SET STATUS = 'available' WHERE ROOM_ID = :rid`,
                [appt.rows[0].ROOM_ID]
            );
        }

        req.session.success = `Workflow updated to "${new_stage}".`;
        res.redirect(`/appointments/${req.params.id}`);
    } catch (err) {
        console.error('Workflow update error:', err);
        req.session.error = 'Failed to update workflow stage.';
        res.redirect(`/appointments/${req.params.id}`);
    }
});

// Role-based workflow transitions
function getNextStages(role, currentStage) {
    const transitions = {
        receptionist: {
            'registered': ['checked-in'],
            'billing': ['discharged']
        },
        nurse: {
            'checked-in': ['triage'],
            'triage': ['in-consultation'],
            'in-consultation': ['post-consultation']
        },
        doctor: {
            'triage': ['in-consultation'],
            'in-consultation': ['post-consultation']
        },
        admin: {
            'registered': ['checked-in'],
            'checked-in': ['triage'],
            'triage': ['in-consultation'],
            'in-consultation': ['post-consultation'],
            'post-consultation': ['billing'],
            'billing': ['discharged']
        }
    };
    return (transitions[role] && transitions[role][currentStage]) || [];
}

module.exports = router;

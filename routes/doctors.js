const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /doctors — list doctors (admin)
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT d.DOCTOR_ID, d.NAME, d.SPECIALIZATION, d.PHONE, d.CONSULTATION_FEE AS FEE,
                   dep.DEPT_NAME, u.USERNAME
            FROM DOCTOR d
            LEFT JOIN DEPARTMENT dep ON d.DEPARTMENT_ID = dep.DEPARTMENT_ID
            LEFT JOIN USERS u ON d.USER_ID = u.USER_ID
            ORDER BY d.NAME
        `);
        res.render('doctors/list', {
            pageTitle: 'Doctor Management',
            currentPage: 'doctors',
            user: req.session.user,
            doctors: result.rows
        });
    } catch (err) {
        console.error('Doctors list error:', err);
        req.session.error = 'Failed to load doctors.';
        res.redirect('/dashboard');
    }
});

// GET /doctors/profile — doctor's own profile
router.get('/profile', requireAuth, requireRole('doctor'), async (req, res) => {
    const userId = req.session.user.user_id;
    try {
        const doc = await db.execute(`
            SELECT d.*, dep.DEPT_NAME
            FROM DOCTOR d
            LEFT JOIN DEPARTMENT dep ON d.DEPARTMENT_ID = dep.DEPARTMENT_ID
            WHERE d.USER_ID = :uid
        `, [userId]);

        const availability = await db.execute(`
            SELECT * FROM DOCTOR_AVAILABILITY
            WHERE DOCTOR_ID = :docId
            ORDER BY 
                CASE DAY 
                    WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 
                    WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 
                    WHEN 'Sunday' THEN 7 END,
                START_TIME
        `, [doc.rows[0]?.DOCTOR_ID]);

        res.render('doctors/profile', {
            pageTitle: 'My Profile',
            currentPage: 'doctors',
            user: req.session.user,
            doctor: doc.rows[0] || {},
            availability: availability.rows
        });
    } catch (err) {
        console.error('Doctor profile error:', err);
        req.session.error = 'Failed to load profile.';
        res.redirect('/dashboard');
    }
});

// GET /doctors/availability — manage availability (admin)
router.get('/availability', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const doctors = await db.execute(`SELECT DOCTOR_ID, NAME FROM DOCTOR ORDER BY NAME`);
        const slots = await db.execute(`
            SELECT da.*, d.NAME AS DOCTOR_NAME
            FROM DOCTOR_AVAILABILITY da
            JOIN DOCTOR d ON da.DOCTOR_ID = d.DOCTOR_ID
            ORDER BY d.NAME, 
                CASE da.DAY 
                    WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 
                    WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 
                    WHEN 'Sunday' THEN 7 END,
                da.START_TIME
        `);
        res.render('doctors/availability', {
            pageTitle: 'Doctor Availability',
            currentPage: 'doctors',
            user: req.session.user,
            doctors: doctors.rows,
            slots: slots.rows
        });
    } catch (err) {
        console.error('Availability error:', err);
        req.session.error = 'Failed to load availability.';
        res.redirect('/doctors');
    }
});

// POST /doctors/availability — add availability slot
router.post('/availability', requireAuth, requireRole('admin'), async (req, res) => {
    const { doctor_id, day, start_time, end_time, slot_mins } = req.body;
    try {
        await db.execute(`
            INSERT INTO DOCTOR_AVAILABILITY (AVAILABILITY_ID, DOCTOR_ID, DAY, START_TIME, END_TIME, SLOT_MINS)
            VALUES (AVAILABILITY_SEQ.NEXTVAL, :docId, :day, :startTime, :endTime, :slotMins)
        `, [doctor_id, day, start_time, end_time, slot_mins]);

        req.session.success = 'Availability slot added!';
        res.redirect('/doctors/availability');
    } catch (err) {
        console.error('Add availability error:', err);
        req.session.error = 'Failed to add slot. ' + (err.message || '');
        res.redirect('/doctors/availability');
    }
});

module.exports = router;

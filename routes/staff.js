const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /staff — list staff
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT s.STAFF_ID, s.NAME, s.ROLE, s.PHONE, s.HIRE_DATE,
                   dep.DEPT_NAME, u.USERNAME
            FROM STAFF s
            LEFT JOIN DEPARTMENT dep ON s.DEPARTMENT_ID = dep.DEPARTMENT_ID
            LEFT JOIN USERS u ON s.USER_ID = u.USER_ID
            ORDER BY s.NAME
        `);
        res.render('staff/list', {
            pageTitle: 'Staff Management',
            currentPage: 'staff',
            user: req.session.user,
            staffList: result.rows
        });
    } catch (err) {
        console.error('Staff list error:', err);
        req.session.error = 'Failed to load staff.';
        res.redirect('/dashboard');
    }
});

// GET /staff/shifts — view shifts (nurse sees own, admin sees all)
router.get('/shifts', requireAuth, async (req, res) => {
    const role = req.session.user.role.toLowerCase();
    const userId = req.session.user.user_id;

    try {
        let shifts, staffName = '';

        if (role === 'nurse') {
            const staffResult = await db.execute(
                `SELECT STAFF_ID, NAME FROM STAFF WHERE USER_ID = :uid`, [userId]
            );
            const staffId = staffResult.rows[0]?.STAFF_ID;
            staffName = staffResult.rows[0]?.NAME || '';

            shifts = await db.execute(`
                SELECT ss.*, s.NAME AS STAFF_NAME
                FROM STAFF_SHIFT ss
                JOIN STAFF s ON ss.STAFF_ID = s.STAFF_ID
                WHERE ss.STAFF_ID = :staffId
                ORDER BY ss.SHIFT_DATE DESC, ss.START_TIME
            `, [staffId]);
        } else if (role === 'admin') {
            shifts = await db.execute(`
                SELECT ss.*, s.NAME AS STAFF_NAME
                FROM STAFF_SHIFT ss
                JOIN STAFF s ON ss.STAFF_ID = s.STAFF_ID
                ORDER BY ss.SHIFT_DATE DESC, ss.START_TIME
            `);
        } else {
            return res.status(403).render('errors/403', { user: req.session.user });
        }

        const staffList = role === 'admin'
            ? await db.execute(`SELECT STAFF_ID, NAME FROM STAFF ORDER BY NAME`)
            : { rows: [] };

        res.render('staff/shifts', {
            pageTitle: role === 'nurse' ? 'My Shifts' : 'Shift Management',
            currentPage: 'staff',
            user: req.session.user,
            shifts: shifts.rows,
            staffList: staffList.rows,
            staffName
        });
    } catch (err) {
        console.error('Shifts error:', err);
        req.session.error = 'Failed to load shifts.';
        res.redirect('/dashboard');
    }
});

// POST /staff/shifts — create shift (admin only)
router.post('/shifts', requireAuth, requireRole('admin'), async (req, res) => {
    const { staff_id, shift_date, start_time, end_time, shift_type } = req.body;
    try {
        await db.execute(`
            INSERT INTO STAFF_SHIFT (STAFF_SHIFT_ID, STAFF_ID, SHIFT_DATE, START_TIME, END_TIME, SHIFT_TYPE)
            VALUES (STAFF_SHIFT_SEQ.NEXTVAL, :staffId, TO_DATE(:shiftDate, 'YYYY-MM-DD'), :startTime, :endTime, :shiftType)
        `, [staff_id, shift_date, start_time, end_time, shift_type]);

        req.session.success = 'Shift assigned successfully!';
        res.redirect('/staff/shifts');
    } catch (err) {
        console.error('Shift create error:', err);
        req.session.error = 'Failed to create shift. ' + (err.message || '');
        res.redirect('/staff/shifts');
    }
});

module.exports = router;

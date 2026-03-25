const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /rooms — list rooms
router.get('/', requireAuth, async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT r.ROOM_ID, r.ROOM_NUMBER, r.TYPE, r.STATUS, 
                   dep.DEPT_NAME, s.NAME AS ASSIGNED_STAFF
            FROM ROOM r
            LEFT JOIN DEPARTMENT dep ON r.DEPARTMENT_ID = dep.DEPARTMENT_ID
            LEFT JOIN STAFF s ON r.ASSIGNED_STAFF_ID = s.STAFF_ID
            ORDER BY dep.DEPT_NAME, r.ROOM_NUMBER
        `);

        const departments = await db.execute(`SELECT DEPARTMENT_ID, DEPT_NAME FROM DEPARTMENT ORDER BY DEPT_NAME`);
        const staffList = await db.execute(`SELECT STAFF_ID, NAME FROM STAFF ORDER BY NAME`);

        res.render('rooms/list', {
            pageTitle: 'Room Management',
            currentPage: 'rooms',
            user: req.session.user,
            rooms: result.rows,
            departments: departments.rows,
            staffList: staffList.rows
        });
    } catch (err) {
        console.error('Rooms list error:', err);
        req.session.error = 'Failed to load rooms.';
        res.redirect('/dashboard');
    }
});

// POST /rooms/:id/status — update room status
router.post('/:id/status', requireAuth, requireRole('nurse', 'admin'), async (req, res) => {
    const { status } = req.body;
    try {
        await db.execute(
            `UPDATE ROOM SET STATUS = :status WHERE ROOM_ID = :id`,
            [status, req.params.id]
        );
        req.session.success = 'Room status updated.';
        res.redirect('/rooms');
    } catch (err) {
        console.error('Room status update error:', err);
        req.session.error = 'Failed to update room status.';
        res.redirect('/rooms');
    }
});

// POST /rooms/:id/assign — assign staff to room
router.post('/:id/assign', requireAuth, requireRole('nurse', 'admin'), async (req, res) => {
    const { staff_id } = req.body;
    try {
        await db.execute(
            `UPDATE ROOM SET ASSIGNED_STAFF_ID = :staffId WHERE ROOM_ID = :id`,
            [staff_id || null, req.params.id]
        );
        req.session.success = 'Staff assigned to room.';
        res.redirect('/rooms');
    } catch (err) {
        console.error('Room assign error:', err);
        req.session.error = 'Failed to assign staff.';
        res.redirect('/rooms');
    }
});

module.exports = router;

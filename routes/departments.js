const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /departments — list departments
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT dep.DEPARTMENT_ID, dep.DEPT_NAME, dep.LOCATION, dep.FLOOR_NO,
                   (SELECT COUNT(*) FROM DOCTOR d WHERE d.DEPARTMENT_ID = dep.DEPARTMENT_ID) AS DOCTOR_COUNT,
                   (SELECT COUNT(*) FROM STAFF s WHERE s.DEPARTMENT_ID = dep.DEPARTMENT_ID) AS STAFF_COUNT,
                   (SELECT COUNT(*) FROM ROOM r WHERE r.DEPARTMENT_ID = dep.DEPARTMENT_ID) AS ROOM_COUNT
            FROM DEPARTMENT dep
            ORDER BY dep.DEPT_NAME
        `);
        res.render('departments/list', {
            pageTitle: 'Departments',
            currentPage: 'departments',
            user: req.session.user,
            departments: result.rows
        });
    } catch (err) {
        console.error('Departments error:', err);
        req.session.error = 'Failed to load departments.';
        res.redirect('/dashboard');
    }
});

// POST /departments — create department
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
    const { dept_name, location, floor_no } = req.body;
    try {
        await db.execute(`
            INSERT INTO DEPARTMENT (DEPARTMENT_ID, DEPT_NAME, LOCATION, FLOOR_NO)
            VALUES (DEPARTMENT_SEQ.NEXTVAL, :name, :location, :floor)
        `, [dept_name, location, floor_no]);

        req.session.success = `Department "${dept_name}" created!`;
        res.redirect('/departments');
    } catch (err) {
        console.error('Department create error:', err);
        req.session.error = 'Failed to create department. ' + (err.message || '');
        res.redirect('/departments');
    }
});

module.exports = router;

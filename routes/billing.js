const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

// List all bills
router.get('/', requireAuth, async (req, res) => {
    try {
        const bills = await db.execute(`
            SELECT b.BILL_ID, b.AMOUNT, b.STATUS, b.CREATED_AT, b.PAID_AT,
                   p.NAME AS PATIENT_NAME,
                   a.APPOINTMENT_DATE
            FROM BILL b
            JOIN PATIENT p ON b.PATIENT_ID = p.PATIENT_ID
            LEFT JOIN APPOINTMENT a ON b.APPOINTMENT_ID = a.APPOINTMENT_ID
            ORDER BY b.BILL_ID DESC
        `);
        res.render('billing/index', {
            pageTitle: 'Billing',
            currentPage: 'billing',
            user: req.session.user,
            bills: bills.rows
        });
    } catch (err) {
        console.error(err);
        res.render('errors/500', { user: req.session.user });
    }
});

// Create bill form
router.get('/create', requireAuth, async (req, res) => {
    try {
        const patients = await db.execute(`SELECT PATIENT_ID, NAME FROM PATIENT ORDER BY NAME`);
        const appointments = await db.execute(`
            SELECT a.APPOINTMENT_ID, a.APPOINTMENT_DATE, p.NAME AS PATIENT_NAME
            FROM APPOINTMENT a
            JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
            WHERE LOWER(a.STATUS) != 'cancelled'
            ORDER BY a.APPOINTMENT_DATE DESC
            FETCH FIRST 50 ROWS ONLY
        `);
        res.render('billing/create', {
            pageTitle: 'Create Bill',
            currentPage: 'billing',
            user: req.session.user,
            patients: patients.rows,
            appointments: appointments.rows
        });
    } catch (err) {
        console.error(err);
        res.render('errors/500', { user: req.session.user });
    }
});

// Save new bill
router.post('/create', requireAuth, async (req, res) => {
    const { patient_id, appointment_id, amount } = req.body;
    try {
        await db.execute(`
            INSERT INTO BILL (PATIENT_ID, APPOINTMENT_ID, AMOUNT, STATUS)
            VALUES (:pid, :aid, :amt, 'PENDING')
        `, [patient_id, appointment_id || null, amount]);
        req.session.success = 'Bill created successfully.';
        res.redirect('/billing');
    } catch (err) {
        console.error(err);
        req.session.error = 'Failed to create bill.';
        res.redirect('/billing/create');
    }
});

// Mark bill as paid
router.post('/:id/pay', requireAuth, async (req, res) => {
    try {
        await db.execute(`
            UPDATE BILL SET STATUS = 'PAID', PAID_AT = SYSDATE
            WHERE BILL_ID = :id
        `, [req.params.id]);
        req.session.success = 'Bill marked as paid.';
        res.redirect('/billing');
    } catch (err) {
        console.error(err);
        req.session.error = 'Failed to update bill.';
        res.redirect('/billing');
    }
});

// View single bill (printable)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const bill = await db.execute(`
            SELECT b.BILL_ID, b.AMOUNT, b.STATUS, b.CREATED_AT, b.PAID_AT,
                   p.NAME AS PATIENT_NAME, p.PHONE, p.GENDER,
                   a.APPOINTMENT_DATE, d.NAME AS DOCTOR_NAME
            FROM BILL b
            JOIN PATIENT p ON b.PATIENT_ID = p.PATIENT_ID
            LEFT JOIN APPOINTMENT a ON b.APPOINTMENT_ID = a.APPOINTMENT_ID
            LEFT JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
            WHERE b.BILL_ID = :id
        `, [req.params.id]);

        if (!bill.rows.length) return res.render('errors/404', { user: req.session.user });

        res.render('billing/view', {
            pageTitle: 'Invoice',
            currentPage: 'billing',
            user: req.session.user,
            bill: bill.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.render('errors/500', { user: req.session.user });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /billing — list bills
router.get('/', requireAuth, requireRole('receptionist', 'admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT b.BILL_ID, b.TOTAL_AMOUNT, b.PAYMENT_STATUS, b.PAYMENT_METHOD, b.GENERATED_AT,
                   p.NAME AS PATIENT_NAME, a.APPOINTMENT_ID, a.DATE_OF_VISIT
            FROM BILLING b
            JOIN APPOINTMENT a ON b.APPOINTMENT_ID = a.APPOINTMENT_ID
            JOIN PATIENT p ON b.PATIENT_ID = p.PATIENT_ID
            ORDER BY b.BILL_ID DESC
        `);
        res.render('billing/list', {
            pageTitle: 'Billing',
            currentPage: 'billing',
            user: req.session.user,
            bills: result.rows
        });
    } catch (err) {
        console.error('Billing list error:', err);
        req.session.error = 'Failed to load billing records.';
        res.redirect('/dashboard');
    }
});

// GET /billing/generate/:appointmentId — generate bill
router.get('/generate/:appointmentId', requireAuth, requireRole('receptionist', 'admin'), async (req, res) => {
    try {
        // Get appointment details
        const appt = await db.execute(`
            SELECT a.*, p.NAME AS PATIENT_NAME, p.PATIENT_ID,
                   d.NAME AS DOCTOR_NAME, d.FEE AS DOCTOR_FEE, d.SPECIALIZATION,
                   dep.DEPT_NAME
            FROM APPOINTMENT a
            JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
            JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
            LEFT JOIN DEPARTMENT dep ON d.DEPARTMENT_ID = dep.DEPARTMENT_ID
            WHERE a.APPOINTMENT_ID = :id
        `, [req.params.appointmentId]);

        if (appt.rows.length === 0) {
            req.session.error = 'Appointment not found.';
            return res.redirect('/billing');
        }

        // Get prescription medicines for cost calculation
        const medicines = await db.execute(`
            SELECT pm.*, m.NAME AS MEDICINE_NAME, m.UNIT_PRICE, m.DOSAGE_FORM
            FROM PRESCRIPTION_MEDICINE pm
            JOIN MEDICINE m ON pm.MEDICINE_ID = m.MEDICINE_ID
            JOIN PRESCRIPTION pr ON pm.PRESCRIPTION_ID = pr.PRESCRIPTION_ID
            WHERE pr.APPOINTMENT_ID = :id
        `, [req.params.appointmentId]);

        // Calculate total
        const doctorFee = appt.rows[0].DOCTOR_FEE || 0;
        const medicineCost = medicines.rows.reduce((sum, m) => sum + (m.UNIT_PRICE || 0), 0);
        const totalAmount = doctorFee + medicineCost;

        res.render('billing/generate', {
            pageTitle: 'Generate Bill',
            currentPage: 'billing',
            user: req.session.user,
            appt: appt.rows[0],
            medicines: medicines.rows,
            doctorFee,
            medicineCost,
            totalAmount
        });
    } catch (err) {
        console.error('Bill generation error:', err);
        req.session.error = 'Failed to generate bill.';
        res.redirect('/billing');
    }
});

// POST /billing/generate/:appointmentId — save bill
router.post('/generate/:appointmentId', requireAuth, requireRole('receptionist', 'admin'), async (req, res) => {
    const { total_amount, payment_method } = req.body;
    try {
        // Get patient ID from appointment
        const appt = await db.execute(
            `SELECT PATIENT_ID FROM APPOINTMENT WHERE APPOINTMENT_ID = :id`,
            [req.params.appointmentId]
        );

        await db.execute(`
            INSERT INTO BILLING (BILL_ID, APPOINTMENT_ID, PATIENT_ID, TOTAL_AMOUNT, PAYMENT_STATUS, PAYMENT_METHOD, GENERATED_AT)
            VALUES (BILLING_SEQ.NEXTVAL, :apptId, :patientId, :amount, 'Paid', :method, SYSDATE)
        `, [req.params.appointmentId, appt.rows[0].PATIENT_ID, total_amount, payment_method]);

        // Update workflow to billing/discharged
        await db.execute(
            `UPDATE APPOINTMENT SET WORKFLOW_STAGE = 'billing' WHERE APPOINTMENT_ID = :id`,
            [req.params.appointmentId]
        );

        req.session.success = 'Bill generated successfully!';
        res.redirect('/billing');
    } catch (err) {
        console.error('Bill save error:', err);
        req.session.error = 'Failed to save bill. ' + (err.message || '');
        res.redirect(`/billing/generate/${req.params.appointmentId}`);
    }
});

// GET /billing/:id — view invoice
router.get('/:id', requireAuth, requireRole('receptionist', 'admin'), async (req, res) => {
    try {
        const bill = await db.execute(`
            SELECT b.*, p.NAME AS PATIENT_NAME, p.PHONE, p.EMAIL,
                   a.DATE_OF_VISIT, a.APPOINTMENT_ID,
                   d.NAME AS DOCTOR_NAME, d.FEE AS DOCTOR_FEE, d.SPECIALIZATION,
                   dep.DEPT_NAME
            FROM BILLING b
            JOIN APPOINTMENT a ON b.APPOINTMENT_ID = a.APPOINTMENT_ID
            JOIN PATIENT p ON b.PATIENT_ID = p.PATIENT_ID
            JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
            LEFT JOIN DEPARTMENT dep ON d.DEPARTMENT_ID = dep.DEPARTMENT_ID
            WHERE b.BILL_ID = :id
        `, [req.params.id]);

        if (bill.rows.length === 0) {
            req.session.error = 'Bill not found.';
            return res.redirect('/billing');
        }

        const medicines = await db.execute(`
            SELECT pm.*, m.NAME AS MEDICINE_NAME, m.UNIT_PRICE, m.DOSAGE_FORM
            FROM PRESCRIPTION_MEDICINE pm
            JOIN MEDICINE m ON pm.MEDICINE_ID = m.MEDICINE_ID
            JOIN PRESCRIPTION pr ON pm.PRESCRIPTION_ID = pr.PRESCRIPTION_ID
            WHERE pr.APPOINTMENT_ID = :apptId
        `, [bill.rows[0].APPOINTMENT_ID]);

        res.render('billing/invoice', {
            pageTitle: `Invoice #${req.params.id}`,
            currentPage: 'billing',
            user: req.session.user,
            bill: bill.rows[0],
            medicines: medicines.rows
        });
    } catch (err) {
        console.error('Invoice view error:', err);
        req.session.error = 'Failed to load invoice.';
        res.redirect('/billing');
    }
});

module.exports = router;

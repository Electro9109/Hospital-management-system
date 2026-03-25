const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    const role = req.session.user.role.toLowerCase();
    const userId = req.session.user.user_id;

    try {
        switch (role) {
            case 'receptionist':
                await renderReceptionistDashboard(req, res, userId);
                break;
            case 'doctor':
                await renderDoctorDashboard(req, res, userId);
                break;
            case 'nurse':
                await renderNurseDashboard(req, res, userId);
                break;
            case 'admin':
                await renderAdminDashboard(req, res, userId);
                break;
            default:
                res.render('errors/403', { user: req.session.user });
        }
    } catch (err) {
        console.error('Dashboard error:', err);
        req.session.error = 'Failed to load dashboard.';
        res.render('errors/500', { user: req.session.user });
    }
});

// =========================================================
// RECEPTIONIST DASHBOARD
// =========================================================
async function renderReceptionistDashboard(req, res, userId) {
    // Today's appointments
    const todayAppts = await db.execute(`
        SELECT a.APPOINTMENT_ID, a.DATE_OF_VISIT, a.START_TIME, a.END_TIME, a.STATUS, a.WORKFLOW_STAGE,
               p.NAME AS PATIENT_NAME, d.NAME AS DOCTOR_NAME, dep.DEPT_NAME
        FROM APPOINTMENT a
        JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
        JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
        LEFT JOIN DEPARTMENT dep ON d.DEPARTMENT_ID = dep.DEPARTMENT_ID
        WHERE TRUNC(a.DATE_OF_VISIT) = TRUNC(SYSDATE)
        ORDER BY a.START_TIME
    `);

    // Room availability
    const rooms = await db.execute(`
        SELECT r.ROOM_ID, r.ROOM_NUMBER, r.TYPE, r.STATUS, dep.DEPT_NAME
        FROM ROOM r
        LEFT JOIN DEPARTMENT dep ON r.DEPARTMENT_ID = dep.DEPARTMENT_ID
        ORDER BY dep.DEPT_NAME, r.ROOM_NUMBER
    `);

    // Stats
    const totalPatients = await db.execute(`SELECT COUNT(*) AS CNT FROM PATIENT`);
    const todayCount = await db.execute(`
        SELECT COUNT(*) AS CNT FROM APPOINTMENT WHERE TRUNC(DATE_OF_VISIT) = TRUNC(SYSDATE)
    `);
    const availableRooms = await db.execute(`
        SELECT COUNT(*) AS CNT FROM ROOM WHERE LOWER(STATUS) = 'available'
    `);
    const pendingBills = await db.execute(`
        SELECT COUNT(*) AS CNT FROM BILLING WHERE LOWER(PAYMENT_STATUS) = 'unpaid'
    `);

    res.render('dashboard/receptionist', {
        pageTitle: 'Front Desk',
        currentPage: 'dashboard',
        user: req.session.user,
        todayAppts: todayAppts.rows,
        rooms: rooms.rows,
        stats: {
            totalPatients: totalPatients.rows[0]?.CNT || 0,
            todayAppointments: todayCount.rows[0]?.CNT || 0,
            availableRooms: availableRooms.rows[0]?.CNT || 0,
            pendingBills: pendingBills.rows[0]?.CNT || 0
        }
    });
}

// =========================================================
// DOCTOR DASHBOARD
// =========================================================
async function renderDoctorDashboard(req, res, userId) {
    // Get doctor record for this user
    const doctorResult = await db.execute(
        `SELECT DOCTOR_ID, NAME, SPECIALIZATION, DEPARTMENT_ID FROM DOCTOR WHERE USER_ID = :uid`,
        [userId]
    );
    const doctor = doctorResult.rows[0] || {};

    // My appointments today
    const myAppts = await db.execute(`
        SELECT a.APPOINTMENT_ID, a.DATE_OF_VISIT, a.START_TIME, a.END_TIME, a.STATUS, a.WORKFLOW_STAGE,
               p.NAME AS PATIENT_NAME, p.PATIENT_ID, p.PHONE AS PATIENT_PHONE, p.GENDER, p.BLOOD_GROUP,
               r.ROOM_NUMBER
        FROM APPOINTMENT a
        JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
        LEFT JOIN ROOM r ON a.ROOM_ID = r.ROOM_ID
        WHERE a.DOCTOR_ID = :docId AND TRUNC(a.DATE_OF_VISIT) = TRUNC(SYSDATE)
        ORDER BY a.START_TIME
    `, [doctor.DOCTOR_ID]);

    // Upcoming appointments (next 7 days)
    const upcomingAppts = await db.execute(`
        SELECT a.APPOINTMENT_ID, a.DATE_OF_VISIT, a.START_TIME, a.STATUS,
               p.NAME AS PATIENT_NAME
        FROM APPOINTMENT a
        JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
        WHERE a.DOCTOR_ID = :docId 
              AND a.DATE_OF_VISIT > TRUNC(SYSDATE)
              AND a.DATE_OF_VISIT <= TRUNC(SYSDATE) + 7
        ORDER BY a.DATE_OF_VISIT, a.START_TIME
    `, [doctor.DOCTOR_ID]);

    // Stats
    const totalAppts = await db.execute(
        `SELECT COUNT(*) AS CNT FROM APPOINTMENT WHERE DOCTOR_ID = :docId AND TRUNC(DATE_OF_VISIT) = TRUNC(SYSDATE)`,
        [doctor.DOCTOR_ID]
    );
    const pendingConsult = await db.execute(
        `SELECT COUNT(*) AS CNT FROM APPOINTMENT WHERE DOCTOR_ID = :docId AND LOWER(WORKFLOW_STAGE) IN ('triage','checked-in') AND TRUNC(DATE_OF_VISIT) = TRUNC(SYSDATE)`,
        [doctor.DOCTOR_ID]
    );
    const completedToday = await db.execute(
        `SELECT COUNT(*) AS CNT FROM APPOINTMENT WHERE DOCTOR_ID = :docId AND LOWER(WORKFLOW_STAGE) IN ('post-consultation','billing','discharged') AND TRUNC(DATE_OF_VISIT) = TRUNC(SYSDATE)`,
        [doctor.DOCTOR_ID]
    );

    res.render('dashboard/doctor', {
        pageTitle: 'My Schedule',
        currentPage: 'dashboard',
        user: req.session.user,
        doctor,
        myAppts: myAppts.rows,
        upcomingAppts: upcomingAppts.rows,
        stats: {
            todayTotal: totalAppts.rows[0]?.CNT || 0,
            pendingConsult: pendingConsult.rows[0]?.CNT || 0,
            completedToday: completedToday.rows[0]?.CNT || 0
        }
    });
}

// =========================================================
// NURSE DASHBOARD
// =========================================================
async function renderNurseDashboard(req, res, userId) {
    // Get staff record for this user
    const staffResult = await db.execute(
        `SELECT STAFF_ID, NAME, ROLE, DEPARTMENT_ID FROM STAFF WHERE USER_ID = :uid`,
        [userId]
    );
    const staff = staffResult.rows[0] || {};

    // Floor view — rooms in nurse's department
    const floorRooms = await db.execute(`
        SELECT r.ROOM_ID, r.ROOM_NUMBER, r.TYPE, r.STATUS, dep.DEPT_NAME,
               s.NAME AS ASSIGNED_STAFF
        FROM ROOM r
        LEFT JOIN DEPARTMENT dep ON r.DEPARTMENT_ID = dep.DEPARTMENT_ID
        LEFT JOIN STAFF s ON r.ASSIGNED_STAFF_ID = s.STAFF_ID
        ORDER BY dep.DEPT_NAME, r.ROOM_NUMBER
    `);

    // Active appointments needing workflow updates
    const activeAppts = await db.execute(`
        SELECT a.APPOINTMENT_ID, a.WORKFLOW_STAGE, a.START_TIME,
               p.NAME AS PATIENT_NAME, d.NAME AS DOCTOR_NAME,
               r.ROOM_NUMBER
        FROM APPOINTMENT a
        JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
        JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
        LEFT JOIN ROOM r ON a.ROOM_ID = r.ROOM_ID
        WHERE TRUNC(a.DATE_OF_VISIT) = TRUNC(SYSDATE)
              AND LOWER(a.WORKFLOW_STAGE) IN ('checked-in','in-consultation')
        ORDER BY a.START_TIME
    `);

    // My shifts this week
    const myShifts = await db.execute(`
        SELECT STAFF_SHIFT_ID, SHIFT_DATE, START_TIME, END_TIME, SHIFT_TYPE
        FROM STAFF_SHIFT
        WHERE STAFF_ID = :staffId
              AND SHIFT_DATE >= TRUNC(SYSDATE)
              AND SHIFT_DATE <= TRUNC(SYSDATE) + 7
        ORDER BY SHIFT_DATE, START_TIME
    `, [staff.STAFF_ID]);

    res.render('dashboard/nurse', {
        pageTitle: 'Floor View',
        currentPage: 'dashboard',
        user: req.session.user,
        staff,
        floorRooms: floorRooms.rows,
        activeAppts: activeAppts.rows,
        myShifts: myShifts.rows
    });
}

// =========================================================
// ADMIN DASHBOARD
// =========================================================
async function renderAdminDashboard(req, res, userId) {
    // Overview stats
    const totalPatients = await db.execute(`SELECT COUNT(*) AS CNT FROM PATIENT`);
    const totalDoctors = await db.execute(`SELECT COUNT(*) AS CNT FROM DOCTOR`);
    const totalStaff = await db.execute(`SELECT COUNT(*) AS CNT FROM STAFF`);
    const todayAppts = await db.execute(
        `SELECT COUNT(*) AS CNT FROM APPOINTMENT WHERE TRUNC(DATE_OF_VISIT) = TRUNC(SYSDATE)`
    );
    const totalRooms = await db.execute(`SELECT COUNT(*) AS CNT FROM ROOM`);
    const availableRooms = await db.execute(
        `SELECT COUNT(*) AS CNT FROM ROOM WHERE LOWER(STATUS) = 'available'`
    );

    // Revenue this month
    const revenue = await db.execute(`
        SELECT NVL(SUM(TOTAL_AMOUNT), 0) AS TOTAL 
        FROM BILLING 
        WHERE TRUNC(GENERATED_AT, 'MM') = TRUNC(SYSDATE, 'MM')
    `);

    // Department breakdown
    const departments = await db.execute(`
        SELECT dep.DEPT_NAME, dep.LOCATION, dep.FLOOR_NO,
               (SELECT COUNT(*) FROM DOCTOR d WHERE d.DEPARTMENT_ID = dep.DEPARTMENT_ID) AS DOCTOR_COUNT,
               (SELECT COUNT(*) FROM STAFF s WHERE s.DEPARTMENT_ID = dep.DEPARTMENT_ID) AS STAFF_COUNT,
               (SELECT COUNT(*) FROM ROOM r WHERE r.DEPARTMENT_ID = dep.DEPARTMENT_ID) AS ROOM_COUNT
        FROM DEPARTMENT dep
        ORDER BY dep.DEPT_NAME
    `);

    // Recent appointments
    const recentAppts = await db.execute(`
        SELECT a.APPOINTMENT_ID, a.DATE_OF_VISIT, a.STATUS, a.WORKFLOW_STAGE,
               p.NAME AS PATIENT_NAME, d.NAME AS DOCTOR_NAME
        FROM APPOINTMENT a
        JOIN PATIENT p ON a.PATIENT_ID = p.PATIENT_ID
        JOIN DOCTOR d ON a.DOCTOR_ID = d.DOCTOR_ID
        WHERE ROWNUM <= 10
        ORDER BY a.APPOINTMENT_ID DESC
    `);

    res.render('dashboard/admin', {
        pageTitle: 'Admin Dashboard',
        currentPage: 'dashboard',
        user: req.session.user,
        stats: {
            totalPatients: totalPatients.rows[0]?.CNT || 0,
            totalDoctors: totalDoctors.rows[0]?.CNT || 0,
            totalStaff: totalStaff.rows[0]?.CNT || 0,
            todayAppointments: todayAppts.rows[0]?.CNT || 0,
            totalRooms: totalRooms.rows[0]?.CNT || 0,
            availableRooms: availableRooms.rows[0]?.CNT || 0,
            revenue: revenue.rows[0]?.TOTAL || 0
        },
        departments: departments.rows,
        recentAppts: recentAppts.rows
    });
}

module.exports = router;

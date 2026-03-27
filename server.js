const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const db = require('./db/connection');
const { registerHelpers } = require('./middleware/helpers');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'hospital_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        httpOnly: true
    }
}));

// Flash messages middleware
app.use((req, res, next) => {
    res.locals.success = req.session.success || null;
    res.locals.error = req.session.error || null;
    delete req.session.success;
    delete req.session.error;
    next();
});

// Register EJS helpers
registerHelpers(app);

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const roomRoutes = require('./routes/rooms');
const prescriptionRoutes = require('./routes/prescriptions');
const billingRoutes = require('./routes/billing');
const staffRoutes = require('./routes/staff');
const doctorRoutes = require('./routes/doctors');
const departmentRoutes = require('./routes/departments');

app.use('/billing', require('./routes/billing'));
app.use('/prescriptions', require('./routes/prescriptions'));

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/patients', patientRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/rooms', roomRoutes);
app.use('/prescriptions', prescriptionRoutes);
app.use('/billing', billingRoutes);
app.use('/staff', staffRoutes);
app.use('/doctors', doctorRoutes);
app.use('/departments', departmentRoutes);


// 404 handler
app.use((req, res) => {
    res.status(404).render('errors/404', { user: req.session ? req.session.user : null });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).render('errors/500', { user: req.session ? req.session.user : null });
});

// Start server
async function start() {
    try {
        await db.initialize();
        app.listen(PORT, () => {
            console.log(`🏥 Hospital Management System running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    await db.close();
    process.exit(0);
});

start();

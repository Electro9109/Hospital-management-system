const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/connection');
const { guestOnly } = require('../middleware/auth');

// GET / — redirect to dashboard or login
router.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.redirect('/login');
});

// GET /login
router.get('/login', guestOnly, (req, res) => {
    res.render('auth/login', { error: null });
});

// POST /login
router.post('/login', guestOnly, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('auth/login', { error: 'Please enter both username and password.' });
    }

    try {
        const result = await db.execute(
            `SELECT user_id, username, password, role, status FROM USERS WHERE LOWER(username) = LOWER(:username)`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.render('auth/login', { error: 'Invalid username or password.' });
        }

        const user = result.rows[0];

        // Check if account is active
        if (user.STATUS && user.STATUS.toLowerCase() !== 'active') {
            return res.render('auth/login', { error: 'Your account is inactive. Contact admin.' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.PASSWORD);
        if (!validPassword) {
            return res.render('auth/login', { error: 'Invalid username or password.' });
        }

        // Set session
        req.session.user = {
            user_id: user.USER_ID,
            username: user.USERNAME,
            role: user.ROLE
        };

        req.session.success = `Welcome back, ${user.USERNAME}!`;
        res.redirect('/dashboard');

    } catch (err) {
        console.error('Login error:', err);
        res.render('auth/login', { error: 'An error occurred. Please try again.' });
    }
});

// GET /logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/login');
    });
});

module.exports = router;

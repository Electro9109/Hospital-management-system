// Authentication middleware

function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        // Make user available to all EJS templates
        res.locals.user = req.session.user;
        return next();
    }
    res.redirect('/login');
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }
        const userRole = req.session.user.role.toLowerCase();
        if (roles.map(r => r.toLowerCase()).includes(userRole)) {
            res.locals.user = req.session.user;
            return next();
        }
        res.status(403).render('errors/403', { user: req.session.user });
    };
}

// Guest only (for login page — redirect if already logged in)
function guestOnly(req, res, next) {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
}

module.exports = { requireAuth, requireRole, guestOnly };

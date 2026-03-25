// EJS template helpers — available in all views

function registerHelpers(app) {
    app.locals.formatDate = function (date) {
        if (!date) return '—';
        const d = new Date(date);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    app.locals.formatTime = function (time) {
        if (!time) return '—';
        // Handle Oracle date/time objects or strings
        if (typeof time === 'string') {
            const [h, m] = time.split(':');
            const hour = parseInt(h);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const h12 = hour % 12 || 12;
            return `${h12}:${m} ${ampm}`;
        }
        return time;
    };

    app.locals.statusBadge = function (status) {
        const statusMap = {
            'active': 'badge-success',
            'available': 'badge-success',
            'occupied': 'badge-warning',
            'completed': 'badge-success',
            'scheduled': 'badge-info',
            'cancelled': 'badge-danger',
            'pending': 'badge-warning',
            'paid': 'badge-success',
            'unpaid': 'badge-danger',
            'inactive': 'badge-muted',
            'under_maintenance': 'badge-danger'
        };
        const cls = statusMap[(status || '').toLowerCase()] || 'badge-muted';
        return `<span class="badge ${cls}">${status || 'N/A'}</span>`;
    };

    app.locals.workflowStage = function (stage) {
        const stages = [
            'registered', 'checked-in', 'triage',
            'in-consultation', 'post-consultation', 'billing', 'discharged'
        ];
        const idx = stages.indexOf((stage || '').toLowerCase());
        return { stages, currentIndex: idx, current: stage };
    };

    app.locals.roleColor = function (role) {
        const colors = {
            'admin': '#8b5cf6',
            'receptionist': '#0ea5e9',
            'doctor': '#10b981',
            'nurse': '#f59e0b'
        };
        return colors[(role || '').toLowerCase()] || '#64748b';
    };
}

module.exports = { registerHelpers };

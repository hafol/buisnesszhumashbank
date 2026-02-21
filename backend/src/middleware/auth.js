const jwt = require('jsonwebtoken');
const supabase = require('../services/supabase');

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch fresh user from DB to get latest role/subscription
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, business_type, iin, company, role, subscription_status, subscription_end_date')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Check if user has paid/developer access (for premium features)
function requirePremium(req, res, next) {
    const user = req.user;
    const isDeveloper = user.role === 'developer';
    const isPaid = user.role === 'paid' &&
        user.subscription_status === 'active' &&
        (!user.subscription_end_date || new Date(user.subscription_end_date) > new Date());

    if (isDeveloper || isPaid) {
        return next();
    }
    return res.status(403).json({
        error: 'Premium subscription required',
        code: 'SUBSCRIPTION_REQUIRED'
    });
}

module.exports = { authMiddleware, requirePremium };

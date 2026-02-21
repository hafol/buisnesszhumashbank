const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt:', req.body.email);
        const { email, password, name, businessType, iin, company, registrationDate, city } = req.body;

        if (!email || !password || !name || !businessType || !iin) {
            return res.status(400).json({ error: 'Заполните все обязательные поля' });
        }

        // Check if email already exists
        const { data: existing, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Supabase check error:', checkError);
            throw checkError;
        }

        if (existing) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // Developer gets full access automatically
        const isDeveloper = email.toLowerCase() === (process.env.DEVELOPER_EMAIL || '').toLowerCase();

        const { data: user, error: insertError } = await supabase
            .from('users')
            .insert({
                email: email.toLowerCase(),
                password_hash: passwordHash,
                name,
                business_type: businessType,
                iin,
                company,
                registration_date: registrationDate,
                city: city || 'Алматы',
                role: isDeveloper ? 'developer' : 'free',
                subscription_status: isDeveloper ? 'active' : 'inactive',
            })
            .select('id, email, name, business_type, iin, company, role, subscription_status')
            .single();

        if (insertError) {
            console.error('Supabase insert error details:', insertError);
            return res.status(400).json({ error: insertError.message || 'Ошибка базы данных' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user });
    } catch (err) {
        console.error('Register server error:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        const { password_hash, ...safeUser } = user;
        res.json({ token, user: safeUser });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Ошибка при входе' });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    const { password_hash, ...safeUser } = req.user;
    res.json(req.user);
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, company, city } = req.body;
        const { data, error } = await supabase
            .from('users')
            .update({ name, company, city, updated_at: new Date() })
            .eq('id', req.user.id)
            .select('id, email, name, business_type, iin, company, city, role, subscription_status')
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка обновления профиля' });
    }
});

module.exports = router;

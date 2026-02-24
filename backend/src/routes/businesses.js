const express = require('express');
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET all businesses for current user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Get businesses error:', err);
        res.status(500).json({ error: 'Ошибка загрузки бизнесов' });
    }
});

// POST create business
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, type, description, color, icon } = req.body;
        if (!name) return res.status(400).json({ error: 'Название обязательно' });

        const { data, error } = await supabase
            .from('businesses')
            .insert({
                user_id: req.user.id,
                name,
                type: type || 'other',
                description: description || '',
                color: color || '#10B981',
                icon: icon || '🏢',
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('Create business error:', err);
        res.status(500).json({ error: 'Ошибка создания бизнеса' });
    }
});

// PUT update business
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, type, description, color, icon } = req.body;
        const { data, error } = await supabase
            .from('businesses')
            .update({ name, type, description, color, icon, updated_at: new Date() })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка обновления бизнеса' });
    }
});

// DELETE business
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('businesses')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления бизнеса' });
    }
});

module.exports = router;

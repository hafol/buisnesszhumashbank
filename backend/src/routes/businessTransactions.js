const express = require('express');
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router({ mergeParams: true }); // to get :businessId

// GET transactions for a business
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Verify business belongs to user
        const { data: biz } = await supabase
            .from('businesses')
            .select('id')
            .eq('id', businessId)
            .eq('user_id', req.user.id)
            .single();

        if (!biz) return res.status(404).json({ error: 'Бизнес не найден' });

        const { data, error } = await supabase
            .from('business_transactions')
            .select('*')
            .eq('business_id', businessId)
            .order('date', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Get transactions error:', err);
        res.status(500).json({ error: 'Ошибка загрузки транзакций' });
    }
});

// POST add transaction
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { amount, type, category, description, date } = req.body;

        if (!amount || !type) return res.status(400).json({ error: 'Сумма и тип обязательны' });

        // Verify business belongs to user
        const { data: biz } = await supabase
            .from('businesses')
            .select('id')
            .eq('id', businessId)
            .eq('user_id', req.user.id)
            .single();

        if (!biz) return res.status(404).json({ error: 'Бизнес не найден' });

        const { data, error } = await supabase
            .from('business_transactions')
            .insert({
                business_id: businessId,
                amount: parseFloat(amount),
                type, // 'income' | 'expense'
                category: category || 'other',
                description: description || '',
                date: date || new Date().toISOString().split('T')[0],
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('Create transaction error:', err);
        res.status(500).json({ error: 'Ошибка создания транзакции' });
    }
});

// DELETE transaction
router.delete('/:txId', authMiddleware, async (req, res) => {
    try {
        const { businessId, txId } = req.params;

        // Verify ownership via business
        const { data: biz } = await supabase
            .from('businesses')
            .select('id')
            .eq('id', businessId)
            .eq('user_id', req.user.id)
            .single();

        if (!biz) return res.status(404).json({ error: 'Бизнес не найден' });

        const { error } = await supabase
            .from('business_transactions')
            .delete()
            .eq('id', txId)
            .eq('business_id', businessId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления транзакции' });
    }
});

module.exports = router;

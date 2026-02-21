const express = require('express');
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET all bank accounts 
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка загрузки банковских счетов' });
    }
});

// POST add bank account
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { bankName, accountNumber, balance, currency, color } = req.body;

        if (!bankName || !accountNumber) {
            return res.status(400).json({ error: 'Название банка и номер счёта обязательны' });
        }

        const { data, error } = await supabase
            .from('bank_accounts')
            .insert({
                user_id: req.user.id,
                bank_name: bankName,
                account_number: accountNumber,
                balance: balance || 0,
                currency: currency || 'KZT',
                color: color || '#10B981',
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка добавления банковского счёта' });
    }
});

// PUT update balance
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { balance, bankName, accountNumber, color } = req.body;
        const { data, error } = await supabase
            .from('bank_accounts')
            .update({ balance, bank_name: bankName, account_number: accountNumber, color })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка обновления счёта' });
    }
});

// DELETE bank account
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления счёта' });
    }
});

module.exports = router;

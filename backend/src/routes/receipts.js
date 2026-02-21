const express = require('express');
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET all receipts
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data: receipts, error } = await supabase
            .from('receipts')
            .select(`*, receipt_items(*)`)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(receipts || []);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка загрузки чеков' });
    }
});

// POST create receipt
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { customerName, customerIin, items, total, paymentMethod } = req.body;

        // Get next receipt number
        const { count } = await supabase
            .from('receipts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.user.id);

        const receiptNumber = String((count || 0) + 1).padStart(4, '0');

        const { data: receipt, error: receiptError } = await supabase
            .from('receipts')
            .insert({
                user_id: req.user.id,
                receipt_number: receiptNumber,
                customer_name: customerName,
                customer_iin: customerIin,
                total,
                payment_method: paymentMethod,
                seller_name: req.user.company || req.user.name,
                seller_iin: req.user.iin,
                seller_address: 'г. Алматы',
            })
            .select()
            .single();

        if (receiptError) throw receiptError;

        // Insert items
        if (items && items.length > 0) {
            const itemRows = items
                .filter(i => i.description)
                .map(i => ({
                    receipt_id: receipt.id,
                    description: i.description,
                    quantity: i.quantity,
                    unit_price: i.unitPrice,
                    total: i.quantity * i.unitPrice,
                }));
            await supabase.from('receipt_items').insert(itemRows);
        }

        const { data: fullReceipt } = await supabase
            .from('receipts')
            .select(`*, receipt_items(*)`)
            .eq('id', receipt.id)
            .single();

        res.status(201).json(fullReceipt);
    } catch (err) {
        console.error('Create receipt error:', err);
        res.status(500).json({ error: 'Ошибка создания чека' });
    }
});

module.exports = router;

const express = require('express');
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');
const { chatWithBusinessAdvisor } = require('../services/gemini');

const router = express.Router({ mergeParams: true });

// GET chat history for a business
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const { businessId } = req.params;

        const { data: biz } = await supabase
            .from('businesses')
            .select('id')
            .eq('id', businessId)
            .eq('user_id', req.user.id)
            .single();

        if (!biz) return res.status(404).json({ error: 'Бизнес не найден' });

        const { data, error } = await supabase
            .from('business_ai_chats')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка загрузки истории чата' });
    }
});

// POST send message to AI
router.post('/chat', authMiddleware, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { message } = req.body;

        if (!message) return res.status(400).json({ error: 'Сообщение пустое' });

        // Verify ownership + get business data
        const { data: biz } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .eq('user_id', req.user.id)
            .single();

        if (!biz) return res.status(404).json({ error: 'Бизнес не найден' });

        // Get transactions for context
        const { data: transactions } = await supabase
            .from('business_transactions')
            .select('*')
            .eq('business_id', businessId)
            .order('date', { ascending: false })
            .limit(30);

        // Get chat history for context
        const { data: history } = await supabase
            .from('business_ai_chats')
            .select('role, message')
            .eq('business_id', businessId)
            .order('created_at', { ascending: true })
            .limit(20);

        // Save user message
        await supabase.from('business_ai_chats').insert({
            business_id: businessId,
            role: 'user',
            message,
        });

        // Call Gemini
        const aiResponse = await chatWithBusinessAdvisor({
            businessName: biz.name,
            businessType: biz.type,
            businessDescription: biz.description,
            transactions: transactions || [],
            chatHistory: history || [],
            userMessage: message,
        });

        // Save AI response
        await supabase.from('business_ai_chats').insert({
            business_id: businessId,
            role: 'assistant',
            message: aiResponse,
        });

        res.json({ response: aiResponse });
    } catch (err) {
        console.error('Business AI chat error:', err);
        res.status(500).json({ error: 'Ошибка ИИ советника: ' + err.message });
    }
});

// DELETE chat history
router.delete('/history', authMiddleware, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { data: biz } = await supabase
            .from('businesses')
            .select('id')
            .eq('id', businessId)
            .eq('user_id', req.user.id)
            .single();

        if (!biz) return res.status(404).json({ error: 'Бизнес не найден' });

        await supabase.from('business_ai_chats').delete().eq('business_id', businessId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка очистки истории' });
    }
});

module.exports = router;

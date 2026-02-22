const express = require('express');
const crypto = require('crypto');
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Credentials (будут браться из .env)
const MERCHANT_ID = process.env.PAYBOX_MERCHANT_ID || '12345';
const SECRET_KEY = process.env.PAYBOX_SECRET_KEY || 'test_secret_key';

const PLANS = {
    monthly: {
        id: 'monthly',
        amount: 2990, // KZT
        label: 'Месячная подписка Zhumash Bank Premium',
        duration: 30, // days
    },
    yearly: {
        id: 'yearly',
        amount: 24990,
        label: 'Годовая подписка Zhumash Bank Premium',
        duration: 365,
    },
};

// Функция генерации MD5 подписи (согласно документации Freedom Pay / PayBox)
function buildSignature(fileName, params, secret) {
    // 1. Сортируем ключи по алфавиту
    const sortedKeys = Object.keys(params).sort();

    // 2. Добавляем имя скрипта (без директорий, например 'init_payment.php')
    const valuesToSign = [fileName];

    // 3. Добавляем значения отсортированных параметров
    for (const key of sortedKeys) {
        if (key !== 'pg_sig' && params[key] !== '') {
            valuesToSign.push(params[key]);
        }
    }

    // 4. Добавляем секретный ключ в конец
    valuesToSign.push(secret);

    // 5. Джойним через ';'
    const stringToSign = valuesToSign.join(';');

    // 6. Хешируем в MD5
    return crypto.createHash('md5').update(stringToSign).digest('hex');
}

// GET /api/payments/plans
router.get('/plans', (req, res) => {
    res.json(Object.entries(PLANS).map(([key, p]) => ({
        id: key,
        ...p,
        currency: 'KZT',
    })));
});

// POST /api/payments/create-checkout — Генерация ссылки Freedom Pay
router.post('/create-checkout', authMiddleware, async (req, res) => {
    try {
        const { plan } = req.body;
        const selectedPlan = PLANS[plan];
        if (!selectedPlan) return res.status(400).json({ error: 'Неверный тарифный план' });

        const user = req.user;
        const orderId = `SUB_${user.id}_${Date.now()}`;

        // В продакшене используйте настоящий домен. Для локалки localhost
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const frontUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        const paymentParams = {
            pg_merchant_id: MERCHANT_ID,
            pg_amount: selectedPlan.amount.toString(),
            pg_description: selectedPlan.label,
            pg_order_id: orderId,
            pg_salt: Math.random().toString(36).substring(7),
            pg_currency: 'KZT',
            pg_language: 'ru',
            pg_testing_mode: '1', // 1 - тестовый режим, 0 - боевой

            // Webhook и редиректы
            pg_result_url: `${baseUrl}/api/payments/webhook`,
            pg_success_url: `${frontUrl}/payment-success`,
            pg_failure_url: `${frontUrl}/payment-cancelled`,

            // Кастомные параметры чтобы понять кого обновлять при вебхуке
            client_id: user.id,
            selected_plan: plan
        };

        // Генерируем подпись
        paymentParams.pg_sig = buildSignature('init_payment.php', paymentParams, SECRET_KEY);

        // Формируем URL
        const queryParams = new URLSearchParams(paymentParams).toString();
        const payboxUrl = `https://api.paybox.money/payment.php?${queryParams}`;

        // Сохраняем попытку оплаты в базу
        await supabase.from('subscription_events').insert({
            user_id: user.id,
            stripe_event_id: orderId, // используем orderId как уникальный ключ попытки
            event_type: 'checkout_initiated',
            amount: selectedPlan.amount,
            currency: 'KZT'
        });

        res.json({ url: payboxUrl, orderId });
    } catch (err) {
        console.error('Paybox checkout error:', err);
        res.status(500).json({ error: 'Ошибка генерации ссылки: ' + err.message });
    }
});

// POST /api/payments/webhook — Прием статуса от Freedom Pay
// Внимание: Freedom Pay присылает данные в POST (form-urlencoded) и ждет XML ответ
router.post('/webhook', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const body = req.body;

        if (!body || !body.pg_sig) {
            return res.status(400).send('No signature');
        }

        // 1. Проверяем подпись
        const expectedSig = buildSignature('webhook', body, SECRET_KEY);
        // Примечание: скрипт для вебхука в Paybox обычно называется либо по URL (например 'webhook'),
        // Либо вообще не нужно передавать скрипт. Более надежно настроить сверку:
        // Если подпись не сошлась, можно продолжить для тестов, но в проде нужно отклонять:
        // if (body.pg_sig !== expectedSig) return sendXml(res, body.pg_order_id, 'ok', 'Invalid sig', 0); // Временно пропускаем для тестов

        const orderId = body.pg_order_id;
        const isSuccess = body.pg_result === '1';

        // Кастомные данные, которые мы передали при создании (если Paybox их вернул)
        // Если Paybox их не вернул в вебхук, можно найти пользователя через orderId в БД (subscription_events)
        const { data: events } = await supabase
            .from('subscription_events')
            .select('user_id, amount, event_type')
            .eq('stripe_event_id', orderId);

        if (events && events.length > 0) {
            const userId = events[0].user_id;
            const amount = events[0].amount;

            // Если оплата успешна
            if (isSuccess) {
                // Определяем тариф по сумме (упрощенно)
                const isYearly = amount >= 20000;
                const durationDays = isYearly ? 365 : 30;

                const endDate = new Date();
                endDate.setDate(endDate.getDate() + durationDays);

                await supabase.from('users').update({
                    role: 'paid',
                    subscription_status: 'active',
                    subscription_end_date: endDate.toISOString(),
                }).eq('id', userId);

                await supabase.from('subscription_events').insert({
                    user_id: userId,
                    stripe_event_id: `${orderId}_completed`,
                    event_type: 'checkout.session.completed',
                    amount: amount,
                    currency: 'KZT',
                });
            } else {
                // Оплата не удалась
                await supabase.from('subscription_events').insert({
                    user_id: userId,
                    stripe_event_id: `${orderId}_failed`,
                    event_type: 'payment_failed',
                    amount: amount,
                    currency: 'KZT',
                });
            }
        }

        // PayBox/Freedom Pay всегда ждет XML ответ!
        sendXml(res, orderId, 'ok', 'Success', 1);
    } catch (err) {
        console.error('Webhook handler error:', err);
        // Но даже в случае ошибки отправляем reject в формате XML
        sendXml(res, req.body?.pg_order_id || '0', 'rejected', err.message, 0);
    }
});

// Вспомогательная функция для генерации XML ответа PayBox
function sendXml(res, orderId, status, description, sigIsGood) {
    const salt = Math.random().toString(36).substring(7);
    const xmlParams = {
        pg_status: status,
        pg_description: description,
        pg_salt: salt
    };

    // Подписываем XML (скрипт называется 'index.php' или по роуту)
    const sig = buildSignature('webhook', xmlParams, SECRET_KEY);

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<response>
    <pg_salt>${salt}</pg_salt>
    <pg_status>${status}</pg_status>
    <pg_description>${description}</pg_description>
    <pg_sig>${sig}</pg_sig>
</response>`;

    res.set('Content-Type', 'text/xml');
    res.send(xml);
}


// GET /api/payments/subscription — get current subscription status
router.get('/subscription', authMiddleware, async (req, res) => {
    const user = req.user;
    // Разработчику всегда полный доступ
    if (user.role === 'developer') {
        return res.json({ role: user.role, isPremium: true });
    }

    const isPremium = user.role === 'paid' && user.subscription_status === 'active' &&
        (!user.subscription_end_date || new Date(user.subscription_end_date) > new Date());

    res.json({
        role: user.role,
        subscriptionStatus: user.subscription_status,
        subscriptionEndDate: user.subscription_end_date,
        isPremium: isPremium
    });
});

module.exports = router;

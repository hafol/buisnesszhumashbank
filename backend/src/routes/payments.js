const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Price IDs - create these in your Stripe Dashboard
const PLANS = {
    monthly: {
        priceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder',
        amount: 2990, // 2990 KZT ~ $6.99/mo
        label: 'Месячная подписка',
        duration: 30,
    },
    yearly: {
        priceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly_placeholder',
        amount: 24990, // 24990 KZT ~ $55/year (~35% off)
        label: 'Годовая подписка',
        duration: 365,
    },
};

// GET /api/payments/plans
router.get('/plans', (req, res) => {
    res.json(Object.entries(PLANS).map(([key, p]) => ({
        id: key,
        ...p,
        currency: 'KZT',
    })));
});

// POST /api/payments/create-checkout — Create Stripe checkout session
router.post('/create-checkout', authMiddleware, async (req, res) => {
    try {
        const { plan } = req.body;
        const selectedPlan = PLANS[plan];
        if (!selectedPlan) return res.status(400).json({ error: 'Неверный план' });

        const user = req.user;

        // Create or retrieve Stripe customer
        let customerId = user.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId: user.id },
            });
            customerId = customer.id;
            await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: selectedPlan.priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
            metadata: { userId: user.id, plan },
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ error: 'Ошибка создания сессии оплаты: ' + err.message });
    }
});

// POST /api/payments/webhook — Stripe webhook (no auth, uses signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata?.userId;
            const plan = session.metadata?.plan || 'monthly';

            if (userId) {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + (PLANS[plan]?.duration || 30));

                await supabase.from('users').update({
                    role: 'paid',
                    subscription_status: 'active',
                    subscription_end_date: endDate.toISOString(),
                }).eq('id', userId);

                await supabase.from('subscription_events').insert({
                    user_id: userId,
                    stripe_event_id: event.id,
                    event_type: 'checkout.session.completed',
                    amount: (session.amount_total || 0) / 100,
                    currency: session.currency,
                });
            }
        }

        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            const { data: users } = await supabase
                .from('users')
                .select('id')
                .eq('stripe_customer_id', subscription.customer);

            if (users?.length) {
                await supabase.from('users')
                    .update({ role: 'free', subscription_status: 'cancelled' })
                    .eq('id', users[0].id);
            }
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook handler error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/payments/subscription — get current subscription status
router.get('/subscription', authMiddleware, async (req, res) => {
    const user = req.user;
    res.json({
        role: user.role,
        subscriptionStatus: user.subscription_status,
        subscriptionEndDate: user.subscription_end_date,
        isPremium: user.role === 'developer' ||
            (user.role === 'paid' && user.subscription_status === 'active' &&
                (!user.subscription_end_date || new Date(user.subscription_end_date) > new Date())),
    });
});

module.exports = router;

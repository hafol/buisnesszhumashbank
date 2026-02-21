const express = require('express');
const fetch = require('node-fetch');
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Simple in-memory cache
let ratesCache = null;
let cacheTime = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// GET /api/exchange/rates — live exchange rates (KZT base)
router.get('/rates', authMiddleware, async (req, res) => {
    try {
        // Return cache if fresh
        if (ratesCache && cacheTime && (Date.now() - cacheTime) < CACHE_TTL) {
            return res.json(ratesCache);
        }

        let rates = { usdKzt: 450.0, eurKzt: 488.0, rubKzt: 4.95, lastUpdated: new Date().toISOString() };

        try {
            const response = await fetch('https://open.er-api.com/v6/latest/KZT', { timeout: 5000 });
            if (response.ok) {
                const data = await response.json();
                if (data.result === 'success') {
                    // Convert from KZT-based to "1 USD in KZT"
                    rates = {
                        usdKzt: parseFloat((1 / data.rates.USD).toFixed(2)),
                        eurKzt: parseFloat((1 / data.rates.EUR).toFixed(2)),
                        rubKzt: parseFloat((1 / data.rates.RUB).toFixed(2)),
                        lastUpdated: new Date().toISOString()
                    };
                }
            }
        } catch (fetchErr) {
            console.warn('Exchange rate fetch failed, using defaults:', fetchErr.message);
        }

        ratesCache = rates;
        cacheTime = Date.now();
        res.json(rates);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения курсов валют' });
    }
});

// GET /api/exchange/offices — mock local exchange offices (no free API available)
router.get('/offices', authMiddleware, async (req, res) => {
    const { city = 'Алматы' } = req.query;

    // Realistic mock data for Kazakhstan exchange offices
    const offices = [
        {
            id: '1',
            name: `Обменный пункт "Центральный"`,
            address: `ул. Панфилова 115, ${city}`,
            distance: '0.3 км',
            rates: { usdBuy: (ratesCache?.usdKzt || 450) - 1.5, usdSell: (ratesCache?.usdKzt || 450) + 1.5, eurBuy: (ratesCache?.eurKzt || 488) - 2, eurSell: (ratesCache?.eurKzt || 488) + 2, rubBuy: (ratesCache?.rubKzt || 4.95) - 0.1, rubSell: (ratesCache?.rubKzt || 4.95) + 0.1 },
            updatedAt: '5 мин назад'
        },
        {
            id: '2',
            name: 'Kaspi Обмен',
            address: `пр. Абая 52, ${city}`,
            distance: '0.7 км',
            rates: { usdBuy: (ratesCache?.usdKzt || 450) - 1.0, usdSell: (ratesCache?.usdKzt || 450) + 1.0, eurBuy: (ratesCache?.eurKzt || 488) - 1.5, eurSell: (ratesCache?.eurKzt || 488) + 1.5, rubBuy: (ratesCache?.rubKzt || 4.95) - 0.08, rubSell: (ratesCache?.rubKzt || 4.95) + 0.08 },
            updatedAt: '2 мин назад'
        },
        {
            id: '3',
            name: 'Freedom Exchange',
            address: `ул. Достык 5, ${city}`,
            distance: '1.2 км',
            rates: { usdBuy: (ratesCache?.usdKzt || 450) - 2.0, usdSell: (ratesCache?.usdKzt || 450) + 2.0, eurBuy: (ratesCache?.eurKzt || 488) - 2.5, eurSell: (ratesCache?.eurKzt || 488) + 2.5, rubBuy: (ratesCache?.rubKzt || 4.95) - 0.12, rubSell: (ratesCache?.rubKzt || 4.95) + 0.12 },
            updatedAt: '10 мин назад'
        },
        {
            id: '4',
            name: `Обменник "Арбат"`,
            address: `ул. Байзакова 280, ${city}`,
            distance: '1.5 км',
            rates: { usdBuy: (ratesCache?.usdKzt || 450) - 1.8, usdSell: (ratesCache?.usdKzt || 450) + 1.8, eurBuy: (ratesCache?.eurKzt || 488) - 2.2, eurSell: (ratesCache?.eurKzt || 488) + 2.2, rubBuy: (ratesCache?.rubKzt || 4.95) - 0.09, rubSell: (ratesCache?.rubKzt || 4.95) + 0.09 },
            updatedAt: '15 мин назад'
        },
    ];

    // Round all values to 2 decimal places
    const rounded = offices.map(o => ({
        ...o,
        rates: Object.fromEntries(Object.entries(o.rates).map(([k, v]) => [k, parseFloat(v.toFixed(2))])),
    }));

    res.json({ offices: rounded, city, total: rounded.length });
});

module.exports = router;

const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

const CACHE_TIME = 10 * 60 * 1000; // 10 minutes
let ratesCache = { data: null, timestamp: 0 };

const REAL_OFFICES = {
    Almaty: [
        { name: 'МиГ 1', address: 'ул. Желтоксан, 88 (уг. ул. Гоголя)' },
        { name: 'МиГ 2', address: 'пр. Достык, 40 (уг. ул. Шевченко)' },
        { name: 'МиГ 3', address: 'пр. Райымбека, 100 (уг. ул. Сейфуллина)' },
        { name: 'МиГ 4', address: 'пр. Абая, 40 (уг. ул. Байтурсынова)' },
        { name: 'МиГ 7', address: 'ул. Саина, 16 (ТЦ Magnum)' },
        { name: 'МиГ 10', address: 'мкр. Самал-2, ул. Мендикулова, 98' },
        { name: 'МиГ 14', address: 'ул. Толе би, 24А (уг. пр. Достык)' },
        { name: 'МиГ 34', address: 'пр. Аль-Фараби, 17 (ТРЦ MEGA)' },
        { name: 'Лимпопо', address: 'пр. Райымбека, 134' },
        { name: 'Limpopo-NEO', address: 'ул. Мынбаева, 46' },
        { name: 'Halyk Bank', address: 'пр. Аль-Фараби, 101' },
        { name: 'Kaspi Bank', address: 'ул. Наурызбай Батыра, 154' },
        { name: 'Lider Exchange', address: 'ул. Гоголя, 111' },
        { name: 'Zolotoe Koltso', address: 'пр. Абылай Хана, 62' },
        { name: 'Almaty Finance', address: 'ул. Розыбакиева, 247' }
    ],
    Astana: [
        { name: 'YES exchange', address: 'пр. Кабанбай батыра, 119' },
        { name: 'Sapa Exchange №1', address: 'ул. Достык, 12' },
        { name: 'RaM-MaR', address: 'пр. Мангилик Ел, 19/2' },
        { name: 'Номинал Про', address: 'ул. Сыганак, 39/1' },
        { name: 'Ecash', address: 'пр. Туран, 37 (ТРЦ Хан Шатыр)' },
        { name: 'ТАСКО', address: 'ул. Бейбитшилик, 45' },
        { name: 'Exchange Market', address: 'ул. Сауран, 8' },
        { name: 'Байлык Finance', address: 'ул. Достык, 13' },
        { name: 'Diplomat Exchange', address: 'ул. Кунаева, 29/1' },
        { name: 'СКВ-Астана', address: 'пр. Республики, 21' },
        { name: 'Astana-Kurs', address: 'ул. Кенесары, 40' },
        { name: 'Alem Finance', address: 'ул. Сауран, 2' },
        { name: 'Saryarka Finance', address: 'пр. Момышулы, 15' },
        { name: 'Otrar Finance', address: 'мкр. Самал, 11' },
        { name: 'Bailik-Altyn', address: 'пр. Богенбай Батыра, 54' }
    ]
};

// GET exchange rates
router.get('/rates', authMiddleware, async (req, res) => {
    try {
        if (ratesCache.data && (Date.now() - ratesCache.timestamp < CACHE_TIME)) {
            return res.json(ratesCache.data);
        }

        const response = await fetch('https://api.exchangerate-api.com/v4/latest/KZT');
        const data = await response.json();

        ratesCache = {
            data: {
                usd: { buy: parseFloat((1 / data.rates.USD).toFixed(2)) - 2, sell: parseFloat((1 / data.rates.USD).toFixed(2)) + 1 },
                eur: { buy: parseFloat((1 / data.rates.EUR).toFixed(2)) - 3, sell: parseFloat((1 / data.rates.EUR).toFixed(2)) + 2 },
                rub: { buy: parseFloat((1 / data.rates.RUB).toFixed(2)) - 0.05, sell: parseFloat((1 / data.rates.RUB).toFixed(2)) + 0.1 },
                updatedAt: new Date().toISOString()
            },
            timestamp: Date.now()
        };

        res.json(ratesCache.data);
    } catch (err) {
        console.error('Rates fetch error:', err);
        res.status(500).json({ error: 'Ошибка получения курсов' });
    }
});

// GET exchange offices
router.get('/offices', authMiddleware, async (req, res) => {
    try {
        const cityQuery = req.query.city || 'Almaty';
        // Normalize city name
        const city = (cityQuery.toLowerCase().includes('astana') || cityQuery.toLowerCase().includes('астана')) ? 'Astana' : 'Almaty';
        const baseOffices = REAL_OFFICES[city] || REAL_OFFICES.Almaty;

        const rateRes = await fetch('https://api.exchangerate-api.com/v4/latest/KZT');
        const rateData = await rateRes.json();

        const baseUsd = 1 / rateData.rates.USD;
        const baseEur = 1 / rateData.rates.EUR;
        const baseRub = 1 / rateData.rates.RUB;

        const results = baseOffices.map((office, index) => {
            const spread = (Math.random() - 0.5) * 1.5;
            const eurSpread = (Math.random() - 0.5) * 2;
            const rubSpread = (Math.random() - 0.5) * 0.04;

            return {
                id: `${city.toLowerCase()}-${index}`,
                name: office.name,
                address: office.address,
                distance: `${(Math.random() * 5 + 0.5).toFixed(1)} км`,
                numericDistance: Math.random() * 5 + 0.5,
                status: Math.random() > 0.1 ? 'open' : 'closed',
                workingHours: '09:00 - 20:00',
                rates: {
                    usdBuy: parseFloat((baseUsd - 1.5 + spread).toFixed(2)),
                    usdSell: parseFloat((baseUsd + 1 + spread).toFixed(2)),
                    eurBuy: parseFloat((baseEur - 2 + eurSpread).toFixed(2)),
                    eurSell: parseFloat((baseEur + 2 + eurSpread).toFixed(2)),
                    rubBuy: parseFloat((baseRub - 0.05 + rubSpread).toFixed(2)),
                    rubSell: parseFloat((baseRub + 0.1 + rubSpread).toFixed(2))
                }
            };
        });

        res.json({ offices: results, city, total: results.length });
    } catch (err) {
        console.error('Offices fetch error:', err);
        res.status(500).json({ error: 'Ошибка получения списка обменников' });
    }
});

module.exports = router;

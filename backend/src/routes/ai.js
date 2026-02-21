const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const supabase = require('../services/supabase');
const { authMiddleware, requirePremium } = require('../middleware/auth');
const { calculateTaxes, analyzeContract, parseTransactions } = require('../services/gemini');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../../uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/ai/calculate-taxes — Premium feature
router.post('/calculate-taxes', authMiddleware, requirePremium, async (req, res) => {
    try {
        const { userType, businessType, taxRegime, income, period, employeeCount } = req.body;

        if (!income || income < 0) {
            return res.status(400).json({ error: 'Укажите сумму дохода' });
        }

        const currentDate = new Date().toISOString().split('T')[0];
        const result = await calculateTaxes({
            userType: userType || 'business',
            businessType,
            taxRegime,
            income,
            period,
            employeeCount,
            currentDate
        });
        res.json(result);
    } catch (err) {
        console.error('Tax calc error:', err);
        res.status(500).json({ error: 'Ошибка расчёта налогов: ' + err.message });
    }
});

// POST /api/ai/tax-chat — Interactive expert chat
router.post('/tax-chat', authMiddleware, async (req, res) => {
    try {
        const { message, context } = req.body;
        if (!message) return res.status(400).json({ error: 'Сообщение пустое' });

        const { chatWithTaxExpert } = require('../services/gemini');
        const response = await chatWithTaxExpert(message, context || {});
        res.json({ response });
    } catch (err) {
        console.error('Tax chat error:', err);
        res.status(500).json({ error: 'Ошибка чата: ' + err.message });
    }
});

// POST /api/ai/analyze-contract — Premium feature
router.post('/analyze-contract', authMiddleware, requirePremium, async (req, res) => {
    try {
        const { documentText, documentId } = req.body;

        let text = documentText;

        // If documentId provided, read from file
        if (!text && documentId) {
            const { data: doc } = await supabase
                .from('documents')
                .select('file_path, name')
                .eq('id', documentId)
                .eq('user_id', req.user.id)
                .single();

            if (doc?.file_path) {
                const filePath = path.join(__dirname, '../../../uploads', doc.file_path);
                if (fs.existsSync(filePath)) {
                    const ext = path.extname(doc.file_path).toLowerCase();
                    if (ext === '.pdf') {
                        const buffer = fs.readFileSync(filePath);
                        const parsed = await pdfParse(buffer);
                        text = parsed.text;
                    } else if (ext === '.docx' || ext === '.doc') {
                        const buffer = fs.readFileSync(filePath);
                        const result = await mammoth.extractRawText({ buffer });
                        text = result.value;
                    } else {
                        text = fs.readFileSync(filePath, 'utf8');
                    }
                }
            }
        }

        if (!text) {
            return res.status(400).json({ error: 'Текст договора не предоставлен' });
        }

        const analysis = await analyzeContract(text);
        res.json(analysis);
    } catch (err) {
        console.error('Contract analyze error:', err);
        res.status(500).json({ error: 'Ошибка анализа договора' });
    }
});

// POST /api/ai/parse-payroll — Premium feature
router.post('/parse-payroll', authMiddleware, requirePremium, upload.single('statement'), async (req, res) => {
    try {
        let statementText = req.body.text || '';

        if (req.file) {
            console.log('File received:', req.file.originalname, 'Size:', req.file.size);
            const ext = path.extname(req.file.originalname).toLowerCase();
            if (ext === '.pdf') {
                console.log('Parsing PDF...');
                const buffer = fs.readFileSync(req.file.path);
                const parsed = await pdfParse(buffer);
                statementText = parsed.text;
                console.log('PDF text extracted, length:', statementText.length);
            } else if (ext === '.docx' || ext === '.doc') {
                console.log('Parsing Word Doc...');
                const buffer = fs.readFileSync(req.file.path);
                const result = await mammoth.extractRawText({ buffer });
                statementText = result.value;
                console.log('Word text extracted, length:', statementText.length);
            } else {
                statementText = fs.readFileSync(req.file.path, 'utf8');
                console.log('Text file read, length:', statementText.length);
            }
            fs.unlinkSync(req.file.path); // cleanup temp file
        }

        if (!statementText || statementText.trim().length < 5) {
            console.log('Error: Statement text empty or too short');
            return res.status(400).json({ error: 'Предоставьте файл выписки или текст' });
        }

        console.log('Calling Gemini for transaction parsing...');
        const transactions = await parseTransactions(statementText);
        console.log('Gemini returned', transactions.length, 'transactions');

        // Save to DB if user provided
        if (transactions.length > 0) {
            console.log('Saving transactions to Supabase...');
            const rows = transactions.map(tx => ({
                user_id: req.user.id,
                employee_name: tx.counterparty || '',
                amount: tx.amount,
                type: tx.type,
                description: tx.description,
                transaction_date: tx.date,
            }));
            const { error: dbError } = await supabase.from('payroll_transactions').insert(rows);
            if (dbError) {
                console.error('Supabase save error:', dbError);
            } else {
                console.log('Successfully saved transactions');
            }
        }

        res.json({
            transactions,
            total: transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
        });
    } catch (err) {
        console.error('Payroll parse error details:', err);
        res.status(500).json({ error: 'Ошибка парсинга выписки: ' + err.message });
    }
});

// GET /api/ai/payroll-history — get saved payroll transactions
router.get('/payroll-history', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('payroll_transactions')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка загрузки транзакций' });
    }
});

module.exports = router;

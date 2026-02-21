const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');
const { analyzeDocument } = require('../services/gemini');

const router = express.Router();

// Configure multer for local file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../../uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.csv', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Неподдерживаемый формат файла'));
    }
});

// GET all documents
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', req.user.id)
            .order('uploaded_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка загрузки документов' });
    }
});

// POST upload document
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });

        const { type, projectId } = req.body;
        const fileSizeKb = Math.round(req.file.size / 1024);

        const { data, error } = await supabase
            .from('documents')
            .insert({
                user_id: req.user.id,
                project_id: projectId || null,
                name: req.file.originalname,
                type: type || 'other',
                file_path: req.file.filename,
                file_size: `${fileSizeKb} KB`,
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Ошибка загрузки файла' });
    }
});

// POST analyze document with AI
router.post('/:id/analyze', authMiddleware, async (req, res) => {
    try {
        const { data: doc, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (error || !doc) return res.status(404).json({ error: 'Документ не найден' });

        // Extract text from file
        let text = '';
        const filePath = path.join(__dirname, '../../../uploads', doc.file_path);

        if (fs.existsSync(filePath)) {
            const ext = path.extname(doc.file_path).toLowerCase();
            if (ext === '.pdf') {
                const buffer = fs.readFileSync(filePath);
                const parsed = await pdfParse(buffer);
                text = parsed.text;
            } else {
                text = fs.readFileSync(filePath, 'utf8');
            }
        }

        if (!text || text.trim().length < 10) {
            text = `Document name: ${doc.name}. Type: ${doc.type}. Please provide a general analysis.`;
        }

        const analysis = await analyzeDocument(text);

        // Save analysis back to document
        await supabase
            .from('documents')
            .update({ ai_analysis: analysis })
            .eq('id', doc.id);

        res.json(analysis);
    } catch (err) {
        console.error('Analyze error:', err);
        res.status(500).json({ error: 'Ошибка анализа документа' });
    }
});

// DELETE document
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { data: doc } = await supabase
            .from('documents')
            .select('file_path')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (doc?.file_path) {
            const filePath = path.join(__dirname, '../../../uploads', doc.file_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления документа' });
    }
});

module.exports = router;

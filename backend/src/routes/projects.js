const express = require('express');
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET all projects for current user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data: projects, error } = await supabase
            .from('projects')
            .select(`*, milestones(*)`)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(projects || []);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка загрузки проектов' });
    }
});

// POST create project with milestones
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            name, description, totalCost,
            contractorName, contractorIin, contractorPhone, contractorEmail, contractorAddress,
            milestones = []
        } = req.body;

        // Create project
        const { data: project, error: projError } = await supabase
            .from('projects')
            .insert({
                user_id: req.user.id,
                name,
                description,
                total_cost: totalCost,
                contractor_name: contractorName,
                contractor_iin: contractorIin,
                contractor_phone: contractorPhone,
                contractor_email: contractorEmail,
                contractor_address: contractorAddress,
            })
            .select()
            .single();

        if (projError) throw projError;

        // Create milestones
        if (milestones.length > 0) {
            const milestoneRows = milestones.map(m => ({
                project_id: project.id,
                description: m.description,
                amount: m.amount,
                due_date: m.dueDate,
                status: 'pending',
            }));
            const { error: msError } = await supabase.from('milestones').insert(milestoneRows);
            if (msError) throw msError;
        }

        // Return project with milestones
        const { data: fullProject } = await supabase
            .from('projects')
            .select(`*, milestones(*)`)
            .eq('id', project.id)
            .single();

        res.status(201).json(fullProject);
    } catch (err) {
        console.error('Create project error:', err);
        res.status(500).json({ error: 'Ошибка создания проекта' });
    }
});

// PUT update project
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, description, totalCost, status } = req.body;
        const { data, error } = await supabase
            .from('projects')
            .update({ name, description, total_cost: totalCost, status, updated_at: new Date() })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id) // security: own projects only
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка обновления проекта' });
    }
});

// DELETE project
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления проекта' });
    }
});

// PATCH update milestone status
router.patch('/milestones/:id', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const { data, error } = await supabase
            .from('milestones')
            .update({ status })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка обновления этапа' });
    }
});

// POST add milestone to existing project
router.post('/:projectId/milestones', authMiddleware, async (req, res) => {
    try {
        const { description, amount, dueDate } = req.body;
        // Verify ownership
        const { data: project, error: pErr } = await supabase
            .from('projects')
            .select('id')
            .eq('id', req.params.projectId)
            .eq('user_id', req.user.id)
            .single();
        if (pErr || !project) return res.status(403).json({ error: 'Нет доступа' });

        const { data, error } = await supabase
            .from('milestones')
            .insert({ project_id: req.params.projectId, description, amount, due_date: dueDate, status: 'pending' })
            .select()
            .single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка добавления этапа' });
    }
});

// DELETE milestone
router.delete('/milestones/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('milestones')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка удаления этапа' });
    }
});

module.exports = router;


import express from 'express';
import { query } from '../lib/db.js';
import { Logger } from '../lib/logger.js';

const router = express.Router();

// GET /templates - List all templates with optional filters
router.get('/templates', async (req, res) => {
    try {
        const { type, language, active } = req.query;
        
        let whereClause = [];
        let params = [];
        let paramIndex = 1;
        
        if (type) {
            whereClause.push(`type = $${paramIndex}`);
            params.push(type);
            paramIndex++;
        }
        
        if (language) {
            whereClause.push(`language = $${paramIndex}`);
            params.push(language);
            paramIndex++;
        }
        
        if (active !== undefined) {
            whereClause.push(`is_active = $${paramIndex}`);
            params.push(active === 'true');
            paramIndex++;
        }
        
        const where = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
        
        const result = await query(`
            SELECT 
                id, type, version, name, description, 
                language, is_active, is_default,
                variables,
                created_at, updated_at
            FROM document_templates
            ${where}
            ORDER BY type, version DESC, created_at DESC
        `, params);
        
        res.json(result.rows);
    } catch (err) {
        Logger.error('[Templates] Error fetching templates:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /templates/:id - Get single template by ID
router.get('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT * FROM document_templates WHERE id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        Logger.error('[Templates] Error fetching template:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /templates/type/:type/default - Get default template for a type
router.get('/templates/type/:type/default', async (req, res) => {
    try {
        const { type } = req.params;
        const { language } = req.query;
        
        const result = await query(`
            SELECT * FROM document_templates 
            WHERE type = $1 
              AND is_default = TRUE 
              AND is_active = TRUE
              AND language = COALESCE($2, 'ru')
            LIMIT 1
        `, [type, language || 'ru']);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No default template found for this type' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        Logger.error('[Templates] Error fetching default template:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /templates - Create new template
router.post('/templates', async (req, res) => {
    try {
        const { 
            type, version, name, description, content, 
            variables, language, is_default, created_by_id 
        } = req.body;
        
        // Validation
        if (!type || !content) {
            return res.status(400).json({ error: 'Type and content are required' });
        }
        
        // If is_default is true, unset other defaults for this type
        if (is_default) {
            await query(`
                UPDATE document_templates 
                SET is_default = FALSE 
                WHERE type = $1 AND language = COALESCE($2, 'ru')
            `, [type, language || 'ru']);
        }
        
        const result = await query(`
            INSERT INTO document_templates 
            (type, version, name, description, content, variables, language, is_default, created_by_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            type, 
            version || '1.0', 
            name, 
            description, 
            content, 
            JSON.stringify(variables || []), 
            language || 'ru',
            is_default || false,
            created_by_id || null
        ]);
        
        Logger.info(`[Templates] Created template: ${name} (type: ${type})`);
        res.status(201).json(result.rows[0]);
        
    } catch (err) {
        Logger.error('[Templates] Error creating template:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /templates/:id - Update existing template
router.put('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, description, content, variables, 
            language, is_active, is_default 
        } = req.body;
        
        // Check if template exists
        const checkResult = await query('SELECT type FROM document_templates WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        const templateType = checkResult.rows[0].type;
        
        // If is_default is true, unset other defaults for this type
        if (is_default) {
            await query(`
                UPDATE document_templates 
                SET is_default = FALSE 
                WHERE type = $1 AND language = COALESCE($2, 'ru') AND id != $3
            `, [templateType, language || 'ru', id]);
        }
        
        const result = await query(`
            UPDATE document_templates 
            SET 
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                content = COALESCE($3, content),
                variables = COALESCE($4, variables),
                language = COALESCE($5, language),
                is_active = COALESCE($6, is_active),
                is_default = COALESCE($7, is_default),
                updated_at = NOW()
            WHERE id = $8
            RETURNING *
        `, [name, description, content, 
            variables ? JSON.stringify(variables) : null, 
            language, is_active, is_default, id]);
        
        Logger.info(`[Templates] Updated template: ${id}`);
        res.json(result.rows[0]);
        
    } catch (err) {
        Logger.error('[Templates] Error updating template:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /templates/:id - Delete template (soft delete by setting is_active = false)
router.delete('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(`
            UPDATE document_templates 
            SET is_active = FALSE, updated_at = NOW()
            WHERE id = $1
            RETURNING id, type, name
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        Logger.info(`[Templates] Deleted template: ${result.rows[0].name} (${result.rows[0].type})`);
        res.json({ message: 'Template deleted successfully', template: result.rows[0] });
        
    } catch (err) {
        Logger.error('[Templates] Error deleting template:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /templates/:id/preview - Preview template with sample data
router.post('/templates/:id/preview', async (req, res) => {
    try {
        const { id } = req.params;
        const { data } = req.body; // Sample data to fill template
        
        const result = await query(`
            SELECT content, variables FROM document_templates WHERE id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        const template = result.rows[0];
        let content = template.content;
        
        // Fill template variables
        if (data && typeof data === 'object') {
            for (const [key, value] of Object.entries(data)) {
                const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                content = content.replace(placeholder, value || '__________');
            }
        }
        
        res.json({ 
            html: content,
            variables: template.variables,
            filled_count: data ? Object.keys(data).length : 0
        });
        
    } catch (err) {
        Logger.error('[Templates] Error previewing template:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /templates/types - List all available template types
router.get('/templates/types', async (req, res) => {
    try {
        const result = await query(`
            SELECT DISTINCT type, COUNT(*) as template_count
            FROM document_templates
            GROUP BY type
            ORDER BY type
        `);
        
        const typeLabels = {
            'contract': 'Трудовой договор',
            'order_hiring': 'Приказ о приеме',
            'vacation_application': 'Заявление на отпуск',
            'vacation_order': 'Приказ на отпуск',
            'termination_order': 'Приказ об увольнении',
            'employment_certificate': 'Справка с места работы'
        };
        
        const types = result.rows.map(row => ({
            ...row,
            label: typeLabels[row.type] || row.type
        }));
        
        res.json(types);
    } catch (err) {
        Logger.error('[Templates] Error fetching types:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

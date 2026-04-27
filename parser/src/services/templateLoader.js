import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.resolve(__dirname, '../../../document-templates');
const SCHEMAS_FILE = path.join(TEMPLATES_DIR, 'template-schemas.json');

let templateCache = null;
let schemaCache = null;

function loadTemplates() {
    if (templateCache) return templateCache;

    templateCache = {};

    if (!fs.existsSync(TEMPLATES_DIR)) {
        Logger.warn(`⚠️ Templates directory not found: ${TEMPLATES_DIR}`);
        return templateCache;
    }

    const files = fs.readdirSync(TEMPLATES_DIR)
        .filter(f => f.endsWith('.html'))
        .sort();

    for (const file of files) {
        const key = file.replace('.html', '');
        const fullPath = path.join(TEMPLATES_DIR, file);
        try {
            templateCache[key] = fs.readFileSync(fullPath, 'utf8');
            Logger.info(`📄 Loaded template: ${key}`);
        } catch (err) {
            Logger.error(`❌ Failed to load template ${file}:`, err.message);
        }
    }

    return templateCache;
}

function loadSchemas() {
    if (schemaCache) return schemaCache;

    schemaCache = {};

    if (!fs.existsSync(SCHEMAS_FILE)) {
        Logger.warn(`⚠️ Schemas file not found: ${SCHEMAS_FILE}`);
        return schemaCache;
    }

    try {
        const raw = fs.readFileSync(SCHEMAS_FILE, 'utf8');
        const data = JSON.parse(raw);
        schemaCache = data.schemas || {};
        Logger.info(`📋 Loaded ${Object.keys(schemaCache).length} template schemas`);
    } catch (err) {
        Logger.error(`❌ Failed to parse schemas:`, err.message);
    }

    return schemaCache;
}

export function getTemplate(type) {
    const templates = loadTemplates();
    return templates[type] || null;
}

export function getSchema(type) {
    const schemas = loadSchemas();
    return schemas[type] || null;
}

export function listTemplates() {
    const schemas = loadSchemas();
    return Object.entries(schemas).map(([key, schema]) => ({
        key,
        name: schema.templateName,
        type: schema.type,
        fileName: schema.fileName,
        required: schema.required,
        variables: Object.keys(schema.variables || {}),
    }));
}

export function getAllSchemas() {
    return loadSchemas();
}

// Auto-load on first import
loadTemplates();
loadSchemas();

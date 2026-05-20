import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find document-templates by walking up from this file (works locally and in Docker)
function findDir(startDir, targetName) {
    let dir = startDir;
    while (dir !== path.dirname(dir)) {
        const candidate = path.join(dir, targetName);
        if (fs.existsSync(candidate)) return candidate;
        dir = path.dirname(dir);
    }
    return null;
}

const TEMPLATES_DIR = findDir(__dirname, 'document-templates') || path.resolve(__dirname, '../../../document-templates');
const SCHEMAS_FILE = path.join(TEMPLATES_DIR, 'template-schemas.json');

Logger.info(`📂 Templates directory resolved to: ${TEMPLATES_DIR}`);

let templateCache = null;
let schemaCache = null;

function loadTemplates() {
    if (templateCache !== null) return templateCache;

    templateCache = {};

    if (!fs.existsSync(TEMPLATES_DIR)) {
        Logger.warn(`⚠️ Templates directory not found: ${TEMPLATES_DIR}`);
        Logger.warn(`   CWD: ${process.cwd()}`);
        Logger.warn(`   __dirname: ${__dirname}`);
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
    if (schemaCache !== null) return schemaCache;

    schemaCache = {};

    Logger.info(`🔍 Looking for schemas at: ${SCHEMAS_FILE}`);
    if (!fs.existsSync(SCHEMAS_FILE)) {
        Logger.warn(`⚠️ Schemas file not found: ${SCHEMAS_FILE}`);
        Logger.warn(`   CWD: ${process.cwd()}`);
        Logger.warn(`   __dirname: ${__dirname}`);
        Logger.warn(`   TEMPLATES_DIR: ${TEMPLATES_DIR}`);
        return schemaCache;
    }

    try {
        const raw = fs.readFileSync(SCHEMAS_FILE, 'utf8');
        const data = JSON.parse(raw);
        schemaCache = data.schemas || {};
        Logger.info(`📋 Loaded ${Object.keys(schemaCache).length} template schemas`);
        const schemaKeys = Object.keys(schemaCache);
        if (schemaKeys.length > 0) {
            Logger.info(`   First 5 schemas: ${schemaKeys.slice(0, 5).join(', ')}`);
        }
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

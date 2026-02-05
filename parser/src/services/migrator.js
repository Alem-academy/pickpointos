import fs from 'fs';
import path from 'path';
import { query } from '../lib/db.js';
import { fileURLToPath } from 'url';
import { Logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
    Logger.info('🔄 Starting database migrations...');

    try {
        // 1. Create migrations table if not exists
        await query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 2. Read migration files
        // Adjust path to point to the root 'database/migrations' folder
        // Assuming this file is in 'parser/src/services/'
        // We need to go up from: parser/src/services -> parser/src -> parser -> root -> database/migrations
        // Actually, let's just use a relative path that works common in docker structure
        // In Docker, usually COPY . . means root is root. 
        // Let's try to resolve relative to this file first.

        // We copied migrations to src/migrations for Docker compatibility
        const migrationsDir = path.resolve(__dirname, '../migrations');

        if (!fs.existsSync(migrationsDir)) {
            Logger.warn(`⚠️ Migrations directory not found at ${migrationsDir}`);
            return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // Ensure order by name (001, 002, etc.)

        for (const file of files) {
            // Check if already applied
            const check = await query('SELECT id FROM migrations WHERE name = $1', [file]);

            if (check.rows.length === 0) {
                Logger.info(`🚀 Applying migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

                await query('BEGIN');
                try {
                    await query(sql);
                    await query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                    await query('COMMIT');
                    Logger.info(`✅ Applied ${file}`);
                } catch (err) {
                    await query('ROLLBACK');
                    Logger.error(`❌ Failed to apply ${file}:`, err);
                    throw err; // Stop startup if migration fails
                }
            } else {
                Logger.debug(`⏭️  Skipping ${file} (already applied)`);
            }
        }

        Logger.info('✨ All migrations checked.');

    } catch (err) {
        Logger.error('Migration failed:', err);
        // We don't exit process here to allow the app to try starting, 
        // but typically you might want to crash if DB is out of sync.
        // For now, logged error is enough.
    }
}

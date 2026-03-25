/**
 * Script to run database migrations manually
 * Usage: node scripts/run-migrations.js
 */

import { query, connect } from '../lib/db.js';
import { Logger } from '../lib/logger.js';
import { runMigrations } from '../services/migrator.js';

async function main() {
    try {
        Logger.info('🚀 Running migrations manually...');
        await connect();
        await runMigrations();
        Logger.info('✅ Migrations completed successfully');
        process.exit(0);
    } catch (err) {
        Logger.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

main();

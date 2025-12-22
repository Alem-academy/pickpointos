import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from root .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Railway usually requires SSL for public connections
    }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    };

// If running in Cloud Run (socket connection)
if (process.env.INSTANCE_CONNECTION_NAME) {
    config.host = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
    delete config.port; // Port is not used with unix socket
}

export const createClient = () => {
    return new pg.Client(config);
};

export const createPool = () => {
    return new pg.Pool(config);
};

export const getDbConfig = () => {
    return { ...config, password: '***' }; // Hide password in logs
};

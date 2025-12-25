import pg from 'pg';

// Singleton Pool
const pool = new pg.Pool(getConfig());

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);

// For transactions where we need a single client instance
export const getClient = () => pool.connect();


function getConfig() {
    if (process.env.DATABASE_URL) {
        return {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        };
    }

    const config = {
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
        delete config.port;
    }

    return config;
}

import pg from 'pg';

export const createClient = () => {
    const config = getConfig();
    const safeConfig = { ...config, password: '***' };
    console.log('Creating DB client with config:', safeConfig);
    return new pg.Client(config);
};

export const createPool = () => {
    return new pg.Pool(getConfig());
};

function getConfig() {
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

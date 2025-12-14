import pg from 'pg';
import dotenv from 'dotenv';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
};

const client = new pg.Client(config);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function geocode(address) {
    return new Promise((resolve, reject) => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

        const options = {
            headers: {
                'User-Agent': 'PVZ-Manager/1.0 (internal tool)'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json && json.length > 0) {
                        resolve({
                            lat: json[0].lat,
                            lon: json[0].lon
                        });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    console.error('JSON Parse error:', e);
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function enrich() {
    try {
        await client.connect();
        console.log('🔌 Connected to database');

        const res = await client.query('SELECT id, address FROM pvz_points WHERE latitude IS NULL');
        console.log(`📍 Found ${res.rows.length} PVZs without coordinates.`);

        for (const row of res.rows) {
            console.log(`🔍 Geocoding: ${row.address}...`);

            try {
                const coords = await geocode(row.address);

                if (coords) {
                    await client.query('UPDATE pvz_points SET latitude = $1, longitude = $2 WHERE id = $3',
                        [coords.lat, coords.lon, row.id]);
                    console.log(`   ✅ Found: ${coords.lat}, ${coords.lon}`);
                } else {
                    console.log('   ❌ Not found');
                }

                // Respect rate limits (1 sec delay)
                await sleep(1100);

            } catch (err) {
                console.error(`   ❌ Error geocoding ${row.address}:`, err.message);
            }
        }

        console.log('✨ Enrichment complete!');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

enrich();

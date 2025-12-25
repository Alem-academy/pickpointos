import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
// Load .env from project root (parser/src/config -> parser/src -> parser -> root)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

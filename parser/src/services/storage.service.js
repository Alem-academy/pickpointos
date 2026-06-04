import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Logger } from '../lib/logger.js';

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

const s3Client = new S3Client({
    region: (process.env.AWS_REGION || 'auto').toLowerCase(),
    endpoint: process.env.AWS_ENDPOINT, // Required for R2/GCore: https://s-ed1.cloud.gcore.lu
    forcePathStyle: true, // Required for non-AWS S3
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

export const storageService = {
    /**
     * Upload a file buffer to S3
     * @param {Buffer} buffer 
     * @param {string} mimeType 
     * @param {string} key Path in bucket (e.g. 'documents/user1/doc.pdf')
     * @returns {Promise<string>} The key of the uploaded object
     */
    async uploadFile(buffer, mimeType, key) {
        Logger.info(`[S3] Starting upload to ${BUCKET_NAME}/${key} (${mimeType})`);
        if (!BUCKET_NAME) {
            Logger.error('[S3/R2] AWS_BUCKET_NAME is not defined in environment variables');
            throw new Error('AWS_BUCKET_NAME is not defined');
        }

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mimeType
        });

        try {
            await s3Client.send(command);
            Logger.info(`[S3] Successfully uploaded to ${key}`);
            return key;
        } catch (error) {
            Logger.error(`[S3] Upload failed for ${key}:`, error);
            throw error;
        }
    },

    /**
     * Get a temporary signed URL for viewing/downloading
     * @param {string} key 
     * @param {number} expiresInSeconds 
     * @returns {Promise<string>}
     */
    async getFileUrl(key, expiresInSeconds = 3600) {
        if (!BUCKET_NAME) {
            Logger.error('[S3/R2] AWS_BUCKET_NAME is not defined in environment variables');
            throw new Error('AWS_BUCKET_NAME is not defined');
        }

        // If it's a full URL (legacy or external), return as is
        if (key.startsWith('http')) return key;

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        try {
            const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
            Logger.debug(`[S3] Generated signed URL for ${key}`);
            return url;
        } catch (error) {
            Logger.error(`[S3] Failed to generate signed URL for ${key}:`, error);
            throw error;
        }
    },

    /**
     * Download a file from S3/R2 as a Buffer
     * @param {string} key
     * @returns {Promise<Buffer>}
     */
    async downloadFile(key) {
        if (!BUCKET_NAME) {
            Logger.error('[S3/R2] AWS_BUCKET_NAME is not defined');
            throw new Error('AWS_BUCKET_NAME is not defined');
        }

        if (key.startsWith('http')) {
            // Fetch from URL
            const response = await fetch(key);
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`);
            }
            return Buffer.from(await response.arrayBuffer());
        }

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        try {
            const response = await s3Client.send(command);
            const buffer = await streamToBuffer(response.Body);
            Logger.info(`[S3] Downloaded ${key} (${buffer.length} bytes)`);
            return buffer;
        } catch (error) {
            Logger.error(`[S3] Failed to download ${key}:`, error);
            throw error;
        }
    }
};

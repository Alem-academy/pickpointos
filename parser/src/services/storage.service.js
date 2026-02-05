import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'auto',
    endpoint: process.env.AWS_ENDPOINT, // Required for R2: https://<accountid>.r2.cloudflarestorage.com
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
        if (!BUCKET_NAME) throw new Error('AWS_BUCKET_NAME is not defined');

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mimeType
        });

        await s3Client.send(command);
        return key;
    },

    /**
     * Get a temporary signed URL for viewing/downloading
     * @param {string} key 
     * @param {number} expiresInSeconds 
     * @returns {Promise<string>}
     */
    async getFileUrl(key, expiresInSeconds = 3600) {
        if (!BUCKET_NAME) throw new Error('AWS_BUCKET_NAME is not defined');

        // If it's a full URL (legacy or external), return as is
        if (key.startsWith('http')) return key;

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    }
};

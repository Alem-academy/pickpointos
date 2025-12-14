import type {
    SigexAuthResponse,
    SigexRegisterDocumentRequest,
    SigexRegisterDocumentResponse,
    SigexFixHashResponse,
    SigexDocumentResponse
} from '../types/sigex';

const SIGEX_API_URL = 'https://sigex.kz';

export class SigexService {
    private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${SIGEX_API_URL}${endpoint}`;
        const response = await fetch(url, options);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Sigex API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return response.json();
    }

    /**
     * Step 1: Get a random nonce for authentication
     */
    static async getAuthNonce(): Promise<SigexAuthResponse> {
        return this.request<SigexAuthResponse>('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Step 2: Authenticate using the signed nonce
     * @param signature Base64 encoded signature of the nonce
     */
    static async authenticate(signature: string): Promise<{ session: string }> {
        // Note: The actual response structure for auth success might vary, 
        // usually it sets a cookie or returns a token. 
        // Based on doc: "POST /api/auth - аутентификация"
        // If it sets a cookie, we might need 'credentials: include' in fetch.
        // For now, assuming it returns JSON.
        return this.request('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signature })
        });
    }

    /**
     * Register a new document
     */
    static async registerDocument(data: SigexRegisterDocumentRequest): Promise<SigexRegisterDocumentResponse> {
        return this.request<SigexRegisterDocumentResponse>('/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    /**
     * Upload the document file to fix hashes
     */
    static async addDocumentData(documentId: string, file: File | Blob): Promise<SigexFixHashResponse> {
        return this.request<SigexFixHashResponse>(`/api/${documentId}/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                // Content-Length is automatically set by browser for File/Blob
            },
            body: file
        });
    }

    /**
     * Get document details
     */
    static async getDocument(documentId: string): Promise<SigexDocumentResponse> {
        return this.request<SigexDocumentResponse>(`/api/${documentId}`);
    }

    /**
     * Add a signature to an existing document
     */
    static async addSignature(documentId: string, signature: string, signType: 'cms' | 'xml' = 'cms'): Promise<{ signId: number }> {
        return this.request<{ signId: number }>(`/api/${documentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signature, signType })
        });
    }

    /**
     * Register a new eGov QR signing procedure
     */
    static async registerQrSigning(documentId: string, description: string = 'Подписание документа'): Promise<{
        operationId: string;
        qrCode: string;
        eGovMobileLaunchLink: string;
        eGovBusinessLaunchLink: string;
    }> {
        return this.request(`/api/${documentId}/egovQr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description })
        });
    }

    /**
     * Check status of eGov QR signing operation
     */
    static async checkQrStatus(documentId: string, operationId: string): Promise<{
        status: 'new' | 'meta' | 'data' | 'done' | 'canceled' | 'fail';
        signId?: number;
    }> {
        return this.request(`/api/${documentId}/egovOperation/${operationId}`);
    }
}

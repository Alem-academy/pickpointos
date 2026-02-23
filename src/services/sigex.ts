import type {
    SigexAuthResponse,
    SigexRegisterDocumentRequest,
    SigexRegisterDocumentResponse,
    SigexFixHashResponse,
    SigexDocumentResponse
} from '../types/sigex';

// Load gateway URL from environment variables, fallback for local dev.
// Example: VITE_SIGEX_GATEWAY_URL="https://sigex.yourdomain.kz:8080"
const SIGEX_GATEWAY_URL = import.meta.env.VITE_SIGEX_GATEWAY_URL || 'http://localhost:8080';

export class SigexService {
    private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        // Now pointing to our own gateway instead of directly to sigex.kz
        const url = `${SIGEX_GATEWAY_URL}${endpoint}`;
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
        return this.request<SigexAuthResponse>('/api/auth/nonce', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Step 2: Authenticate using the signed nonce
     * @param signature Base64 encoded signature of the nonce
     */
    static async authenticate(nonce: string, signature: string): Promise<any> {
        return this.request('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nonce, signature })
        });
    }

    /**
     * Authenticate using a registered document that contains the nonce
     */
    static async authenticateDocument(nonce: string, signature: string, documentId: string): Promise<any> {
        return this.request('/api/auth/login/document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nonce, signature, documentId })
        });
    }

    /**
     * Register a new document
     */
    static async registerDocument(data: SigexRegisterDocumentRequest): Promise<SigexRegisterDocumentResponse> {
        return this.request<SigexRegisterDocumentResponse>('/api/sign/document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    /**
     * Upload the document file to fix hashes (Legacy/Direct)
     */
    static async addDocumentData(documentId: string, file: File | Blob): Promise<SigexFixHashResponse> {
        // In the future add this to the gateway if needed, for now proxying logic is sufficient
        return this.request<SigexFixHashResponse>(`/api/sign/document/${documentId}/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
            },
            body: file
        });
    }

    /**
     * Generate a PDF on the gateway natively and register it in SIGEX automatically
     */
    static async generateAndRegisterPdf(data: { documentData: any, title?: string, description?: string, isContract?: boolean }): Promise<{ documentId: string, success: boolean }> {
        return this.request<{ documentId: string, success: boolean }>('/api/sign/document/generate-and-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    /**
     * Get document details
     */
    static async getDocument(documentId: string): Promise<SigexDocumentResponse> {
        return this.request<SigexDocumentResponse>(`/api/sign/document/${documentId}`);
    }

    /**
     * Add a signature to an existing document
     */
    static async addSignature(documentId: string, signature: string, signType: 'cms' | 'xml' = 'cms'): Promise<{ signId: number }> {
        return this.request<{ signId: number }>(`/api/sign/document/${documentId}/sign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signature, signType })
        });
    }

    /**
     * Register a new eGov QR signing procedure (Raw String/Nonce)
     */
    static async registerQrSigning(description: string = 'Подписание документа'): Promise<{
        operationId: string;
        qrCode: string;
        eGovMobileLaunchLink: string;
        eGovBusinessLaunchLink: string;
    }> {
        return this.request(`/api/sign/egovQr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, signMethod: 'CMS_SIGN_ONLY' }) // CMS_SIGN_ONLY is required for raw strings
        });
    }

    /**
     * Register a new eGov QR signing procedure connected to a registered document
     */
    static async registerQrSigningWithDocument(documentId: string, description: string = 'Подписание документа'): Promise<{
        operationId: string;
        qrCode: string;
        eGovMobileLaunchLink: string;
        eGovBusinessLaunchLink: string;
    }> {
        return this.request(`/api/sign/egovQr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId, description }) // No CMS_SIGN_ONLY because it's a document payload
        });
    }

    /**
     * Send data to eGov QR signing operation
     */
    static async sendQrData(operationId: string, data: string): Promise<any> {
        return this.request(`/api/sign/egovQr/${operationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data, signMethod: 'CMS_SIGN_ONLY' })
        });
    }

    /**
     * Check status of eGov QR signing operation
     */
    static async checkQrStatus(operationId: string): Promise<{
        status: 'new' | 'meta' | 'data' | 'done' | 'canceled' | 'fail';
        signatures?: string[];
    }> {
        return this.request(`/api/sign/egovQr/${operationId}`);
    }
}

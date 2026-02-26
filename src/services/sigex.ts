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
     * Generate a PDF on the gateway natively and receive the base64 encoded bytes
     */
    static async generatePdf(data: { documentData: any, title?: string, description?: string, isContract?: boolean }): Promise<{ data: string, success: boolean }> {
        return this.request<{ data: string, success: boolean }>('/api/sign/document/generate', {
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
     * Register a new eGov QR signing procedure (Raw String/Nonce or Base64 PDF)
     */
    static async registerQrSigning(
        description: string = 'Подписание документа'
    ): Promise<{
        operationId: string;
        qrCode: string;
        eGovMobileLaunchLink: string;
        eGovBusinessLaunchLink: string;
    }> {
        const body: any = { description };

        const res = await this.request<any>(`/api/sign/egovQr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        // Extract operationId from signURL
        const signURL = res.signURL || '';
        const operationId = signURL.substring(signURL.lastIndexOf('/') + 1);

        return {
            operationId,
            qrCode: res.qrCode,
            eGovMobileLaunchLink: res.eGovMobileLaunchLink,
            eGovBusinessLaunchLink: res.eGovBusinessLaunchLink
        };
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
        const res = await this.request<any>(`/api/sign/egovQr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description,
                signMethod: 'CMS_WITH_DATA',
                documentsToSign: [{
                    id: documentId,
                    nameRu: `${description}.pdf`,
                    nameKz: `${description}.pdf`,
                    nameEn: `${description}.pdf`
                }]
            })
        });

        const signURL = res.signURL || '';
        const operationId = signURL.substring(signURL.lastIndexOf('/') + 1);

        return {
            operationId,
            qrCode: res.qrCode,
            eGovMobileLaunchLink: res.eGovMobileLaunchLink,
            eGovBusinessLaunchLink: res.eGovBusinessLaunchLink
        };
    }

    /**
     * Send data to eGov QR signing operation
     */
    static async sendQrData(operationId: string, data: string, documentName: string = 'Документ'): Promise<any> {
        // This request will HANG (Long-Polling) until the user scans the QR code in eGov Mobile.
        // It must NOT be awaited in the UI thread before showing the QR code!
        const body = {
            signMethod: 'CMS_SIGN_ONLY',
            documentsToSign: [
                {
                    id: 1,
                    nameRu: documentName,
                    nameKz: documentName,
                    nameEn: documentName,
                    meta: [],
                    document: {
                        file: {
                            mime: "",
                            data: data
                        }
                    }
                }
            ]
        };

        return this.request(`/api/sign/egovQr/${operationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    }

    /**
     * Check status of eGov QR signing operation
     */
    static async checkQrStatus(operationId: string): Promise<{
        status: 'new' | 'meta' | 'data' | 'done' | 'canceled' | 'fail';
        signatures?: string[];
        documentsToSign?: Array<any>;
    }> {
        const res = await this.request<any>(`/api/sign/egovQr/${operationId}`);

        // Normalize signatures extraction if it comes nested from Jasalmaty-style documentsToSign payloads
        if (res.status === 'done' && !res.signatures?.length && res.documentsToSign?.length) {
            res.signatures = res.documentsToSign
                .filter((d: any) => d.document?.file?.data)
                .map((d: any) => d.document.file.data);
        }

        return res;
    }
}

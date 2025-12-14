export interface SigexSettings {
    private?: boolean;
    signaturesLimit?: number;
    switchToPrivateAfterLimitReached?: boolean;
    unique?: string[];
    strictSignersRequirements?: boolean;
    signersRequirements?: { iin: string }[];
    publicDuringPreregistration?: boolean;
    publicWhileLessThanSignatures?: number;
    documentAccess?: string[];
    forceArchive?: boolean;
    tempStorageAfterRegistration?: number;
}

export interface SigexEmailNotifications {
    to: string[];
    doNotAttachDocument?: boolean;
    language?: string;
}

export interface SigexRegisterDocumentRequest {
    title?: string;
    description?: string;
    signType?: 'cms' | 'xml';
    signature?: string; // Base64 encoded DER or PEM
    emailNotifications?: SigexEmailNotifications;
    settings?: SigexSettings;
}

export interface SigexRegisterDocumentResponse {
    documentId: string;
    signId?: number;
    data?: string; // Base64 encoded signed data if extracted
}

export interface SigexFixHashRequest {
    // Binary data of the original document
}

export interface SigexFixHashResponse {
    documentId: string;
    signedDataSize: number;
    digests: Record<string, string>; // OID -> base64 digest
    emailNotifications?: {
        attached: boolean;
        message?: string;
    };
    dataArchived: boolean;
    tempStorage: boolean;
}

export interface SigexSignature {
    userId: string;
    businessId?: string;
    subject: string;
    issuer: string;
    serialNumber: string;
    from: number;
    until: number;
    signId: number;
    signType: 'cms' | 'xml';
    tsp?: any;
    ocsp?: any;
}

export interface SigexDocumentResponse {
    title: string;
    description: string;
    signedDataSize: number;
    signaturesTotal: number;
    signatures: SigexSignature[];
    dataArchived: boolean;
    tempStorage: boolean;
    canBeArchived: boolean;
    settings: SigexSettings;
}

export interface SigexAuthResponse {
    nonce: string;
}

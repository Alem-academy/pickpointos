export type Role = 'admin' | 'hr' | 'rf' | 'employee';

export interface User {
    id: string;
    email: string;
    role: Role;
    name: string;
    pvzId?: string; // For RF and Employees
}

export type ApplicationStatus = 'new' | 'review' | 'revision' | 'signing' | 'active' | 'rejected';

export interface Document {
    id: string;
    type: 'id_main' | 'id_register' | 'iin' | 'bank_details' | 'other';
    url: string;
    name: string;
    uploadedAt: string;
}

export interface Application {
    id: string;
    candidateName: string;
    phone?: string;
    status: ApplicationStatus;
    submittedBy: string;
    submittedAt: string;
    pvzId: string;
    documents: Document[];
    comments?: Comment[];
}

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    text: string;
    createdAt: string;
}

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface ExistingDoc {
    id: string;
    type: string;
    status: string;
}

interface WizardDoc {
    type: string;
    document: any;
    content: string;
    success: boolean;
}

export function useWizardDocs(existingDocuments: ExistingDoc[] = []) {
    const hasExistingDocs = existingDocuments.length > 0;
    const allDocsSigned = hasExistingDocs && existingDocuments.every(
        d => d.status === 'signed' || d.status === 'fully_signed'
    );
    const initialStep = allDocsSigned ? 2 : hasExistingDocs ? 1 : 0;

    const [isLoadingContent, setIsLoadingContent] = useState(hasExistingDocs);
    const [docs, setDocs] = useState<WizardDoc[]>([]);
    const [signedDocIds, setSignedDocIds] = useState<string[]>(
        existingDocuments.filter(
            d => d.status === 'employer_signed' || d.status === 'fully_signed'
        ).map(d => d.id)
    );

    useEffect(() => {
        if (!hasExistingDocs) return;

        let cancelled = false;
        setIsLoadingContent(true);

        async function load() {
            const loaded: WizardDoc[] = [];
            for (const doc of existingDocuments) {
                try {
                    const response = await api.getDocumentContent(doc.id);
                    let content = response.content || '';
                    if (!content && response.scan_url) {
                        const fetchRes = await fetch(response.scan_url);
                        content = await fetchRes.text();
                    }
                    loaded.push({ type: doc.type, document: doc, content, success: true });
                } catch (err) {
                    console.error('Failed to load doc content:', err);
                    loaded.push({ type: doc.type, document: doc, content: '<p>Ошибка загрузки</p>', success: false });
                }
            }
            if (!cancelled) {
                setDocs(loaded);
                setIsLoadingContent(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [hasExistingDocs, existingDocuments.map(d => d.id).join(',')]);

    const addSignedId = (id: string) => {
        setSignedDocIds(prev => [...prev, id]);
    };

    const resetDocs = () => {
        setDocs([]);
        setSignedDocIds([]);
    };

    const successfulDocs = docs.filter(d => d.success);

    const setDocsFromGeneration = (generated: WizardDoc[]) => {
        setDocs(generated);
    };

    return {
        hasExistingDocs,
        allDocsSigned,
        initialStep,
        isLoadingContent,
        docs,
        successfulDocs,
        signedDocIds,
        addSignedId,
        resetDocs,
        setDocs: setDocsFromGeneration,
    };
}

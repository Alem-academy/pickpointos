import { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { SigexService } from '@/services/sigex';
import { api } from '@/services/api';

interface SigexSignModalProps {
    documentId: string; // Internal DB ID
    documentTitle: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function SigexSignModal({ documentId, documentTitle, onClose, onSuccess }: SigexSignModalProps) {
    const [step, setStep] = useState<'init' | 'qr' | 'signing' | 'success' | 'error'>('init');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [eGovLinks, setEGovLinks] = useState<{ mobile: string; business: string } | null>(null);

    // Refs for polling
    const pollInterval = useRef<any>(null);
    const operationIdRef = useRef<string | null>(null);
    const sigexDocIdRef = useRef<string | null>(null);

    useEffect(() => {
        startSigningProcess();
        return () => stopPolling();
    }, []);

    const stopPolling = () => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    };

    const startSigningProcess = async () => {
        try {
            setStep('init');
            setError(null);

            // 1. Register Document in Sigex (Mock data for now as we don't have the real file blob here yet)
            // In a real app, we would fetch the file blob from the backend first.
            // For this MVP, we'll register a dummy "hash" or text.
            const regRes = await SigexService.registerDocument({
                title: documentTitle,
                description: 'Подписание документа в системе PickPoint',
                settings: {
                    // authorization: 'issuer', // Removed as it's not in the type definition
                }
            });

            sigexDocIdRef.current = regRes.documentId;

            // 2. Register QR Signing
            const qrRes = await SigexService.registerQrSigning(regRes.documentId);

            setQrCode(qrRes.qrCode);
            setEGovLinks({
                mobile: qrRes.eGovMobileLaunchLink,
                business: qrRes.eGovBusinessLaunchLink
            });
            operationIdRef.current = qrRes.operationId;

            setStep('qr');

            // 3. Start Polling
            pollInterval.current = setInterval(checkStatus, 3000);

        } catch (err: any) {
            console.error('Sigex Init Error:', err);
            setError(err.message || 'Ошибка инициализации Sigex');
            setStep('error');
        }
    };

    const checkStatus = async () => {
        if (!sigexDocIdRef.current || !operationIdRef.current) return;

        try {
            const statusRes = await SigexService.checkQrStatus(sigexDocIdRef.current, operationIdRef.current);

            if (statusRes.status === 'done') {
                stopPolling();
                setStep('signing');
                await finalizeSignature(statusRes.signId);
            } else if (statusRes.status === 'canceled' || statusRes.status === 'fail') {
                stopPolling();
                setError('Подписание отменено или произошла ошибка');
                setStep('error');
            }
            // 'new', 'meta', 'data' -> continue polling
        } catch (err) {
            console.error('Polling Error:', err);
            // Don't stop polling on transient network errors, but maybe count them?
        }
    };

    const finalizeSignature = async (signId?: number) => {
        try {
            // 4. Send success to our backend
            await api.signDocument(documentId); // We can pass signId or signature metadata here if needed
            console.log('Signed with ID:', signId);
            setStep('success');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err: any) {
            console.error('Backend Sign Error:', err);
            setError('Ошибка сохранения подписи на сервере');
            setStep('error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Подписание через eGov</h3>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-[300px] flex flex-col items-center justify-center text-center">

                    {step === 'init' && (
                        <div className="space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">Подготовка документа...</p>
                        </div>
                    )}

                    {step === 'qr' && qrCode && (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="rounded-lg border-2 border-primary/20 p-4 bg-white shadow-inner">
                                <img
                                    src={`data:image/png;base64,${qrCode}`}
                                    alt="eGov QR Code"
                                    className="h-48 w-48 object-contain"
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="font-medium">Отсканируйте QR-код</p>
                                <p className="text-sm text-muted-foreground">
                                    Используйте приложение <strong>eGov Mobile</strong> или <strong>eGov Business</strong>
                                </p>
                            </div>

                            {/* Mobile Deep Links (visible only on mobile ideally, but good for testing) */}
                            <div className="flex gap-2 justify-center text-xs">
                                <a href={eGovLinks?.mobile} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                    Открыть eGov Mobile
                                </a>
                            </div>
                        </div>
                    )}

                    {step === 'signing' && (
                        <div className="space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                            <p className="font-medium text-emerald-700">Подпись получена!</p>
                            <p className="text-sm text-muted-foreground">Сохранение в системе...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="space-y-4 animate-in zoom-in duration-300">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                            <h4 className="text-xl font-bold text-emerald-700">Успешно!</h4>
                            <p className="text-muted-foreground">Документ подписан.</p>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="space-y-4">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <AlertTriangle className="h-8 w-8" />
                            </div>
                            <p className="font-medium text-red-600">{error}</p>
                            <button
                                onClick={startSigningProcess}
                                className="flex items-center gap-2 mx-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Повторить
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

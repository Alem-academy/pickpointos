import { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { SigexService } from '@/services/sigex';
import { api } from '@/services/api';

interface SigexSignModalProps {
    documentId: string; // Internal DB ID
    documentTitle: string;
    onClose: () => void;
    onSuccess: () => void;
    preRegisteredDocumentId?: string; // If provided, uses this exact SIGEX document
    /** Публичная ссылка /sign/:token — сохраняем operationId и шлём подпись на /api/sign/.../submit-signature (без JWT) */
    publicSigningToken?: string;
}

export function SigexSignModal({ documentId, documentTitle, onClose, onSuccess, preRegisteredDocumentId, publicSigningToken }: SigexSignModalProps) {
    const [step, setStep] = useState<'init' | 'qr' | 'signing' | 'success' | 'error'>('init');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [eGovLinks, setEGovLinks] = useState<{ mobile: string; business: string } | null>(null);

    // Refs for polling
    const pollInterval = useRef<any>(null);
    const operationIdRef = useRef<string | null>(null);

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

            // 1. Регистрация QR + (если нет Sigex doc id) отправка реального PDF — иначе eGov Mobile не показывает предпросмотр
            let qrRes: Awaited<ReturnType<typeof SigexService.registerQrSigning>>;
            let dataPromise: Promise<any> | null = null;

            if (preRegisteredDocumentId) {
                console.log('[Sigex] pre-registered document:', preRegisteredDocumentId);
                qrRes = await SigexService.registerQrSigningWithDocument(
                    preRegisteredDocumentId,
                    `Подписание: ${documentTitle}`
                );
            } else {
                let pdfBase64: string;
                // До ответа API не подставляем кириллицу в имя — иначе eGov/Android могут показать «____________.pdf»
                let pdfFileName = 'document.pdf';
                try {
                    if (publicSigningToken) {
                        const r = await fetch(`/api/sign/${publicSigningToken}/pdf-base64`);
                        const j = (await r.json()) as { pdfBase64?: string; fileName?: string; error?: string };
                        if (!r.ok) {
                            throw new Error(j.error || `Ошибка подготовки PDF (${r.status})`);
                        }
                        if (!j.pdfBase64) {
                            throw new Error(j.error || 'Пустой PDF');
                        }
                        pdfBase64 = j.pdfBase64;
                        if (j.fileName) {
                            pdfFileName = j.fileName;
                        }
                    } else {
                        const j = await api.getDocumentPdfBase64(documentId);
                        pdfBase64 = j.pdfBase64;
                        if (j.fileName) {
                            pdfFileName = j.fileName;
                        }
                    }
                } catch (pdfErr: unknown) {
                    const ax = pdfErr as { response?: { status?: number; data?: { error?: string } }; message?: string };
                    const st = ax.response?.status;
                    const apiErr = ax.response?.data?.error;
                    throw new Error(
                        st === 503 || apiErr?.includes('Puppeteer') || apiErr?.includes('browser')
                            ? 'Сервер не смог сформировать PDF (нужен Chromium на хосте). Обратитесь к администратору.'
                            : apiErr || ax.message || 'Не удалось подготовить PDF для подписи в eGov'
                    );
                }

                console.log('[Sigex] PDF for eGov:', pdfFileName, `~${Math.round(pdfBase64.length / 1024)} KB base64`);
                qrRes = await SigexService.registerQrSigning(`Подписание: ${documentTitle}`);

                dataPromise = SigexService.sendQrData(
                    qrRes.operationId,
                    pdfBase64,
                    pdfFileName,
                    'application/pdf'
                ).catch((err: Error) => {
                    console.warn('Data POST (PDF) failed (or aborted):', err.message);
                    return null;
                });
            }

            setQrCode(qrRes.qrCode);
            setEGovLinks({
                mobile: qrRes.eGovMobileLaunchLink,
                business: qrRes.eGovBusinessLaunchLink
            });
            operationIdRef.current = qrRes.operationId;
            if (publicSigningToken) {
                try {
                    sessionStorage.setItem(`sigex-sign-op:${publicSigningToken}`, qrRes.operationId);
                } catch {
                    /* private mode */
                }
            }

            setStep('qr');

            // 4. Verification & Status Check (long-poll GET может держаться до ~110s на стороне gateway)
            let isDone = false;
            for (let i = 0; i < 80; i++) {
                try {
                    const statusRes = await SigexService.checkQrStatus(qrRes.operationId);

                    if (statusRes.status === 'done') {
                        isDone = true;

                        if (statusRes.signatures && statusRes.signatures.length > 0) {
                            setStep('signing');
                            await finalizeSignature(statusRes.signatures[0]);
                        } else {
                            setError('Подписание не завершено (ошибка выгрузки подписи).');
                            setStep('error');
                        }
                        return; // Exit loop
                    } else if (statusRes.status === 'canceled' || statusRes.status === 'fail') {
                        isDone = true;
                        setError('Подписание отменено или произошла ошибка');
                        setStep('error');
                        return; // Exit loop
                    }

                    // For 'new', 'meta', 'data', SIGEX is still waiting.
                    await new Promise(r => setTimeout(r, 2000));
                } catch (err: any) {
                    console.warn(`Status check retry ${i + 1}:`, err);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (!isDone) {
                // If the dataPromise finished while we were polling but loop timed out, check it!
                if (dataPromise) {
                    try {
                        const finalPostRes = await dataPromise;
                        if (finalPostRes && finalPostRes.status === 'done' && finalPostRes.documentsToSign?.length) {
                             const cmsSigs = finalPostRes.documentsToSign
                                .map((d: any) => d.signature || d.document?.file?.data)
                                .filter(Boolean);
                             if (cmsSigs.length > 0) {
                                 setStep('signing');
                                 await finalizeSignature(cmsSigs[0]);
                                 return;
                             }
                        }
                    } catch (e) {}
                }
                
                setError('Время ожидания подписания истекло');
                setStep('error');
            }

        } catch (err: any) {
            console.error('Sigex Init Error:', err);
            setError(err.message || 'Ошибка инициализации Sigex');
            setStep('error');
        }
    };

    const finalizeSignature = async (signature?: string) => {
        try {
            const payload = {
                signature: signature || undefined,
                signType: 'cms' as const,
                sigex_document_id: preRegisteredDocumentId || undefined,
                sigex_operation_id: operationIdRef.current || undefined
            };

            if (publicSigningToken) {
                const res = await fetch(`/api/sign/${publicSigningToken}/submit-signature`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        signature: payload.signature,
                        sigex_document_id: payload.sigex_document_id,
                        sigex_operation_id: payload.sigex_operation_id
                    })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error((data as { error?: string }).error || `Ошибка сервера: ${res.status}`);
                }
            } else {
                await api.signDocument(documentId, payload);
            }

            console.log('✅ Signed with signature:', signature?.substring(0, 30) + '...');
            console.log('📝 Sigex document ID:', preRegisteredDocumentId);
            console.log('🔗 Operation ID:', operationIdRef.current);
            
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

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle, AlertTriangle, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { SigexService } from '@/services/sigex';
import { api } from '@/services/api';
// @ts-ignore
import { NCALayerClient } from 'ncalayer-js-client';

interface SigexSignModalProps {
    documentId: string; // Internal DB ID
    documentTitle: string;
    onClose: () => void;
    onSuccess: () => void;
    preRegisteredDocumentId?: string; // If provided, uses this exact SIGEX document
    /** Публичная ссылка /sign/:token — сохраняем operationId и шлём подпись на /api/sign/.../submit-signature (без JWT) */
    publicSigningToken?: string;
    /** Режим подписания: 'employee' (по умолчанию) или 'employer' (директор/ИП через NCALayer) */
    signingRole?: 'employee' | 'employer';
}

export function SigexSignModal({ documentId, documentTitle, onClose, onSuccess, preRegisteredDocumentId, publicSigningToken, signingRole = 'employee' }: SigexSignModalProps) {
    const [step, setStep] = useState<'method-selection' | 'init' | 'qr' | 'ncalayer_init' | 'signing' | 'success' | 'error'>(
        signingRole === 'employer' ? 'ncalayer_init' : 'method-selection'
    );
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [eGovLinks, setEGovLinks] = useState<{ mobile: string; business: string } | null>(null);
    const [fetchedPdfBase64, setFetchedPdfBase64] = useState<string | null>(null);
    const [fetchedPdfName, setFetchedPdfName] = useState<string>('document.pdf');

    // Refs for polling
    const pollInterval = useRef<any>(null);
    const operationIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Pre-fetch PDF in background if possible to speed up NCALayer/eGov later
        loadPdfBackground();
        return () => stopPolling();
    }, []);

    const stopPolling = () => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    };

    const loadPdfBackground = async () => {
        // PDF нужен для NCALayer и ускоряет eGov; наличие sigex_document_id не отменяет локальную генерацию PDF
        try {
            if (publicSigningToken) {
                const r = await fetch(`/api/sign/${publicSigningToken}/pdf-base64`);
                const j = await r.json();
                if (r.ok && j.pdfBase64) {
                    setFetchedPdfBase64(j.pdfBase64);
                    if (j.fileName) setFetchedPdfName(j.fileName);
                }
            } else {
                const j = await api.getDocumentPdfBase64(documentId);
                if (j.pdfBase64) {
                    setFetchedPdfBase64(j.pdfBase64);
                    if (j.fileName) setFetchedPdfName(j.fileName);
                }
            }
        } catch (e) {
            console.warn('Background PDF fetch failed:', e);
        }
    };


    const startEgovSigningProcess = async () => {
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
                let pdfBase64 = fetchedPdfBase64;
                let pdfFileName = fetchedPdfName;

                if (!pdfBase64) {
                    try {
                        if (publicSigningToken) {
                            const r = await fetch(`/api/sign/${publicSigningToken}/pdf-base64`);
                            const j = (await r.json()) as { pdfBase64?: string; fileName?: string; error?: string };
                            if (!r.ok) throw new Error(j.error || `Ошибка подготовки PDF (${r.status})`);
                            if (!j.pdfBase64) throw new Error(j.error || 'Пустой PDF');
                            pdfBase64 = j.pdfBase64;
                            if (j.fileName) pdfFileName = j.fileName;
                        } else {
                            const j = await api.getDocumentPdfBase64(documentId);
                            pdfBase64 = j.pdfBase64;
                            if (j.fileName) pdfFileName = j.fileName;
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
                }

                console.log('[Sigex] PDF for eGov:', pdfFileName, `~${Math.round((pdfBase64?.length || 0) / 1024)} KB`);
                qrRes = await SigexService.registerQrSigning(`Подписание: ${documentTitle}`);

                dataPromise = SigexService.sendQrData(
                    qrRes.operationId,
                    pdfBase64 as string,
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

    const startNcaLayerSigning = async () => {
        try {
            setStep('ncalayer_init');
            setError(null);

            let pdfBase64 = fetchedPdfBase64;
            if (!pdfBase64) {
                try {
                    if (publicSigningToken) {
                        const r = await fetch(`/api/sign/${publicSigningToken}/pdf-base64`);
                        const j = (await r.json()) as { pdfBase64?: string; error?: string };
                        if (!r.ok || !j.pdfBase64) throw new Error(j.error || 'Ошибка скачивания файла');
                        pdfBase64 = j.pdfBase64;
                    } else {
                        const j = await api.getDocumentPdfBase64(documentId);
                        if (!j.pdfBase64) throw new Error('Пустой PDF');
                        pdfBase64 = j.pdfBase64;
                    }
                    setFetchedPdfBase64(pdfBase64);
                } catch (err: any) {
                    throw new Error('Не удалось подготовить документ для подписи. ' + (err.message || ''));
                }
            }

            if (!pdfBase64) {
                throw new Error('Не удалось получить PDF для подписи через NCALayer.');
            }

            const ncalayer = new NCALayerClient();
            try {
                await ncalayer.connect();
            } catch (error) {
                throw new Error('Не удалось подключиться к программе NCALayer. Убедитесь, что она запущена на вашем компьютере.');
            }

            setStep('signing');
            // Sign the Base64 PDF data directly creating a CMS
            const signature = await ncalayer.basicsSignCMS(
                NCALayerClient.basicsStorageAll,
                pdfBase64 as string,
                NCALayerClient.basicsCMSParamsWithData, // Must match "signMethod: CMS_WITH_DATA" logic
                NCALayerClient.basicsSignerSign // For documents it's usually Sign
            );

            await finalizeSignature(signature);

        } catch (err: any) {
            console.error('NCALayer error:', err);
            if (err.message?.includes('отменен') || err.message?.includes('canceled') || err.toString().includes('Canceled')) {
                setError('Процесс подписания был отменен пользователем.');
            } else {
                setError(err.message || 'Неизвестная ошибка при подписании через NCALayer.');
            }
            setStep('error');
        }
    };

    const finalizeSignature = async (signature?: string) => {
        try {
            if (signingRole === 'employer') {
                // Employer signing — uses NCALayer, saves via dedicated endpoint
                const certInfo = signature ? extractCertInfo(signature) : undefined;
                await api.signDocumentAsEmployer(documentId, signature || '', certInfo);
                console.log(`[Sigex] Employer signed document ${documentId}`);
            } else {
                // Employee signing — eGov QR or NCALayer
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
            }

            console.log('✅ Signed with signature:', signature?.substring(0, 30) + '...');
            console.log('📝 Sigex document ID:', preRegisteredDocumentId);
            console.log('🔗 Operation ID:', operationIdRef.current);
            console.log('👤 Signing role:', signingRole);

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

    /** Extract basic cert info from CMS signature for logging */
    const extractCertInfo = (_signature: string) => {
        // In production, parse CMS and extract certificate details
        // For now, just return a placeholder — actual parsing happens on backend
        return { parsed: true, timestamp: new Date().toISOString() };
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        {signingRole === 'employer' ? 'Подпись работодателя' : 'Электронная подпись'}
                    </h3>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-[300px] flex flex-col items-center justify-center text-center">

                    {step === 'method-selection' && signingRole === 'employee' && (
                        <div className="space-y-4 w-full animate-in fade-in duration-300">
                            <p className="text-muted-foreground mb-6">Выберите удобный для вас способ подписания документа:</p>

                            <button
                                onClick={startEgovSigningProcess}
                                className="w-full flex items-center p-4 border-2 border-primary/20 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-left group"
                            >
                                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Smartphone className="h-6 w-6 text-primary" />
                                </div>
                                <div className="ml-4 truncate">
                                    <h4 className="font-semibold text-lg text-slate-900">QR-код eGov Mobile</h4>
                                    <p className="text-sm text-slate-500 whitespace-normal">Удобно, если на телефоне установлено приложение eGov</p>
                                </div>
                            </button>

                            <button
                                onClick={startNcaLayerSigning}
                                className="w-full flex items-center p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group"
                            >
                                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Monitor className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="ml-4 truncate">
                                    <h4 className="font-semibold text-lg text-slate-900">Ключи ЭЦП на ПК</h4>
                                    <p className="text-sm text-slate-500 whitespace-normal">Через программу NCALayer (файлы RSA / GOST)</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {(step === 'init' || step === 'ncalayer_init') && (
                        <div className="space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">
                                {step === 'init' ? 'Подготовка документа и генерация QR...' : 'Подключение к NCALayer...'}
                            </p>
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
                        <div className="space-y-4 animate-in zoom-in duration-300 w-full">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <AlertTriangle className="h-10 w-10" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900">Ошибка подписания</h4>
                            <p className="text-red-600/90 whitespace-pre-wrap">{error}</p>

                            <div className="pt-4 flex gap-3 flex-col sm:flex-row w-full justify-center">
                                {signingRole === 'employee' ? (
                                    <button
                                        onClick={() => setStep('method-selection')}
                                        className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-200 transition-colors w-full"
                                    >
                                        Выбрать способ
                                    </button>
                                ) : (
                                    <button
                                        onClick={onClose}
                                        className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-200 transition-colors w-full"
                                    >
                                        Закрыть
                                    </button>
                                )}
                                <button
                                    onClick={() => startNcaLayerSigning()}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-red-50 px-6 py-2.5 font-medium text-red-600 hover:bg-red-100 transition-colors w-full"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Повторить
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

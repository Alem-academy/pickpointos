import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type Employee } from "@/services/api";
import { SigexService } from "@/services/sigex";
import { FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type InviteStep = 'loading' | 'error' | 'review' | 'qr' | 'success';

export default function InvitePage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [step, setStep] = useState<InviteStep>('loading');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [qrCodeData, setQrCodeData] = useState<string>('');
    const [mobileLink, setMobileLink] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    // We use ref to track if component unmounted to stop polling
    const isPollingRef = useRef(false);

    useEffect(() => {
        if (!token) {
            setErrorMsg("Токен не найден в ссылке");
            setStep('error');
            return;
        }

        api.getInviteData(token)
            .then(res => {
                setEmployee(res.employee);
                setStep('review');
            })
            .catch(err => {
                console.error(err);
                setErrorMsg("Ссылка недействительна или срок её действия истек.");
                setStep('error');
            });

        return () => {
            isPollingRef.current = false;
        };
    }, [token]);

    const handleStartSigning = async () => {
        if (!employee || !token) return;

        setIsGenerating(true);
        setErrorMsg('');

        try {
            // Generate signing data (base64 of candidate details)
            const signText = `Подписание трудового договора: ${employee.full_name} (${employee.iin})`;
            const base64Data = btoa(unescape(encodeURIComponent(signText)));

            // 2. Register one-step CMS_SIGN_ONLY session
            const qrRes = await SigexService.registerQrSigning(`Оформление: ${employee.full_name}`);

            setQrCodeData(qrRes.qrCode);
            setMobileLink(qrRes.eGovMobileLaunchLink);
            setStep('qr');

            // 3. Initiate Long-Polling data upload asynchronously
            SigexService.sendQrData(qrRes.operationId, base64Data, `Оформление: ${employee.full_name}`)
                .catch(err => console.error("QR data upload expected timeout/error:", err));

            // 4. Start long-polling for signature
            const waitForSignature = async () => {
                let attempts = 0;
                while (attempts < 5) {
                    attempts++;
                    try {
                        const statusRes = await SigexService.checkQrStatus(qrRes.operationId);

                        if (statusRes.signatures && statusRes.signatures.length > 0) {
                            // Validate signature
                            await api.verifyInvite(token!, employee!.iin);
                            setStep('success');
                            return;
                        }

                        if ((statusRes as any).message) {
                            console.warn("SIGEX Response:", (statusRes as any).message);
                            await new Promise(r => setTimeout(r, 2000));
                            continue;
                        }

                    } catch (err: any) {
                        console.error("Polling error:", err);
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }

                setErrorMsg("Время ожидания подписания истекло");
                setStep('review');
            };

            // Do not await, let it run in background
            waitForSignature();

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || 'Ошибка генерации документа для подписания');
        } finally {
            setIsGenerating(false);
        }
    };

    if (step === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center">
                    <Loader2 className="h-10 w-10 animate-spin text-slate-800" />
                    <p className="mt-4 text-slate-600 font-medium">Проверка приглашения...</p>
                </div>
            </div>
        );
    }

    if (step === 'error') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-sm border border-red-100 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Ошибка доступа</h2>
                    <p className="text-slate-600 font-medium">{errorMsg}</p>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-sm border border-emerald-100 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Поздравляем!</h2>
                    <p className="text-slate-600 font-medium mb-6">
                        Ваш трудовой договор успешно подписан ЭЦП ключами.
                        Ваш аккаунт в системе PickPoint OS активирован.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full rounded-xl bg-black px-4 py-3 font-bold text-white transition-colors hover:bg-slate-800"
                    >
                        Войти в систему
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-slate-900 px-6 py-8 text-white text-center">
                    <h1 className="text-2xl font-bold">Добро пожаловать в PickPoint!</h1>
                    <p className="mt-2 text-slate-300">Официальное Трудоустройство</p>
                </div>

                <div className="p-8">
                    {step === 'review' && employee && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {errorMsg && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="rounded-xl bg-blue-50 p-6 border border-blue-100">
                                <div className="flex items-center gap-3 mb-4 text-blue-800">
                                    <FileText className="h-6 w-6" />
                                    <h3 className="font-bold text-lg">Трудовой Договор</h3>
                                </div>

                                <dl className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                        <dt className="text-slate-500 font-medium tracking-wide text-xs uppercase">Сотрудник</dt>
                                        <dd className="font-semibold text-slate-900 text-right">{employee.full_name}</dd>
                                    </div>
                                    <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                        <dt className="text-slate-500 font-medium tracking-wide text-xs uppercase">ИИН</dt>
                                        <dd className="font-mono text-slate-900 text-right">{employee.iin}</dd>
                                    </div>
                                    <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                        <dt className="text-slate-500 font-medium tracking-wide text-xs uppercase">Должность</dt>
                                        <dd className="font-semibold text-slate-900 text-right">
                                            {employee.role === 'rf' ? 'Региональный Менеджер' :
                                                (employee.role === 'financier' ? 'Финансист' : 'Менеджер ПВЗ')}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <dt className="text-slate-500 font-medium tracking-wide text-xs uppercase">Оклад</dt>
                                        <dd className="font-bold text-slate-900 text-right">
                                            {employee.base_rate ? `${employee.base_rate} KZT` : 'По штатному расписанию'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <p className="text-sm text-slate-500 text-center px-4 leading-relaxed">
                                Для завершения оформления нажмите кнопку ниже и подпишите сгенерированный документ через ваше приложение eGov Mobile.
                            </p>

                            <button
                                onClick={handleStartSigning}
                                disabled={isGenerating}
                                className="w-full flex justify-center items-center rounded-xl bg-blue-600 px-4 py-4 font-bold text-white transition-all hover:bg-blue-700 shadow-md disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Формируем документ...</>
                                ) : (
                                    "Перейти к подписанию (eGov Mobile)"
                                )}
                            </button>
                        </div>
                    )}

                    {step === 'qr' && (
                        <div className="space-y-8 animate-in zoom-in-95 duration-300 text-center">
                            <div>
                                <h3 className="font-bold text-xl text-slate-900">Отсканируйте код</h3>
                                <p className="text-sm text-slate-500 mt-2">
                                    Откройте приложение eGov Mobile и отсканируйте этот QR-код для подписания договора.
                                </p>
                            </div>

                            <div className="mx-auto bg-white p-3 rounded-2xl shadow-sm border border-slate-100 max-w-[240px] aspect-square">
                                {qrCodeData ? (
                                    <img
                                        src={`data:image/jpeg;base64,${qrCodeData}`}
                                        alt="eGov QR Code"
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            console.error("QR Code image load error", e);
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-xl">
                                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                                    </div>
                                )}
                            </div>

                            <div className="md:hidden">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="bg-white px-4 text-slate-500 font-medium">или если вы с телефона</span>
                                    </div>
                                </div>
                                <a
                                    href={mobileLink}
                                    className="mt-6 flex w-full justify-center rounded-xl border-2 border-slate-900 bg-white px-4 py-3 font-bold text-slate-900 transition-colors hover:bg-slate-50"
                                >
                                    Открыть в приложении eGov Mobile
                                </a>
                            </div>

                            <div className="flex items-center justify-center gap-3 text-sm text-amber-600 font-medium bg-amber-50 p-3 rounded-lg border border-amber-100">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Ожидаем подписание документа...
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/layout/AuthContext";
import { Loader2, Eye, EyeOff, Lock, Mail, Smartphone, Monitor, CheckCircle, ArrowLeft } from "lucide-react";
import { SigexService } from "@/services/sigex";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// @ts-ignore
import { NCALayerClient } from 'ncalayer-js-client';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Auth Method Switcher
    const [authMethod, setAuthMethod] = useState<'password' | 'eds'>('password');
    const [edsError, setEdsError] = useState<string | null>(null);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    // QR State
    const [qrStep, setQrStep] = useState<'idle' | 'init' | 'qr' | 'success'>('idle');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [eGovLinks, setEGovLinks] = useState<{ mobile: string; business: string } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login({ email, password });

            const target = location.state?.from?.pathname || '/';
            navigate(target, { replace: true });
        } catch (error: any) {
            console.error("Login failed", error);
            const errorMessage = error.response?.data?.error || error.message || "Неверный email или пароль";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdsLoginDesktop = async () => {
        setEdsError(null);
        setIsLoading(true);

        try {
            const { nonce } = await SigexService.getAuthNonce();

            const ncalayer = new NCALayerClient();
            try {
                await ncalayer.connect();
            } catch (err) {
                setEdsError("Не удалось подключиться к NCALayer. Убедитесь, что программа запущена на вашем компьютере.");
                setIsLoading(false);
                return;
            }

            // Convert nonce to Base64 for NCALayer
            const base64Nonce = btoa(unescape(encodeURIComponent(nonce)));

            let signature;
            try {
                signature = await ncalayer.basicsSignCMS(
                    NCALayerClient.basicsStorageAll,
                    base64Nonce,
                    NCALayerClient.basicsCMSParamsDetached,
                    NCALayerClient.basicsSignerAuth
                );
            } catch (e: any) {
                if (e.canceledByUser) {
                    setEdsError("Вход отменен пользователем.");
                } else {
                    setEdsError("Ошибка при подписании ключом ЭЦП.");
                }
                setIsLoading(false);
                return;
            }

            if (!signature) {
                setEdsError("Подпись не получена.");
                setIsLoading(false);
                return;
            }

            // Send base64 signature back to Sigex Gateway for auth
            await SigexService.authenticate(nonce, signature);

            // Temporary Mock for MVP
            await login({ email: 'eds_user@example.com', password: 'password123' });
            navigate('/hr', { replace: true });

        } catch (error: any) {
            console.error("EDS Login failed:", error);
            setEdsError(error.message || "Ошибка авторизации через SIGEX.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEGovMobileLogin = async () => {
        setEdsError(null);
        setQrStep('init');

        try {
            // 1. Get nonce
            const { nonce } = await SigexService.getAuthNonce();

            // 2. Generate a visually pleasing HTML authorization document
            const authDocumentHtml = `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Авторизация в системе PickPoint OS</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                    .header h1 { color: #0f172a; margin: 0; font-size: 24px; }
                    .content { background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; }
                    .token-box { background: #fff; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 14px; word-break: break-all; border: 1px dashed #cbd5e1; margin-top: 15px; color: #64748b; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Запрос на авторизацию</h1>
                    <p>PickPoint OS - Панель управления</p>
                </div>
                <div class="content">
                    <p><strong>Действие:</strong> Вход в систему по ЭЦП</p>
                    <p><strong>Дата и время:</strong> ${new Date().toLocaleString('ru-RU')}</p>
                    <p>Подписывая данный документ, вы подтверждаете вход в вашу учетную запись в защищенной системе PickPoint OS.</p>
                    
                    <div class="token-box">
                        <strong>Уникальный идентификатор сессии (Nonce):</strong><br/>
                        ${nonce}
                    </div>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} Alem Lab. Автоматически сгенерированный документ.
                </div>
            </body>
            </html>
            `;

            // 3. Register the HTML document in SIGEX
            const regRes = await SigexService.registerDocument({
                title: 'Авторизация в системе PickPoint OS',
                description: 'Документ авторизации пользователя для входа в панель управления.',
            });
            const documentId = regRes.documentId;

            // 4. Upload the HTML document content to SIGEX
            const htmlBlob = new Blob([authDocumentHtml], { type: 'text/html; charset=utf-8' });
            await SigexService.addDocumentData(documentId, htmlBlob);

            // 5. Register QR signing tied to this document
            const qrRes = await SigexService.registerQrSigningWithDocument(documentId, 'Авторизация в платформе PickPoint OS');
            setQrCode(qrRes.qrCode);
            setEGovLinks({ mobile: qrRes.eGovMobileLaunchLink, business: qrRes.eGovBusinessLaunchLink });

            setQrStep('qr');

            // 6. Poll for completion
            let isPolling = true;
            const checkStatus = async () => {
                if (!isPolling) return;

                try {
                    const statusRes = await SigexService.checkQrStatus(qrRes.operationId);

                    if (statusRes.status === 'done') {
                        isPolling = false;
                        setQrStep('success');

                        if (!statusRes.signatures || statusRes.signatures.length === 0) {
                            throw new Error("Не найдена подпись в ответе eGov QR");
                        }

                        const signature = statusRes.signatures[0];
                        if (!signature) throw new Error("Подпись пуста");

                        // 7. Authenticate using the signature AND the document ID (document-based auth)
                        await SigexService.authenticateDocument(nonce, signature, documentId);

                        // Mock login for MVP
                        await login({ email: 'eds_user@example.com', password: 'password123' });
                        navigate('/hr', { replace: true });
                    } else if (statusRes.status === 'canceled' || statusRes.status === 'fail') {
                        isPolling = false;
                        setEdsError("Авторизация отменена в приложении.");
                        setQrStep('idle');
                    } else {
                        // Poll again later (data, meta, new status)
                        setTimeout(checkStatus, 3500);
                    }
                } catch (err: any) {
                    console.error("Polling error:", err);
                    setTimeout(checkStatus, 3500); // Retry on network errors
                }
            };

            setTimeout(checkStatus, 3500);

        } catch (error: any) {
            console.error('eGov QR Auth Error:', error);
            setEdsError(error.message || "Ошибка eGov Mobile авторизации");
            setQrStep('idle');
        }
    };


    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        PVZ OS <span className="text-slate-300 font-medium text-lg ml-1">v2.0</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500">
                        {qrStep !== 'idle' ? "Авторизация eGov Mobile" : "Вход в систему управления"}
                    </p>
                </div>

                {qrStep === 'idle' ? (
                    <>
                        <div className="flex rounded-lg bg-slate-100 p-1 mt-4">
                            <button
                                onClick={() => setAuthMethod('password')}
                                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${authMethod === 'password' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                По почте
                            </button>
                            <button
                                onClick={() => setAuthMethod('eds')}
                                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${authMethod === 'eds' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                По ЭЦП
                            </button>
                        </div>

                        {authMethod === 'password' ? (
                            <form onSubmit={handleLogin} className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                        <Input
                                            type="email"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Пароль"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10"
                                            required
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-slate-900 hover:bg-slate-800"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Войти в панель
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-6 pt-2 animate-in fade-in duration-300">
                                {edsError && (
                                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 border border-red-100 text-center">
                                        {edsError}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <Button
                                        variant="outline"
                                        onClick={handleEdsLoginDesktop}
                                        disabled={isLoading}
                                        className="w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 py-6"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        ) : (
                                            <Monitor className="mr-2 h-5 w-5" />
                                        )}
                                        Войти через NCALayer (ПК)
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleEGovMobileLogin}
                                        disabled={isLoading}
                                        className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 py-6"
                                    >
                                        <Smartphone className="mr-2 h-5 w-5" />
                                        Войти через eGov Mobile
                                    </Button>
                                </div>

                                <div className="text-center">
                                    <p className="text-xs text-slate-500">
                                        Для входа с ПК убедитесь, что приложение NCALayer запущено.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="min-h-[300px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                        {qrStep === 'init' && (
                            <div className="space-y-4">
                                <Loader2 className="h-10 w-10 animate-spin text-slate-400 mx-auto" />
                                <p className="text-slate-500 font-medium text-sm">Подготовка сессии...</p>
                            </div>
                        )}

                        {qrStep === 'qr' && qrCode && (
                            <div className="space-y-6 w-full">
                                <div className="hidden sm:block mx-auto w-fit rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
                                    <img
                                        src={`data:image/png;base64,${qrCode}`}
                                        alt="eGov QR Code"
                                        className="h-48 w-48 object-contain"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <p className="font-semibold text-slate-800 text-lg hidden sm:block">Код для входа</p>
                                    <p className="font-semibold text-slate-800 text-lg sm:hidden">Подписание в eGov Mobile</p>

                                    <p className="text-sm text-slate-500 px-4 hidden sm:block">
                                        Откройте приложение <strong>eGov Mobile</strong> или <strong>eGov Business</strong> и отсканируйте код
                                    </p>
                                    <p className="text-sm text-slate-500 px-4 sm:hidden">
                                        Нажмите на кнопку ниже, чтобы перейти в приложение для подписания
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 px-4 pt-2">
                                    <a
                                        href={eGovLinks?.mobile}
                                        className="sm:hidden flex items-center justify-center w-full bg-[#1A1A1A] hover:bg-black text-white font-medium px-4 py-3.5 rounded-xl transition-colors shadow-sm"
                                    >
                                        <Smartphone className="mr-2 h-5 w-5 opacity-80" />
                                        Открыть eGov Mobile
                                    </a>
                                    <a href={eGovLinks?.mobile} className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 font-medium px-4 py-2 bg-blue-50 rounded-lg hidden sm:block transition-colors">
                                        Как подписать?
                                    </a>
                                </div>

                                <Button variant="ghost" className="mt-2 text-slate-500 w-full hover:bg-slate-100" onClick={() => {
                                    setQrStep('idle');
                                }}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Вернуться назад
                                </Button>
                            </div>
                        )}

                        {qrStep === 'success' && (
                            <div className="space-y-4">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <CheckCircle className="h-10 w-10" />
                                </div>
                                <h4 className="text-xl font-bold text-emerald-700">Успешно!</h4>
                                <p className="text-slate-500">Входим в систему...</p>
                            </div>
                        )}
                    </div>
                )}

                <p className="text-center text-xs font-medium text-slate-300 pt-2 border-t border-slate-100">
                    &copy; 2025 Alem Lab. Protected System.
                </p>
            </div>
        </div>
    );
}

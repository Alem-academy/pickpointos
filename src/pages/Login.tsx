import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/layout/AuthContext";
import { Mail, Lock, Eye, EyeOff, Loader2, Smartphone, Monitor, CheckCircle } from "lucide-react";
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
    // State for which auth method is currently selected ('password' | 'eds')
    const [authMethod, setAuthMethod] = useState<'password' | 'eds'>('password');
    const [edsError, setEdsError] = useState<string | null>(null);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    // QR State
    // qrStep: idle (waiting), init (loading), qr (ready), success (verified), error (failed)
    const [qrStep, setQrStep] = useState<'idle' | 'init' | 'qr' | 'success' | 'error'>('idle');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [eGovLinks, setEGovLinks] = useState<{ mobile: string; business: string } | null>(null);

    // Trigger eGov Mobile QR generation automatically when switching to EDS tab
    const handleTabChange = (method: 'password' | 'eds') => {
        setAuthMethod(method);
        if (method === 'eds' && qrStep === 'idle' && !edsError) {
            handleEGovMobileLogin();
        }
    };

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
        setIsLoading(true);
        setEdsError('');
        setQrStep('init');

        try {
            // 1. Get nonce
            const { nonce } = await SigexService.getAuthNonce();

            // 2. Register a simple QR signing session using the Jasalmaty mock pattern
            const qrRes = await SigexService.registerQrSigning('Авторизация в PickPoint', {
                documentNameRu: 'Авторизация в PickPoint',
                signMethod: 'CMS_SIGN_ONLY'
            });

            // 3. Send the data to the session explicitly
            const base64Nonce = btoa(unescape(encodeURIComponent(nonce)));
            await SigexService.sendQrData(qrRes.operationId, base64Nonce, 'CMS_SIGN_ONLY');

            setQrCode(qrRes.qrCode);
            setEGovLinks({ mobile: qrRes.eGovMobileLaunchLink, business: qrRes.eGovBusinessLaunchLink });
            setQrStep('qr');

            // 7. Poll for completion
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

                        try {
                            // 7. Authenticate using the signature of the string containing the nonce
                            const authData = await SigexService.authenticate(nonce, signature);

                            console.log("Успешная ЭЦП авторизация, данные:", authData);
                            const certInfo = authData?.certInfo || authData; // Depending on if it's external or built-in validation
                            const iin = certInfo?.subjectInfo?.iin || certInfo?.iin || 'Неизвестен';
                            console.log("Вход выполнен пользователем с ИИН:", iin);

                            // Здесь мы определяем кто вошел по ИИН и отправляем на нужный дашборд
                            let mockEmail = 'eds_user@example.com';
                            let targetRoute = '/hr';

                            // Пример маппинга настоящих ИИН к ролям в системе (MVP):
                            // if (iin === '123456789012') { mockEmail = 'financier_user@example.com'; targetRoute = '/finance'; }
                            // else if (iin === '098765432109') { mockEmail = 'rf_user@example.com'; targetRoute = '/rf'; }

                            // Mock login for MVP
                            await login({ email: mockEmail, password: 'password123' });
                            navigate(targetRoute, { replace: true });
                        } catch (authErr: any) {
                            console.error("Auth error post-QR:", authErr);
                            setEdsError(authErr.message || "Ошибка проверки ЭЦП после подписания");
                            setQrStep('idle');
                        }
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
        } finally {
            setIsLoading(false);
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
                        {authMethod === 'eds' ? "Авторизация по ЭЦП" : "Вход в систему управления"}
                    </p>
                </div>

                <div className="flex rounded-lg bg-slate-100 p-1 mt-4">
                    <button
                        onClick={() => handleTabChange('password')}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${authMethod === 'password' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        По почте
                    </button>
                    <button
                        onClick={() => handleTabChange('eds')}
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
                    <div className="space-y-6 pt-2 animate-in fade-in duration-300 min-h-[300px] flex flex-col justify-center">
                        {edsError && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 border border-red-100 text-center mb-2">
                                {edsError}
                            </div>
                        )}

                        {qrStep === 'init' && (
                            <div className="space-y-4 py-8 text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-slate-400 mx-auto" />
                                <p className="text-slate-500 font-medium text-sm">Подготовка сессии eGov...</p>
                            </div>
                        )}

                        {qrStep === 'qr' && qrCode && (
                            <>
                                {/* DESKTOP LAYOUT */}
                                <div className="hidden sm:flex flex-col items-center space-y-6 w-full">
                                    <div className="space-y-2 text-center">
                                        <p className="font-semibold text-slate-800 text-lg">Код для входа</p>
                                        <p className="text-sm text-slate-500 px-4">
                                            Откройте приложение <strong>eGov Mobile</strong> на телефоне и отсканируйте этот QR-код
                                        </p>
                                    </div>

                                    <div className="mx-auto w-fit rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
                                        <img
                                            src={`data:image/png;base64,${qrCode}`}
                                            alt="eGov QR Code"
                                            className="h-48 w-48 object-contain"
                                        />
                                    </div>
                                </div>

                                {/* MOBILE LAYOUT */}
                                <div className="sm:hidden flex flex-col items-center space-y-6 w-full">
                                    <div className="space-y-2 text-center">
                                        <p className="font-semibold text-slate-800 text-lg">Авторизация по ЭЦП</p>
                                        <p className="text-sm text-slate-500 px-4">
                                            Нажмите кнопку ниже, чтобы подписать запрос в приложении eGov Mobile
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 px-4 pt-2 w-full">
                                        <a
                                            href={eGovLinks?.mobile}
                                            className="flex items-center justify-center w-full bg-[#1A1A1A] hover:bg-black text-white font-medium px-4 py-3.5 rounded-xl transition-colors shadow-sm"
                                        >
                                            <Smartphone className="mr-2 h-5 w-5 opacity-80" />
                                            Открыть eGov Mobile
                                        </a>
                                    </div>
                                </div>
                            </>
                        )}

                        {qrStep === 'success' && (
                            <div className="space-y-4 text-center py-8">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <CheckCircle className="h-10 w-10" />
                                </div>
                                <h4 className="text-xl font-bold text-emerald-700">Успешно!</h4>
                                <p className="text-slate-500">Входим в систему...</p>
                            </div>
                        )}

                        {(qrStep === 'idle' || qrStep === 'error' || edsError) && qrStep !== 'success' && qrStep !== 'init' && (
                            <div className="space-y-4 w-full">
                                <Button
                                    variant="outline"
                                    onClick={handleEGovMobileLogin}
                                    disabled={isLoading}
                                    className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 py-6"
                                >
                                    <Smartphone className="mr-2 h-5 w-5" />
                                    Сгенерировать QR код заново
                                </Button>
                            </div>
                        )}

                        {(qrStep === 'qr' || qrStep === 'idle' || qrStep === 'error' || edsError) && qrStep !== 'success' && qrStep !== 'init' && (
                            <div className="hidden sm:block w-full pt-4">
                                <div className="w-full flex items-center gap-4 pb-6">
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                    <span className="text-xs font-medium text-slate-400 uppercase">Или</span>
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                </div>

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

                                <div className="text-center mt-4">
                                    <p className="text-xs text-slate-500">
                                        Для входа с ПК убедитесь, что приложение NCALayer запущено.
                                    </p>
                                </div>
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

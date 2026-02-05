import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/layout/AuthContext";
import { Loader2, FileKey, Eye, EyeOff, Lock, Mail } from "lucide-react";
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

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login({ email, password });

            // Redirect based on role is handled by the protected route usually,
            // but here we might want to default to dashboard if no state.
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

    const handleEdsLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { nonce } = await SigexService.getAuthNonce();
            const ncalayer = new NCALayerClient();
            await ncalayer.connect();

            let signature;
            try {
                signature = await ncalayer.createCmsSignature(nonce);
            } catch (e) {
                console.error("NCALayer signing failed", e);
                setError("Ошибка подписи. Проверьте запуск NCALayer.");
                setIsLoading(false);
                return;
            }

            if (!signature) {
                setError("Подпись не получена.");
                setIsLoading(false);
                return;
            }

            await SigexService.authenticate(signature);
            // EDS login might need a special flow or token from backend
            // utilizing existing mock for now but user should be aware
            await login({ email: 'eds_user@example.com', password: 'password123' });
            navigate('/hr', { replace: true });
        } catch (error) {
            console.error("EDS Login failed", error);
            setError("Ошибка входа по ЭЦП");
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
                        Вход в систему управления
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
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
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
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
                        Войти
                    </Button>
                </form>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-100" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                        <span className="bg-white px-2 text-slate-400 font-bold">Или</span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    onClick={handleEdsLogin}
                    disabled={isLoading}
                    className="w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800"
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FileKey className="mr-2 h-4 w-4" />
                    )}
                    Войти с ЭЦП
                </Button>

                <p className="text-center text-xs font-medium text-slate-300 pt-2">
                    &copy; 2025 Alem Lab. Protected System.
                </p>
            </div>
        </div>
    );
}

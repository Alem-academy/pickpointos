import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, FileText, Calendar, User, RefreshCw } from 'lucide-react';
import { SigexSignModal } from '@/components/SigexSignModal';
import { SigexService } from '@/services/sigex';

interface SigningInfo {
    success: boolean;
    document: {
        id: string;
        type: string;
        status: string;
        sigex_document_id?: string | null;
    };
    employee: {
        name: string;
        iin: string;
    };
    expiresAt: string;
}

export function SignDocument() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [signingInfo, setSigningInfo] = useState<SigningInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showSignModal, setShowSignModal] = useState(false);
    const [recovering, setRecovering] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Токен не указан');
            setLoading(false);
            return;
        }

        loadSigningInfo();
    }, [token]);

    const loadSigningInfo = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/sign/${token}`);
            const data = await response.json();

            if (!response.ok) {
                // 403 with deactivated link usually means the document was already signed
                if (response.status === 403 && data.error?.includes('deactivated')) {
                    setError('Эта ссылка уже использована. Документ был подписан. Обратитесь к HR-менеджеру для проверки статуса.');
                    return;
                }
                throw new Error(data.error || 'Ошибка загрузки');
            }

            setSigningInfo(data);
        } catch (err: any) {
            setError(err.message || 'Не удалось загрузить информацию о документе');
        } finally {
            setLoading(false);
        }
    };

    const handleSign = () => {
        setShowSignModal(true);
    };

    const handleSignSuccess = () => {
        setShowSignModal(false);
        if (token) {
            try {
                sessionStorage.removeItem(`sigex-sign-op:${token}`);
            } catch {
                /* ignore */
            }
        }
        // Update local state to reflect signed status without re-fetching
        // (the link is now deactivated, so GET /api/sign/{token} would return 403)
        setSigningInfo(prev => prev ? {
            ...prev,
            document: { ...prev.document, status: 'signed' }
        } : null);
    };

    /** Если подпись в eGov прошла, а вкладка не дождалась опроса — подтянуть CMS и сохранить по токену ссылки */
    const tryRecoverFromSigex = async () => {
        if (!token) return;
        const operationId = (() => {
            try {
                return sessionStorage.getItem(`sigex-sign-op:${token}`);
            } catch {
                return null;
            }
        })();
        if (!operationId) {
            alert(
                'Сначала нажмите «Подписать через eGov» на этой странице, отсканируйте QR и подпишите в приложении. ' +
                    'Если вы уже закрыли окно с QR — откройте подписание снова.'
            );
            return;
        }
        setRecovering(true);
        try {
            const statusRes = await SigexService.checkQrStatus(operationId);
            const sig =
                statusRes.signatures?.[0] ||
                statusRes.documentsToSign
                    ?.map((d: { signature?: string; document?: { file?: { data?: string } } }) => d.signature || d.document?.file?.data)
                    .filter(Boolean)[0];
            if (!sig) {
                alert(
                    'Подпись ещё не видна в Sigex. Подождите 30–60 секунд после подписания в eGov и нажмите снова.'
                );
                return;
            }
            const res = await fetch(`/api/sign/${token}/submit-signature`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signature: sig,
                    sigex_operation_id: operationId,
                    sigex_document_id: signingInfo?.document.sigex_document_id || undefined
                })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error((data as { error?: string }).error || `Ошибка ${res.status}`);
            }
            try {
                sessionStorage.removeItem(`sigex-sign-op:${token}`);
            } catch {
                /* ignore */
            }
            await loadSigningInfo();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Не удалось завершить подписание';
            alert(msg);
        } finally {
            setRecovering(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-lg font-semibold text-slate-700">Загрузка документа...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Ошибка</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                        На главную
                    </button>
                </div>
            </div>
        );
    }

    if (!signingInfo) {
        return null;
    }

    const isExpired = new Date(signingInfo.expiresAt) < new Date();
    const isSigned = signingInfo.document.status === 'signed';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                        <FileText className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Подписание документа
                    </h1>
                    <p className="text-slate-600">
                        {(() => {
                            const typeMap: Record<string, string> = {
                                'contract': 'Трудовой договор',
                                'application': 'Заявление на прием',
                                'order_hiring': 'Приказ о приеме',
                                '13_zayavlenie-o-prieme-na-rabotu': 'Заявление на прием',
                                '14_prikaz-o-prieme-na-rabotu': 'Приказ о приеме',
                                '15_trudovoy-dogovor': 'Трудовой договор',
                                'vacation_application': 'Заявление на отпуск',
                                'vacation_order': 'Приказ на отпуск',
                                'termination_order': 'Приказ об увольнении',
                                'addendum': 'Доп. соглашение',
                            };
                            return typeMap[signingInfo.document.type] || 'Документ';
                        })()}
                    </p>
                </div>

                {/* Document Info Card */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Информация о документе</h2>
                    
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50">
                            <User className="h-6 w-6 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-slate-500">Сотрудник</p>
                                <p className="text-lg font-semibold text-slate-900">{signingInfo.employee.name}</p>
                                <p className="text-sm text-slate-600">ИИН: {signingInfo.employee.iin}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50">
                            <Calendar className="h-6 w-6 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-slate-500">Срок действия ссылки</p>
                                <p className={`text-lg font-semibold ${isExpired ? 'text-red-600' : 'text-slate-900'}`}>
                                    {new Date(signingInfo.expiresAt).toLocaleDateString('ru-RU', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                                {isExpired && (
                                    <p className="text-sm text-red-600 mt-1">⚠️ Срок действия ссылки истек</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50">
                            <div className={`h-6 w-6 mt-0.5 ${isSigned ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {isSigned ? <CheckCircle className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-500">Статус</p>
                                <p className={`text-lg font-semibold ${isSigned ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {isSigned ? '✓ Подписан' : '⏳ Ожидает подписания'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                {!isSigned && !isExpired && (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <p className="text-slate-600 mb-6">
                            Выберите способ: <strong>eGov Mobile</strong> (QR-код) или <strong>NCALayer</strong> на компьютере
                            (файловый ключ ЭЦП RSA/GOST).
                        </p>
                        <button
                            onClick={handleSign}
                            className="w-full max-w-md mx-auto bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors shadow-lg"
                        >
                            Подписать документ
                        </button>
                        <p className="text-sm text-slate-500 mt-4">
                            В окне можно выбрать QR для телефона или подпись через NCALayer на ПК
                        </p>
                        <button
                            type="button"
                            disabled={recovering}
                            onClick={tryRecoverFromSigex}
                            className="mt-6 flex w-full max-w-md mx-auto items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                            {recovering ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Уже подписал в eGov — проверить и сохранить
                        </button>
                        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                            Если в приложении подпись прошла успешно, а страница не обновилась, нажмите сюда (нужен тот же браузер, где открывали QR).
                        </p>
                    </div>
                )}

                {/* Already Signed */}
                {isSigned && (
                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-8 text-center">
                        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-emerald-900 mb-2">
                            Документ успешно подписан!
                        </h2>
                        <p className="text-emerald-700 mb-6">
                            Подпись была получена и сохранена в системе
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                        >
                            На главную
                        </button>
                    </div>
                )}

                {/* Expired */}
                {isExpired && !isSigned && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-900 mb-2">
                            Срок действия ссылки истек
                        </h2>
                        <p className="text-red-700 mb-6">
                            Пожалуйста, запросите новую ссылку у HR менеджера
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        >
                            На главную
                        </button>
                    </div>
                )}
            </div>

            {/* Sign Modal */}
            {showSignModal && token && (
                <SigexSignModal
                    documentId={signingInfo.document.id}
                    documentTitle="Документ на подпись"
                    onClose={() => setShowSignModal(false)}
                    onSuccess={handleSignSuccess}
                    preRegisteredDocumentId={signingInfo.document.sigex_document_id || undefined}
                    publicSigningToken={token}
                />
            )}
        </div>
    );
}

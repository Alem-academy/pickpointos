import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, FileText, Calendar, User } from 'lucide-react';
import { SigexSignModal } from '@/components/SigexSignModal';

interface SigningInfo {
    success: boolean;
    document: {
        id: string;
        type: string;
        status: string;
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
        // Refresh info after signing
        setTimeout(() => {
            loadSigningInfo();
        }, 2000);
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
                        {signingInfo.document.type === 'contract' ? 'Трудовой договор' : 
                         signingInfo.document.type === 'application' ? 'Заявление на прием' :
                         signingInfo.document.type === 'order_hiring' ? 'Приказ о приеме' :
                         'Документ'}
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
                            Для подписания документа используйте приложение <strong>eGov Mobile</strong>
                        </p>
                        <button
                            onClick={handleSign}
                            className="w-full max-w-md mx-auto bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors shadow-lg"
                        >
                            📱 Подписать через eGov
                        </button>
                        <p className="text-sm text-slate-500 mt-4">
                            После нажатия кнопки откроется QR-код для сканирования
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
            {showSignModal && (
                <SigexSignModal
                    documentId={signingInfo.document.id}
                    documentTitle="Документ на подпись"
                    onClose={() => setShowSignModal(false)}
                    onSuccess={handleSignSuccess}
                />
            )}
        </div>
    );
}

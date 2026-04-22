import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, FileText, Download, Loader2, AlertTriangle, User, Building2 } from 'lucide-react';

interface VerificationData {
    id: string;
    documentType: string;
    status: string;
    createdAt: string;
    employeeSignedAt: string | null;
    employerSignedAt: string | null;
    isFullySigned: boolean;
    hasSignatureSheet: boolean;
    employeeName: string;
    employeeIin: string;
    employerName: string;
    employerBin: string;
    signatureSheetUrl: string | null;
    finalPdfUrl: string | null;
}

export default function VerifyDocument() {
    const { documentId } = useParams<{ documentId: string }>();
    const [data, setData] = useState<VerificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!documentId) return;
        fetch(`/api/documents/${documentId}/verify`)
            .then(r => {
                if (!r.ok) throw new Error('Документ не найден');
                return r.json();
            })
            .then(setData)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [documentId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-slate-600">Проверка документа...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Документ не найден</h1>
                    <p className="text-slate-600">{error || 'Проверьте правильность ссылки или UUID документа'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Проверка подлинности</h1>
                            <p className="text-sm text-slate-500">Электронного кадрового документа</p>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Тип документа:</span>
                            <span className="font-medium text-slate-900">{data.documentType}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">UUID:</span>
                            <span className="font-mono text-xs text-slate-500">{data.id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Статус:</span>
                            {data.isFullySigned ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                                    <CheckCircle className="h-4 w-4" />
                                    Подписан обеими сторонами
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                                    <AlertTriangle className="h-4 w-4" />
                                    Не полностью подписан
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {/* Employer */}
                    <div className="bg-white rounded-xl shadow-lg p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <h2 className="font-semibold text-slate-900">Работодатель</h2>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><span className="text-slate-500">Наименование:</span> {data.employerName || '—'}</p>
                            <p><span className="text-slate-500">БИН:</span> {data.employerBin || '—'}</p>
                            <p className="flex items-center gap-2">
                                <span className="text-slate-500">Подпись:</span>
                                {data.employerSignedAt ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        {new Date(data.employerSignedAt).toLocaleString('ru-RU')}
                                    </span>
                                ) : (
                                    <span className="text-amber-600">Ожидается</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Employee */}
                    <div className="bg-white rounded-xl shadow-lg p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="h-5 w-5 text-purple-600" />
                            <h2 className="font-semibold text-slate-900">Работник</h2>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><span className="text-slate-500">ФИО:</span> {data.employeeName || '—'}</p>
                            <p><span className="text-slate-500">ИИН:</span> {data.employeeIin || '—'}</p>
                            <p className="flex items-center gap-2">
                                <span className="text-slate-500">Подпись:</span>
                                {data.employeeSignedAt ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        {new Date(data.employeeSignedAt).toLocaleString('ru-RU')}
                                    </span>
                                ) : (
                                    <span className="text-amber-600">Ожидается</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Downloads */}
                {data.isFullySigned && (
                    <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
                        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Документы
                        </h2>
                        <div className="space-y-2">
                            {data.finalPdfUrl && (
                                <a
                                    href={data.finalPdfUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                >
                                    <Download className="h-5 w-5 text-emerald-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-emerald-900">Финальный PDF</p>
                                        <p className="text-xs text-emerald-700">Оригинальный документ + лист подписей</p>
                                    </div>
                                </a>
                            )}
                            {data.signatureSheetUrl && data.signatureSheetUrl !== data.finalPdfUrl && (
                                <a
                                    href={data.signatureSheetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                    <Download className="h-5 w-5 text-slate-500" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">Лист подписей</p>
                                        <p className="text-xs text-slate-500">Отдельный документ с данными ЭЦП</p>
                                    </div>
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Legal notice */}
                <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-600 text-center">
                    <p className="mb-1">
                        Согласно п. 1 ст. 7 ЗРК «Об электронном документе и электронной цифровой подписи»
                        от 7 января 2003 года № 370-II,
                    </p>
                    <p className="font-medium">
                        настоящий документ равнозначен документу на бумажном носителе.
                    </p>
                </div>
            </div>
        </div>
    );
}

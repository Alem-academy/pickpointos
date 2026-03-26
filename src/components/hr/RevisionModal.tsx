import { useState } from 'react';
import { X, FileWarning, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RevisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (comment: string) => void;
    employeeName: string;
}

export function RevisionModal({ isOpen, onClose, onConfirm, employeeName }: RevisionModalProps) {
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!comment.trim()) {
            setError('Пожалуйста, укажите что нужно исправить');
            return;
        }
        onConfirm(comment);
        setComment('');
        setError('');
    };

    const handleClose = () => {
        setComment('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div 
                className="relative w-full max-w-lg rounded-xl border bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                            <FileWarning className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">На доработку</h2>
                            <p className="text-xs text-slate-500">Сотрудник: {employeeName}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    {/* Warning Box */}
                    <div className="mb-4 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold text-amber-900 mb-1">Важно!</p>
                            <p className="text-amber-700">
                                Сотрудник получит уведомление с вашим комментарием. 
                                Укажите конкретно, какие документы нужно исправить или загрузить заново.
                            </p>
                        </div>
                    </div>

                    {/* Comment Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Комментарий <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => {
                                setComment(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="Например: Загрузите справку о несудимости в хорошем качестве. Срок действия справки истек..."
                            className={cn(
                                "w-full min-h-[150px] rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors",
                                error 
                                    ? "border-red-300 focus:ring-red-200" 
                                    : "border-slate-200 focus:ring-orange-200"
                            )}
                            autoFocus
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Character Counter */}
                    <div className="mt-2 flex justify-between items-center text-xs text-slate-500">
                        <span>Минимум 10 символов</span>
                        <span>{comment.length} символов</span>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-6 py-4 rounded-b-xl">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="font-medium"
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!comment.trim() || comment.length < 10}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileWarning className="h-4 w-4 mr-2" />
                        Отправить на доработку
                    </Button>
                </div>
            </div>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { X, Download, Copy, Printer, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    content: string;
    documentType?: string;
}

export function DocumentPreviewModal({
    isOpen,
    onClose,
    title = 'Просмотр документа',
    content,
    documentType
}: DocumentPreviewModalProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleDownload = async () => {
        try {
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${documentType || 'document'}_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download:', err);
            alert('Ошибка при скачивании документа');
        }
    };

    const handleCopy = async () => {
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const text = tempDiv.textContent || tempDiv.innerText || '';
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Ошибка при копировании');
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(content);
            printWindow.document.close();
            printWindow.print();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                className={cn(
                    "relative flex w-full flex-col rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200",
                    isFullscreen ? "max-h-screen h-screen w-screen m-0 rounded-none" : "max-h-[90vh] w-full max-w-5xl mx-4"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-white/10 p-2">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 id="modal-title" className="text-lg font-semibold text-white">
                                {title}
                            </h2>
                            {documentType && (
                                <p className="text-xs text-slate-400">
                                    Тип: {documentType}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="text-white hover:bg-white/10"
                            aria-label={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
                        >
                            {isFullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-white hover:bg-white/10"
                            aria-label="Закрыть"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-3">
                    <div className="text-sm text-slate-600">
                        Документ готов к просмотру
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            disabled={copied}
                            className="gap-2"
                        >
                            <Copy className="h-4 w-4" />
                            {copied ? 'Скопировано' : 'Копировать'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Скачать
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="gap-2"
                        >
                            <Printer className="h-4 w-4" />
                            Печать
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-slate-100">
                    <div 
                        className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-sm"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t bg-slate-50 px-6 py-4 rounded-b-2xl">
                    <Button variant="outline" onClick={onClose}>
                        Закрыть
                    </Button>
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';


interface Template {
    id: string;
    type: string;
    version: string;
    name: string;
    description: string;
    language: string;
    is_active: boolean;
    is_default: boolean;
    variables: string[];
    created_at: string;
    updated_at: string;
}

interface TemplateType {
    type: string;
    label: string;
    template_count: number;
}

const Templates: React.FC = () => {
    // const navigate = useNavigate(); // Unused
    const queryClient = useQueryClient();
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('ru');
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [formData, setFormData] = useState({
        type: 'contract',
        version: '1.0',
        name: '',
        description: '',
        content: '',
        language: 'ru',
        is_default: false,
    });

    // Fetch templates
    const { data: templates = [] } = useQuery({
        queryKey: ['templates', selectedType, selectedLanguage],
        queryFn: async () => {
            const params: any = { language: selectedLanguage };
            if (selectedType !== 'all') params.type = selectedType;
            const res = await axios.get('/api/templates', { params });
            return res.data as Template[];
        }
    });

    // Fetch template types
    const { data: templateTypes = [] } = useQuery({
        queryKey: ['templateTypes'],
        queryFn: async () => {
            const res = await axios.get('/api/templates/types');
            return res.data as TemplateType[];
        }
    });

    // Create/Update mutation
    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingTemplate) {
                return axios.put(`/api/templates/${editingTemplate.id}`, data);
            }
            return axios.post('/api/templates', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            resetForm();
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return axios.delete(`/api/templates/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        }
    });

    // Preview mutation
    const previewMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            return axios.post(`/api/templates/${id}/preview`, { data });
        },
        onSuccess: (response) => {
            setPreviewContent(response.data.html);
            setShowPreview(true);
        }
    });

    const resetForm = () => {
        setEditingTemplate(null);
        setFormData({
            type: 'contract',
            version: '1.0',
            name: '',
            description: '',
            content: '',
            language: 'ru',
            is_default: false,
        });
    };

    const handleEdit = (template: Template) => {
        setEditingTemplate(template);
        setFormData({
            type: template.type,
            version: template.version,
            name: template.name,
            description: template.description || '',
            content: '', // Don't load full content initially
            language: template.language,
            is_default: template.is_default,
        });
        // Fetch full template with content
        axios.get(`/api/templates/${template.id}`).then(res => {
            setFormData(prev => ({ ...prev, content: res.data.content }));
        });
    };

    const handlePreview = () => {
        if (editingTemplate) {
            const sampleData: any = {};
            editingTemplate.variables?.forEach((v: string) => {
                sampleData[v] = `{{${v}}}`;
            });
            previewMutation.mutate({ id: editingTemplate.id, data: sampleData });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const typeLabels: Record<string, string> = {
        'contract': 'Трудовой договор',
        'order_hiring': 'Приказ о приеме',
        'vacation_application': 'Заявление на отпуск',
        'vacation_order': 'Приказ на отпуск',
        'termination_order': 'Приказ об увольнении',
        'employment_certificate': 'Справка с места работы'
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Шаблоны документов</h1>
                <p className="text-gray-600 mt-1">Управление шаблонами документов: создание, редактирование, версионность</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Тип документа</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="all">Все типы</option>
                            {templateTypes.map((t) => (
                                <option key={t.type} value={t.type}>{t.label} ({t.template_count})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Язык</label>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="ru">Русский</option>
                            <option value="kz">Қазақша</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={resetForm}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                        >
                            + Новый шаблон
                        </button>
                    </div>
                </div>
            </div>

            {/* Templates List */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Версия</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Язык</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {templates.map((template) => (
                            <tr key={template.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                                        {template.description && (
                                            <div className="text-sm text-gray-500">{template.description}</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                        {typeLabels[template.type] || template.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{template.version}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {template.language === 'ru' ? 'Русский' : 'Қазақша'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {template.is_active && (
                                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                                Активен
                                            </span>
                                        )}
                                        {template.is_default && (
                                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                                По умолчанию
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => deleteMutation.mutate(template.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {templates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        Шаблоны не найдены
                    </div>
                )}
            </div>

            {/* Edit/Create Form Modal */}
            {editingTemplate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">
                                {editingTemplate ? 'Редактирование шаблона' : 'Новый шаблон'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            disabled={!!editingTemplate}
                                        >
                                            {templateTypes.map((t) => (
                                                <option key={t.type} value={t.type}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Версия</label>
                                        <input
                                            type="text"
                                            value={formData.version}
                                            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="1.0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        rows={2}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Язык</label>
                                        <select
                                            value={formData.language}
                                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="ru">Русский</option>
                                            <option value="kz">Қазақша</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_default}
                                                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">По умолчанию</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Содержимое (HTML с переменными {`{{variable}}`})
                                    </label>
                                    <textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                                        rows={20}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handlePreview}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
                                    >
                                        Предпросмотр
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                                    >
                                        Сохранить
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">Предпросмотр шаблона</h2>
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <iframe
                                    srcDoc={previewContent}
                                    className="w-full h-[600px] border-0"
                                    title="Preview"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(false)}
                                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Templates;

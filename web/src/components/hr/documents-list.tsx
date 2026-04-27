"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type Document } from "@/services/api";
import { FileText, Loader2, PenTool, Eye, CheckCircle, Plus } from "lucide-react";
import { SigexSignModal } from "@/components/sigex-sign-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DocumentParamsModal,
  type DocumentType,
} from "@/components/hr/document-params-modal";

interface DocumentsListProps {
  employeeId: string;
  employeeStatus: string;
  onStatusChange?: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  contract: "Трудовой договор",
  order_hiring: "Приказ о приеме",
  application: "Заявление на прием",
  vacation_application: "Заявление на отпуск",
  vacation_order: "Приказ на отпуск",
  termination_order: "Приказ об увольнении",
  employment_certificate: "Справка с места работы",
  addendum: "Доп. соглашение",
  id_main: "Удостоверение личности (лиц.)",
  id_register: "Удостоверение личности (обор.)",
  id_scan: "Скан документа",
  photo: "Фотография 3×4",
  cert_075: "Медсправка 075/у",
  cert_tb: "Справка тубдиспансер",
  bank_details: "Справка IBAN",
  address_cert: "Адресная справка",
  other: "Другой документ",
  "01_zayavlenie-o-vyhode-s-dekreta": "Заявление о выходе с декрета",
  "02_zayavlenie-na-otpusk-po-uhodu-za-rebenkom": "Заявление на отпуск по уходу",
  "03_zayavlenie-ob-izmenenii-personalnyh-dannyh": "Заявление об изменении данных",
  "04_prikaz-ob-otpuske-po-beremennosti-i-rodam": "Приказ об отпуске по беременности",
  "05_prikaz-o-prodlenii-otpuska-po-beremennosti": "Приказ о продлении отпуска",
  "06_prikaz-o-vnesenii-izmeneniy-v-fio": "Приказ об изменении ФИО",
  "07_prikaz-o-vyhode-iz-otpuska-po-uhodu": "Приказ о выходе из отпуска",
  "08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu": "Приказ об отпуске без сохранения ЗП",
  "09_zayavlenie-na-otpusk-po-beremennosti": "Заявление на отпуск по беременности",
  "10_zayavlenie-na-prodlenie-otpuska-po-beremennosti": "Заявление на продление отпуска",
  "11_soglashenie-o-rastorzhenii-trudovogo-dogovora": "Соглашение о расторжении",
  "12_dop-soglashenie-ob-izmenenii-familii": "Доп. согл. об изменении фамилии",
};

export function DocumentsList({ employeeId, onStatusChange }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [signingDoc, setSigningDoc] = useState<Document | null>(null);
  const [paramsModalOpen, setParamsModalOpen] = useState(false);
  const [pendingDocType, setPendingDocType] = useState<DocumentType | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await api.getDocuments(employeeId);
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleGenerate = async (
    type: string,
    bypassModal = false,
    params?: any
  ) => {
    // Show params modal for documents that need additional data
    if (!bypassModal && !params) {
      const needsParams: string[] = [
        "vacation_order",
        "vacation_application",
        "termination_order",
        "employment_certificate",
        "addendum",
        "01_zayavlenie-o-vyhode-s-dekreta",
        "02_zayavlenie-na-otpusk-po-uhodu-za-rebenkom",
        "03_zayavlenie-ob-izmenenii-personalnyh-dannyh",
        "04_prikaz-ob-otpuske-po-beremennosti-i-rodam",
        "05_prikaz-o-prodlenii-otpuska-po-beremennosti",
        "06_prikaz-o-vnesenii-izmeneniy-v-fio",
        "07_prikaz-o-vyhode-iz-otpuska-po-uhodu",
        "08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu",
        "09_zayavlenie-na-otpusk-po-beremennosti",
        "10_zayavlenie-na-prodlenie-otpuska-po-beremennosti",
        "11_soglashenie-o-rastorzhenii-trudovogo-dogovora",
        "12_dop-soglashenie-ob-izmenenii-familii",
      ];
      if (needsParams.includes(type)) {
        setPendingDocType(type as DocumentType);
        setParamsModalOpen(true);
        return;
      }
    }

    setIsGenerating(type);
    try {
      const { content } = await api.generateDocument(employeeId, type, params);
      setPreviewContent(content);
      await loadDocuments();
      toast.success("Документ успешно сформирован");
    } catch (err) {
      console.error("Failed to generate document:", err);
      toast.error("Ошибка при генерации документа");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleParamsConfirm = async (params: any) => {
    if (pendingDocType) {
      await handleGenerate(pendingDocType, false, params);
      setParamsModalOpen(false);
      setPendingDocType(null);
    }
  };

  const handleSignSuccess = async () => {
    await loadDocuments();
    if (onStatusChange) onStatusChange();
    toast.success("Документ успешно подписан");
  };

  if (isLoading)
    return (
      <div className="py-4 text-center text-muted-foreground">
        Загрузка документов...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Документы сотрудника</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleGenerate("contract")}
            disabled={!!isGenerating}
            variant="default"
            size="sm"
            className="gap-2"
          >
            {isGenerating === "contract" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Трудовой договор
          </Button>
          <Button
            onClick={() => handleGenerate("order_hiring")}
            disabled={!!isGenerating}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isGenerating === "order_hiring" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Приказ о приеме
          </Button>
          <Button
            onClick={() => handleGenerate("addendum")}
            disabled={!!isGenerating}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isGenerating === "addendum" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Доп. соглашение
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Нет документов. Нажмите "Сформировать ТД" для начала процесса
            оформления.
          </div>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded p-2 ${
                    doc.status === "signed"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div>
                    <p className="font-medium">
                      {DOCUMENT_TYPE_LABELS[doc.type] || "Документ"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Создан{" "}
                      {new Date(doc.createdAt).toLocaleDateString("ru-RU")} •
                      Статус:{" "}
                      <span className="font-medium">
                        {doc.status === "signed" ? "Подписан" : "Черновик"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    toast.info(
                      "Просмотр (HTML) пока не реализован в модалке, но контент генерируется!"
                    )
                  }
                  className="gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Просмотр
                </Button>

                {doc.status === "draft" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSigningDoc(doc)}
                    className="gap-1 text-primary bg-primary/10 hover:bg-primary/20"
                  >
                    <PenTool className="h-4 w-4" />
                    Подписать (eGov)
                  </Button>
                )}

                {doc.status === "signed" && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Подписано
                  </Badge>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {previewContent && (
        <div className="mt-6 rounded-xl border bg-white p-8 shadow-sm">
          <h4 className="mb-4 font-semibold text-muted-foreground">
            Предпросмотр последнего документа:
          </h4>
          <div
            className="prose max-w-none rounded border p-8 text-sm"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </div>
      )}

      {signingDoc && (
        <SigexSignModal
          documentId={signingDoc.id}
          documentTitle={
            DOCUMENT_TYPE_LABELS[signingDoc.type] || "Документ"
          }
          onClose={() => setSigningDoc(null)}
          onSuccess={handleSignSuccess}
        />
      )}

      <DocumentParamsModal
        isOpen={paramsModalOpen}
        documentType={pendingDocType}
        onClose={() => {
          setParamsModalOpen(false);
          setPendingDocType(null);
        }}
        onConfirm={handleParamsConfirm}
      />
    </div>
  );
}

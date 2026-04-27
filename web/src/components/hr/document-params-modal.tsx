"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/services/api";
import { Loader2 } from "lucide-react";

export type DocumentType = string;

interface SchemaVariable {
  type: "string" | "date" | "number" | "boolean" | "select";
  description: string;
  required?: boolean;
  options?: string[];
}

interface TemplateSchema {
  templateName: string;
  fileName: string;
  type: string;
  required: string[];
  variables: Record<string, SchemaVariable>;
}

interface DocumentParamsModalProps {
  isOpen: boolean;
  documentType: DocumentType | null;
  onClose: () => void;
  onConfirm: (data: any) => void;
}

const LEGACY_FIELDS: Record<string, Record<string, any>> = {
  vacation_order: {
    vacationDays: 14,
    vacationStart: "",
    vacationEnd: "",
  },
  vacation_application: {
    vacationDays: 14,
    vacationStart: "",
    vacationEnd: "",
  },
  termination_order: {
    terminationDate: "",
    terminationReason: "по собственному желанию",
    contractNumber: "",
    contractDate: "",
  },
  employment_certificate: {
    salary: "85000",
  },
  addendum: {
    contractNumber: "",
    contractDate: "",
    changeTopic: "",
  },
};

export function DocumentParamsModal({
  isOpen,
  documentType,
  onClose,
  onConfirm,
}: DocumentParamsModalProps) {
  const [schema, setSchema] = useState<TemplateSchema | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !documentType) return;

    // Legacy hardcoded types — keep existing behavior
    if (LEGACY_FIELDS[documentType]) {
      setSchema(null);
      setParams({ ...LEGACY_FIELDS[documentType] });
      return;
    }

    setIsLoading(true);
    api
      .getTemplateSchema(documentType)
      .then((data) => {
        setSchema(data);
        const defaults: Record<string, any> = {};
        Object.entries(data.variables || {}).forEach(([key, variable]) => {
          if (variable.type === "number") defaults[key] = 0;
          else if (variable.type === "boolean") defaults[key] = false;
          else if (variable.type === "select" && variable.options)
            defaults[key] = variable.options[0] || "";
          else defaults[key] = "";
        });
        setParams(defaults);
      })
      .catch((err) => {
        console.error("Failed to load template schema:", err);
        setSchema(null);
        setParams({});
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, documentType]);

  if (!isOpen || !documentType) return null;

  const handleSubmit = () => {
    if (schema) {
      // Dynamic schema validation
      const missing = schema.required.filter(
        (field) =>
          params[field] === undefined ||
          params[field] === null ||
          params[field] === ""
      );
      if (missing.length > 0) {
        alert(
          `Заполните обязательные поля: ${missing
            .map((f) => schema.variables[f]?.description || f)
            .join(", ")}`
        );
        return;
      }
      onConfirm(params);
      return;
    }

    // Legacy submission logic
    switch (documentType) {
      case "vacation_order":
      case "vacation_application":
        if (!params.vacationStart || !params.vacationEnd) {
          alert("Укажите даты отпуска");
          return;
        }
        onConfirm(params);
        break;
      case "termination_order":
        if (!params.terminationDate) {
          alert("Укажите дату увольнения");
          return;
        }
        onConfirm(params);
        break;
      case "employment_certificate":
        onConfirm(params);
        break;
      case "addendum":
        if (!params.contractNumber || !params.contractDate) {
          alert("Укажите номер и дату договора");
          return;
        }
        onConfirm(params);
        break;
      default:
        onConfirm(params);
    }
  };

  const getTitle = () => {
    if (schema) return schema.templateName;
    switch (documentType) {
      case "vacation_order":
        return "📄 Приказ на отпуск";
      case "vacation_application":
        return "✉️ Заявление на отпуск";
      case "termination_order":
        return "📄 Приказ об увольнении";
      case "employment_certificate":
        return "📋 Справка с места работы";
      case "addendum":
        return "📄 Дополнительное соглашение";
      default:
        return "📄 Параметры документа";
    }
  };

  const renderDynamicFields = () => {
    if (!schema) return null;
    return Object.entries(schema.variables).map(([key, variable]) => {
      const isRequired = schema.required.includes(key);
      return (
        <div key={key} className="space-y-2">
          <Label>
            {variable.description}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {variable.type === "date" ? (
            <Input
              type="date"
              value={params[key] || ""}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, [key]: e.target.value }))
              }
            />
          ) : variable.type === "number" ? (
            <Input
              type="number"
              value={params[key] || ""}
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  [key]:
                    e.target.value === ""
                      ? ""
                      : parseFloat(e.target.value),
                }))
              }
            />
          ) : variable.type === "select" && variable.options ? (
            <Select
              value={params[key] || ""}
              onValueChange={(value) =>
                setParams((prev) => ({ ...prev, [key]: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {variable.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="text"
              value={params[key] || ""}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, [key]: e.target.value }))
              }
              placeholder={variable.description}
            />
          )}
        </div>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : schema ? (
            renderDynamicFields()
          ) : (
            <>
              {/* Legacy fields */}
              {(documentType === "vacation_order" ||
                documentType === "vacation_application") && (
                <>
                  <div className="space-y-2">
                    <Label>Дней отпуска</Label>
                    <Input
                      type="number"
                      value={params.vacationDays}
                      onChange={(e) =>
                        setParams({
                          ...params,
                          vacationDays: parseInt(e.target.value) || 14,
                        })
                      }
                      min={14}
                      max={30}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Дата начала</Label>
                      <Input
                        type="date"
                        value={params.vacationStart}
                        onChange={(e) =>
                          setParams({
                            ...params,
                            vacationStart: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Дата окончания</Label>
                      <Input
                        type="date"
                        value={params.vacationEnd}
                        onChange={(e) =>
                          setParams({
                            ...params,
                            vacationEnd: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {documentType === "termination_order" && (
                <>
                  <div className="space-y-2">
                    <Label>Дата увольнения</Label>
                    <Input
                      type="date"
                      value={params.terminationDate}
                      onChange={(e) =>
                        setParams({
                          ...params,
                          terminationDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Причина</Label>
                    <Select
                      value={params.terminationReason}
                      onValueChange={(value) =>
                        setParams({
                          ...params,
                          terminationReason: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="по собственному желанию">
                          По собственному желанию
                        </SelectItem>
                        <SelectItem value="по соглашению сторон">
                          По соглашению сторон
                        </SelectItem>
                        <SelectItem value="в связи с переходом на другую работу">
                          В связи с переходом на другую работу
                        </SelectItem>
                        <SelectItem value="в связи с сокращением штата">
                          В связи с сокращением штата
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>№ Договора</Label>
                      <Input
                        value={params.contractNumber}
                        onChange={(e) =>
                          setParams({
                            ...params,
                            contractNumber: e.target.value,
                          })
                        }
                        placeholder="ТД-001/26"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Дата договора</Label>
                      <Input
                        type="date"
                        value={params.contractDate}
                        onChange={(e) =>
                          setParams({
                            ...params,
                            contractDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {documentType === "employment_certificate" && (
                <div className="space-y-2">
                  <Label>Зарплата (₸)</Label>
                  <Input
                    type="number"
                    value={params.salary}
                    onChange={(e) =>
                      setParams({ ...params, salary: e.target.value })
                    }
                    placeholder="85000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Укажите среднюю месячную зарплату
                  </p>
                </div>
              )}

              {documentType === "addendum" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>№ Договора</Label>
                      <Input
                        value={params.contractNumber}
                        onChange={(e) =>
                          setParams({
                            ...params,
                            contractNumber: e.target.value,
                          })
                        }
                        placeholder="ТД-001/26"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Дата договора</Label>
                      <Input
                        type="date"
                        value={params.contractDate}
                        onChange={(e) =>
                          setParams({
                            ...params,
                            contractDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Тема изменений</Label>
                    <Input
                      value={params.changeTopic}
                      onChange={(e) =>
                        setParams({ ...params, changeTopic: e.target.value })
                      }
                      placeholder="Изменение адреса ПВЗ, должности и т.д."
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            Сформировать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
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

export type DocumentType =
  | "vacation_order"
  | "vacation_application"
  | "termination_order"
  | "employment_certificate"
  | "addendum";

interface VacationData {
  vacationDays: number;
  vacationStart: string;
  vacationEnd: string;
}

interface TerminationData {
  terminationDate: string;
  terminationReason: string;
  contractNumber: string;
  contractDate: string;
}

interface CertificateData {
  salary: string;
}

interface AddendumData {
  contractNumber: string;
  contractDate: string;
  changeTopic: string;
}

interface DocumentParamsModalProps {
  isOpen: boolean;
  documentType: DocumentType | null;
  onClose: () => void;
  onConfirm: (data: any) => void;
}

export function DocumentParamsModal({
  isOpen,
  documentType,
  onClose,
  onConfirm,
}: DocumentParamsModalProps) {
  const [vacationData, setVacationData] = useState<VacationData>({
    vacationDays: 14,
    vacationStart: "",
    vacationEnd: "",
  });

  const [terminationData, setTerminationData] = useState<TerminationData>({
    terminationDate: "",
    terminationReason: "по собственному желанию",
    contractNumber: "",
    contractDate: "",
  });

  const [certificateData, setCertificateData] = useState<CertificateData>({
    salary: "85000",
  });

  const [addendumData, setAddendumData] = useState<AddendumData>({
    contractNumber: "",
    contractDate: "",
    changeTopic: "",
  });

  if (!isOpen || !documentType) return null;

  const handleSubmit = () => {
    switch (documentType) {
      case "vacation_order":
      case "vacation_application":
        if (!vacationData.vacationStart || !vacationData.vacationEnd) {
          alert("Укажите даты отпуска");
          return;
        }
        onConfirm(vacationData);
        break;

      case "termination_order":
        if (!terminationData.terminationDate) {
          alert("Укажите дату увольнения");
          return;
        }
        onConfirm(terminationData);
        break;

      case "employment_certificate":
        onConfirm(certificateData);
        break;

      case "addendum":
        if (!addendumData.contractNumber || !addendumData.contractDate) {
          alert("Укажите номер и дату договора");
          return;
        }
        onConfirm(addendumData);
        break;
    }
  };

  const getTitle = () => {
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
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {(documentType === "vacation_order" ||
            documentType === "vacation_application") && (
            <>
              <div className="space-y-2">
                <Label>Дней отпуска</Label>
                <Input
                  type="number"
                  value={vacationData.vacationDays}
                  onChange={(e) =>
                    setVacationData({
                      ...vacationData,
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
                    value={vacationData.vacationStart}
                    onChange={(e) =>
                      setVacationData({
                        ...vacationData,
                        vacationStart: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дата окончания</Label>
                  <Input
                    type="date"
                    value={vacationData.vacationEnd}
                    onChange={(e) =>
                      setVacationData({
                        ...vacationData,
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
                  value={terminationData.terminationDate}
                  onChange={(e) =>
                    setTerminationData({
                      ...terminationData,
                      terminationDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Причина</Label>
                <Select
                  value={terminationData.terminationReason}
                  onValueChange={(value) =>
                    setTerminationData({
                      ...terminationData,
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
                    value={terminationData.contractNumber}
                    onChange={(e) =>
                      setTerminationData({
                        ...terminationData,
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
                    value={terminationData.contractDate}
                    onChange={(e) =>
                      setTerminationData({
                        ...terminationData,
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
                value={certificateData.salary}
                onChange={(e) =>
                  setCertificateData({
                    ...certificateData,
                    salary: e.target.value,
                  })
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
                    value={addendumData.contractNumber}
                    onChange={(e) =>
                      setAddendumData({
                        ...addendumData,
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
                    value={addendumData.contractDate}
                    onChange={(e) =>
                      setAddendumData({
                        ...addendumData,
                        contractDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Тема изменений</Label>
                <Input
                  value={addendumData.changeTopic}
                  onChange={(e) =>
                    setAddendumData({
                      ...addendumData,
                      changeTopic: e.target.value,
                    })
                  }
                  placeholder="Изменение адреса ПВЗ, должности и т.д."
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>Сформировать</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

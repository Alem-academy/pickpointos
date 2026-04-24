"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, type Employee, type PVZ } from '@/services/api';
import { AddEmployeeModal } from '@/components/hr/add-employee-modal';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Phone } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function EmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [pvzList, setPvzList] = useState<PVZ[]>([]);
    const [selectedPvz, setSelectedPvz] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [emps, pvzs] = await Promise.all([
                api.getEmployees({ pvzId: selectedPvz === 'all' ? undefined : selectedPvz }),
                api.getPvzList()
            ]);
            setEmployees(emps);
            setPvzList(pvzs);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedPvz]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredEmployees = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.phone && emp.phone.includes(searchQuery))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Сотрудники</h1>
                    <p className="text-muted-foreground">Управление персоналом и доступами</p>
                </div>
                <AddEmployeeModal onSuccess={loadData} />
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>База сотрудников</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 flex flex-col gap-4 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Поиск по имени или телефону..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={selectedPvz} onValueChange={setSelectedPvz}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Все ПВЗ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все ПВЗ</SelectItem>
                                {pvzList.map(pvz => (
                                    <SelectItem key={pvz.id} value={pvz.id}>{pvz.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Сотрудник</TableHead>
                                    <TableHead>Роль</TableHead>
                                    <TableHead>ПВЗ</TableHead>
                                    <TableHead>Статус</TableHead>
                                    <TableHead className="text-right">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Загрузка...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Сотрудники не найдены
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredEmployees.map((employee) => (
                                        <TableRow
                                            key={employee.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/hr/employees/${employee.id}`)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback className="font-bold">
                                                            {employee.fullName.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{employee.fullName}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {employee.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="uppercase">
                                                    {employee.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    {employee.mainPvzName || '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={employee.status === 'active' ? 'default' : 'secondary'}
                                                >
                                                    {employee.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                →
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

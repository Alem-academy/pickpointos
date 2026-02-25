import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

interface ColumnDef<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    searchKey?: keyof T;
    onRowClick?: (item: T) => void;
}

export function DataTable<T>({ data, columns, searchKey, onRowClick }: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);

    // Filtering
    const filteredData = data.filter((item) => {
        if (!searchQuery || !searchKey) return true;
        const value = item[searchKey];
        if (typeof value === 'string') {
            return value.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
    });

    // Sorting
    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;
        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key?: keyof T) => {
        if (!key) return;
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="space-y-4">
            {searchKey && (
                <div className="flex items-center">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Поиск..."
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                </div>
            )}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col, idx) => (
                                <TableHead
                                    key={idx}
                                    className={col.sortable && col.accessorKey ? "cursor-pointer hover:bg-muted/50 transition-colors select-none" : ""}
                                    onClick={() => col.sortable ? handleSort(col.accessorKey) : undefined}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && col.accessorKey && sortConfig?.key === col.accessorKey && (
                                            sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.length > 0 ? (
                            sortedData.map((row, i) => (
                                <TableRow
                                    key={i}
                                    className={onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                                    onClick={() => onRowClick && onRowClick(row)}
                                >
                                    {columns.map((col, j) => (
                                        <TableCell key={j}>
                                            {col.cell ? col.cell(row) : (col.accessorKey ? String(row[col.accessorKey]) : null)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    Нет данных.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

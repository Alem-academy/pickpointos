import { MapPin, Box, CheckSquare, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRFStats } from "@/hooks/use-queries";

export default function MyPoint() {
    const { data: stats, isLoading, error } = useRFStats();

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading Point Details...</p>
                </div>
            </div>
        );
    }

    if (error || !stats?.pvz) {
        return (
            <div className="p-8">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700">Point Not Found</CardTitle>
                        <CardDescription className="text-red-600">
                            {(error as Error)?.message || "No PVZ assigned to your account."}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const { pvz, todayShift } = stats;

    return (
        <div className="space-y-6 bg-slate-50/50 p-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">My Point</h2>
                <p className="text-slate-500">Detailed overview of your assigned PVZ.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            General Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-[24px_1fr] gap-4 items-start">
                            <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-sm">Address</h4>
                                <p className="text-slate-600">{pvz.address}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-[24px_1fr] gap-4 items-start">
                            <Box className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-sm">Brand</h4>
                                <p className="text-slate-600">{pvz.brand || 'Wildberries'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Shift Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckSquare className="h-5 w-5 text-emerald-600" />
                            Shift Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {todayShift && todayShift.length > 0 ? (
                            <div className="space-y-4">
                                {todayShift.map((emp) => (
                                    <div key={emp.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <div className="h-10 w-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold">
                                            {emp.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-emerald-900">{emp.full_name}</p>
                                            <p className="text-xs text-emerald-700">{emp.role?.toUpperCase() || 'N/A'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-500">
                                No active shift
                            </div>
                        )}
                        <div className="mt-4">
                            <Button className="w-full" variant="outline">View Full Schedule</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Checklist Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Opening Checklist</CardTitle>
                    <CardDescription>Status of required morning tasks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-2">
                        {['Clean floor', 'Turn on equipment', 'Check cash register', 'Unlock doors'].map((item, i) => (
                            <div key={i} className="flex items-center space-x-2">
                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {item}
                                </label>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

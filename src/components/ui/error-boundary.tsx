import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                    <Card className="w-full max-w-md border-red-200 shadow-lg">
                        <CardHeader className="bg-red-50 pb-4">
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-6 w-6" />
                                <CardTitle>Something went wrong</CardTitle>
                            </div>
                            <CardDescription className="text-red-900/80">
                                The application encountered a critical error and could not render.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="mb-4 rounded-md bg-slate-100 p-4 text-xs font-mono text-slate-700 overflow-auto max-h-48">
                                <p className="font-bold mb-2">{this.state.error?.message}</p>
                                {this.state.errorInfo?.componentStack}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => window.location.reload()}
                                    className="w-full"
                                    variant="default"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reload Page
                                </Button>
                                <Button
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.href = '/login';
                                    }}
                                    className="w-full"
                                    variant="outline"
                                >
                                    Clear Cache & Login
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

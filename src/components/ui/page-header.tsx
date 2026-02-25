import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Breadcrumb {
    label: string;
    path?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: Breadcrumb[];
    action?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-end md:justify-between px-6 pt-6">
            <div className="flex flex-col gap-1.5">
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={index} className="flex items-center">
                                {crumb.path ? (
                                    <Link to={crumb.path} className="hover:text-foreground transition-colors overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-none">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-foreground font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-none">
                                        {crumb.label}
                                    </span>
                                )}
                                {index < breadcrumbs.length - 1 && (
                                    <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </nav>
                )}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                    {description && (
                        <p className="text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
            </div>
            {action && (
                <div className="flex items-center shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}

import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function Layout() {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar (hidden on mobile) */}
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation (hidden on desktop) */}
            <MobileNav />
        </div>
    );
}

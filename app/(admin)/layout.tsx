"use client";

import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col lg:flex-row h-screen lg:overflow-hidden bg-neutral-100 font-sans antialiased text-neutral-900">
            <Sidebar />
            <main className="flex-1 overflow-y-auto flex flex-col">
                {children}
            </main>
        </div>
    );
}

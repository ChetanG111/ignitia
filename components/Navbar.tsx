"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const navItems = [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Issues", href: "/issues" },
        ...(user ? [{ label: "My Reports", href: "/my-reports" }] : []),
        ...(user?.role === "authority" ? [{ label: "Admin", href: "/admin" }] : []),
    ];

    const handleReportClick = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault();
            router.push("/login");
        }
    };

    return (
        <header className="px-8 py-6 anim-bounce max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <Link href="/" className="text-xl font-medium tracking-tighter text-black hover:opacity-70 transition-opacity">
                    A X I S
                </Link>
                <div className="flex items-center gap-6">
                    <nav className="flex items-center gap-5">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`text-sm font-medium transition-colors ${pathname.startsWith(item.href)
                                    ? "text-black"
                                    : "text-neutral-500 hover:text-black"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/report"
                            onClick={handleReportClick}
                            className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-neutral-800 transition-all shadow-sm active:scale-95"
                        >
                            Report
                        </Link>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => logout()}
                                    className="text-xs font-medium text-neutral-500 hover:text-black transition-colors"
                                >
                                    Log out
                                </button>
                                <div className="w-8 h-8 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-[10px] font-bold text-neutral-600 overflow-hidden">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                                    ) : (
                                        (user.displayName || user.email || "U").substring(0, 2).toUpperCase()
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="text-sm font-medium text-neutral-500 hover:text-black transition-colors"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

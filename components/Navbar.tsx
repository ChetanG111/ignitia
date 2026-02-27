"use client";

import { Icon } from "@iconify/react";

export default function Navbar() {
    return (
        <header className="px-8 py-6 anim-bounce max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div className="text-xl font-medium tracking-tighter text-black">A X I S</div>
                <div className="flex items-center gap-4">
                    <button className="text-sm font-medium text-neutral-500 hover:text-black transition-colors">
                        Reports
                    </button>
                    <button className="text-sm font-medium text-neutral-500 hover:text-black transition-colors">
                        Dashboard
                    </button>
                    <div className="w-8 h-8 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-[10px] font-bold">
                        JD
                    </div>
                </div>
            </div>
        </header>
    );
}

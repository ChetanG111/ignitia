"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
    label: string | React.ReactNode;
    value: string;
}

interface SelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    dropdownClassName?: string;
    size?: "sm" | "md" | "lg";
}

export default function Select({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    className = "",
    dropdownClassName = "",
    size = "md",
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value);

    const sizeClasses = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-4 py-2.5 text-base",
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full bg-white border border-neutral-200 rounded-xl font-medium text-black outline-none focus:ring-4 focus:ring-black/5 hover:border-neutral-400 transition-all shadow-sm h-full appearance-none select-none ${sizeClasses[size]}`}
            >
                <span className="truncate flex-1 text-left">
                    {selectedOption ? selectedOption.label : <span className="text-neutral-400 font-normal">{placeholder}</span>}
                </span>
                <Icon
                    icon="solar:alt-arrow-down-linear"
                    className={`ml-2 text-neutral-500 transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    width={size === "sm" ? 14 : 18}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 8, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className={`absolute top-full left-0 right-0 z-[60] mt-1 bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden py-1.5 max-h-60 overflow-y-auto no-scrollbar scroll-smooth ${dropdownClassName}`}
                    >
                        {options.map((option) => (
                            <li key={option.value}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all hover:bg-neutral-50 flex items-center justify-between group ${value === option.value ? "text-black bg-neutral-50/50" : "text-neutral-600 hover:text-black"
                                        }`}
                                >
                                    <span>{option.label}</span>
                                    {value === option.value && (
                                        <Icon icon="solar:check-circle-bold" className="text-black text-base" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

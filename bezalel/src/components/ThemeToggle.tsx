"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null; // avoid hydration mismatch

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            aria-pressed={theme === "dark"}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="relative flex items-center justify-center p-2 rounded-full 
                 bg-gray-100 hover:bg-gray-200 
                 dark:bg-zinc-800 dark:hover:bg-zinc-700
                 transition-all shadow-sm hover:shadow-md"
        >
            {/* Icon wrapper with animation */}
            <span className="absolute transition-transform duration-300 ease-in-out transform 
                       rotate-0 opacity-100 dark:-rotate-90 dark:opacity-0">
                <Sun className="w-5 h-5 text-yellow-500" />
            </span>
            <span className="absolute transition-transform duration-300 ease-in-out transform 
                       rotate-90 opacity-0 dark:rotate-0 dark:opacity-100">
                <Moon className="w-5 h-5 text-gray-200" />
            </span>
        </button>
    );
}

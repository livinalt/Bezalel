// PageSidebar.tsx

"use client";

import { Plus, Trash2, Edit2 } from "lucide-react";
import { PageData } from "../app/board/[roomId]/page";

interface PageSidebarProps {
    pages: PageData[];
    activePageId: string;
    onSelectPage: (id: string) => void;
    onAddPage: () => void;
    onRenamePage: (id: string, name: string) => void;
    onDeletePage: (id: string) => void;
}

export default function PageSidebar({
    pages,
    activePageId,
    onSelectPage,
    onAddPage,
    onRenamePage,
    onDeletePage,
}: PageSidebarProps) {
    return (
        <div className="w-56 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Pages</h2>
                <button
                    onClick={onAddPage}
                    className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    aria-label="Add page"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Page List */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {pages.map((page) => (
                    <div
                        key={page.id}
                        onClick={() => onSelectPage(page.id)}
                        className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${page.id === activePageId
                                ? "bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400"
                                : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                            }`}
                    >
                        <input
                            type="text"
                            value={page.name}
                            onChange={(e) => onRenamePage(page.id, e.target.value)}
                            className={`bg-transparent border-none outline-none flex-1 text-sm ${page.id === activePageId
                                    ? "font-medium text-blue-600 dark:text-blue-400"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                        />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeletePage(page.id);
                                }}
                                className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                aria-label="Delete page"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

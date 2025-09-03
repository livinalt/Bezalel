"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface PageData {
    id: string;
    name: string;
    canvasData: any;
}

interface SidebarProps {
    pages: PageData[];
    activePageId: string;
    onSelectPage: (id: string) => void;
    onAddPage: () => void;
    onRenamePage: (id: string, newName: string) => void;
    onDeletePage: (id: string) => void;
}

export default function PageSidebar({
    pages,
    activePageId,
    onSelectPage,
    onAddPage,
    onRenamePage,
    onDeletePage,
}: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    return (
        <aside className={`h-full border-r border-gray-200 bg-gray-50 dark:bg-zinc-900 transition-all duration-300 ${collapsed ? "w-14" : "w-56"}`}>
            {/* Collapse toggle */}
            <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-zinc-700">
                {!collapsed && <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Pages</span>}
                <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md">
                    {collapsed ? <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" /> : <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
                </button>
            </div>

            {/* Add Page button (always visible at top) */}
            {!collapsed && (
                <div className="p-2 border-b border-gray-200 dark:border-zinc-700">
                    <button
                        onClick={onAddPage}
                        className="w-full flex items-center gap-1 justify-center px-2 py-1 text-sm bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 rounded-md"
                    >
                        <Plus className="w-4 h-4" /> New Page
                    </button>
                </div>
            )}

            {/* Pages list */}
            <ul className="overflow-y-auto" style={{ maxHeight: "calc(100% - 3.5rem)" }}>
                {pages.map((page) => (
                    <li
                        key={page.id}
                        className={`group flex items-center justify-between px-2 py-1 cursor-pointer text-sm ${activePageId === page.id ? "bg-gray-200 font-bold dark:bg-zinc-800" : "hover:bg-gray-100 dark:hover:bg-zinc-700"}`}
                        onClick={() => onSelectPage(page.id)}
                        onDoubleClick={() => {
                            setEditingId(page.id);
                            setEditValue(page.name);
                        }}
                    >
                        {editingId === page.id ? (
                            <input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => {
                                    onRenamePage(page.id, editValue.trim() || "Untitled");
                                    setEditingId(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        onRenamePage(page.id, editValue.trim() || "Untitled");
                                        setEditingId(null);
                                    }
                                }}
                                autoFocus
                                className="flex-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded px-1 text-sm"
                            />
                        ) : (
                            <span className="truncate flex-1">{page.name}</span>
                        )}
                        {!collapsed && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeletePage(page.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-md"
                            >
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </aside>
    );
}

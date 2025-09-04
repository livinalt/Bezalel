"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";


interface CanvasData {
    [key: string]: unknown; 
}

interface PageData {
    id: string;
    name: string;
    canvasData: CanvasData;
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

    // Memoize event handlers to prevent unnecessary re-renders
    const handleToggleCollapse = useCallback(() => setCollapsed((prev) => !prev), []);
    const handlePageSelect = useCallback((id: string) => onSelectPage(id), [onSelectPage]);
    const handleAddPage = useCallback(() => onAddPage(), [onAddPage]);
    const handleRename = useCallback(
        (id: string, name: string) => {
            onRenamePage(id, name.trim() || "Untitled");
            setEditingId(null);
        },
        [onRenamePage]
    );
    const handleDelete = useCallback(
        (e: React.MouseEvent, id: string) => {
            e.stopPropagation();
            onDeletePage(id);
        },
        [onDeletePage]
    );

    return (
        <aside
            className={`h-full border-r border-gray-200 bg-gray-50 dark:bg-zinc-900 transition-all duration-300 ${collapsed ? "w-14" : "w-56"
                }`}
        >
            {/* Collapse toggle */}
            <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-zinc-700">
                {!collapsed && (
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Pages</span>
                )}
                <button
                    onClick={handleToggleCollapse}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md"
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    ) : (
                        <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    )}
                </button>
            </div>

            {/* Add Page button (always visible at top) */}
            {!collapsed && (
                <div className="p-2 border-b border-gray-200 dark:border-zinc-700">
                    <button
                        onClick={handleAddPage}
                        className="w-full flex items-center gap-1 justify-center px-2 py-1 text-sm bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 rounded-md"
                        aria-label="Add new page"
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
                        className={`group flex items-center justify-between px-2 py-1 cursor-pointer text-sm ${activePageId === page.id
                                ? "bg-gray-200 font-bold dark:bg-zinc-800"
                                : "hover:bg-gray-100 dark:hover:bg-zinc-700"
                            }`}
                        onClick={() => handlePageSelect(page.id)}
                        onDoubleClick={() => {
                            setEditingId(page.id);
                            setEditValue(page.name);
                        }}
                    >
                        {editingId === page.id ? (
                            <input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleRename(page.id, editValue)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleRename(page.id, editValue);
                                    } else if (e.key === "Escape") {
                                        setEditingId(null);
                                        setEditValue("");
                                    }
                                }}
                                autoFocus
                                className="flex-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded px-1 text-sm"
                                aria-label={`Edit page name for ${page.name}`}
                            />
                        ) : (
                            <span className="truncate flex-1">{page.name}</span>
                        )}
                        {!collapsed && (
                            <button
                                onClick={(e) => handleDelete(e, page.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-md"
                                aria-label={`Delete page ${page.name}`}
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
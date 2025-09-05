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

    const handleToggleCollapse = useCallback(
        () => setCollapsed((prev) => !prev),
        []
    );
    const handlePageSelect = useCallback(
        (id: string) => onSelectPage(id),
        [onSelectPage]
    );
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
            className={`h-full bg-zinc-50 dark:bg-zinc-900 transition-all duration-300 ease-in-out border-r border-zinc-200 dark:border-zinc-800 
      ${collapsed ? "w-12" : "w-52"} flex flex-col`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-zinc-200 dark:border-zinc-800">
                {!collapsed && (
                    <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">
                        Pages
                    </span>
                )}
                <button
                    onClick={handleToggleCollapse}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                    ) : (
                        <ChevronLeft className="w-4 h-4 text-zinc-500" />
                    )}
                </button>
            </div>

            {/* Add Page */}
            {!collapsed && (
                <div className="px-2 py-1.5 border-b border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={handleAddPage}
                        className="w-full flex items-center gap-1.5 justify-center px-2 py-1 text-[12px] 
              text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 
              rounded-md transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Page
                    </button>
                </div>
            )}

            {/* Pages */}
            <ul className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5">
                {pages.map((page) => (
                    <li
                        key={page.id}
                        className={`group flex items-center justify-between px-2 py-1 rounded-md cursor-pointer text-[12px] transition-colors
              ${activePageId === page.id
                                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
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
                                className="flex-1 bg-transparent border-b border-zinc-400 focus:border-zinc-600 outline-none text-[12px] px-0.5"
                            />
                        ) : (
                            <span className="truncate flex-1">{page.name}</span>
                        )}
                        {!collapsed && (
                            <button
                                onClick={(e) => handleDelete(e, page.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </aside>
    );
}

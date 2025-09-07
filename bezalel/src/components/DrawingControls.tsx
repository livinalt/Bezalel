"use client";

import { Dispatch, SetStateAction, Fragment } from "react";
import {
    Undo2,
    Redo2,
    Grid,
    ZoomIn,
    ZoomOut,
    Trash2,
    Download,
    Sparkles,
    Ruler,
    ChevronDown,
} from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { TLEditor } from "@tldraw/tldraw";
import { toast } from "sonner";

interface DrawingControlsProps {
    isDrawingMode: boolean;
    setIsDrawingMode: Dispatch<SetStateAction<boolean>>;
    activeTool: string;
    setActiveTool: Dispatch<SetStateAction<string>>;
    brushColor: string;
    setBrushColor: Dispatch<SetStateAction<string>>;
    brushWidth: number;
    setBrushWidth: Dispatch<SetStateAction<number>>;
    brushOpacity: number;
    setBrushOpacity: Dispatch<SetStateAction<number>>;
    brushType: string;
    setBrushType: Dispatch<SetStateAction<string>>;
    handleUndo: () => void;
    handleRedo: () => void;
    canvasComponentRef: React.RefObject<TLEditor>;
    aiPrompt: string;
    setAiPrompt: Dispatch<SetStateAction<string>>;
    showGrid: boolean;
    setShowGrid: Dispatch<SetStateAction<boolean>>;
    showRulers: boolean;
    setShowRulers: Dispatch<SetStateAction<boolean>>;
    saveCanvasState: () => void;
}

export default function DrawingControls({
    handleUndo,
    handleRedo,
    canvasComponentRef,
    aiPrompt,
    setAiPrompt,
    showGrid,
    setShowGrid,
    showRulers,
    setShowRulers,
    saveCanvasState,
}: DrawingControlsProps) {
    const exportCanvas = (format: "svg" | "png") => {
        const editor = canvasComponentRef.current;
        if (!editor) return;
        if (format === "svg") {
            const svg = editor.getSvgString();
            if (!svg) return;
            const blob = new Blob([svg], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "drawing.svg";
            link.click();
            URL.revokeObjectURL(url);
        } else if (format === "png") {
            const canvas = editor.getContainer().querySelector("canvas");
            if (!canvas) return;
            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "drawing.png";
                link.click();
                URL.revokeObjectURL(url);
            }, "image/png");
        }
    };

    return (
        <div className="flex items-center gap-2 overflow-visible">
            <ToolbarButton label="Undo (Ctrl+Z)" onClick={handleUndo}>
                <Undo2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton label="Redo (Ctrl+Shift+Z)" onClick={handleRedo}>
                <Redo2 className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
                label="Delete (Del)"
                onClick={() => canvasComponentRef.current?.deleteShapes(canvasComponentRef.current.getSelectedShapeIds())}
            >
                <Trash2 className="w-4 h-4 text-red-600" />
            </ToolbarButton>

            <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="toolbar-btn flex items-center">
                    <Download className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3 ml-1" />
                </Menu.Button>
                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute left-0 bottom-full mb-2 w-32 rounded-md bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[10000] p-1">
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={() => exportCanvas("svg")}
                                    className={`${active ? "bg-gray-100 dark:bg-zinc-700" : ""} flex w-full items-center gap-2 px-2 py-1 text-sm rounded`}
                                >
                                    Export SVG
                                </button>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={() => exportCanvas("png")}
                                    className={`${active ? "bg-gray-100 dark:bg-zinc-700" : ""} flex w-full items-center gap-2 px-2 py-1 text-sm rounded`}
                                >
                                    Export PNG
                                </button>
                            )}
                        </Menu.Item>
                    </Menu.Items>
                </Transition>
            </Menu>

            <ToolbarButton
                label="Zoom Out (-)"
                onClick={() => canvasComponentRef.current?.zoomOut()}
            >
                <ZoomOut className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                label="Zoom In (+)"
                onClick={() => canvasComponentRef.current?.zoomIn()}
            >
                <ZoomIn className="w-4 h-4" />
            </ToolbarButton>

            <input
                title="Object enhancement prompt"
                placeholder="Object prompt..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 w-40 focus:outline-none focus:ring-1 focus:ring-green-400"
            />
            <button
                title="Enhance Selected Objects"
                onClick={async () => {
                    const editor = canvasComponentRef.current;
                    if (!editor || !aiPrompt) return;
                    const selectedShapes = editor.getSelectedShapes();
                    if (selectedShapes.length === 0) return;
                    try {
                        const response = await fetch("/mock/daydream/streams", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                objects: selectedShapes.map((shape) => ({
                                    id: shape.id,
                                    type: shape.type,
                                    props: shape.props,
                                })),
                                prompt: aiPrompt,
                            }),
                        });
                        const result = await response.json();
                        editor.updateShapes(
                            result.objects.map((obj: any) => ({
                                id: obj.id,
                                type: obj.type,
                                props: { ...obj.props, fill: obj.fill || obj.props.fill },
                            }))
                        );
                        saveCanvasState();
                    } catch (error) {
                        console.error("DaydreamAPI error:", error);
                        toast.error("Failed to enhance objects");
                    }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-green-50"
            >
                <Sparkles className="w-4 h-4 text-green-600" />
            </button>

            <ToolbarButton
                label="Toggle Grid (G)"
                active={showGrid}
                onClick={() => {
                    setShowGrid((s) => !s);
                    canvasComponentRef.current?.updateInstanceState({ isGridMode: !showGrid });
                }}
            >
                <Grid className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
                label="Toggle Rulers (R)"
                active={showRulers}
                onClick={() => setShowRulers((s) => !s)}
            >
                <Ruler className="w-4 h-4" />
            </ToolbarButton>
        </div>
    );
}

function ToolbarButton({
    children,
    label,
    onClick,
    active = false,
}: {
    children: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={`toolbar-btn w-8 h-8 flex items-center justify-center rounded-md transition ${active ? "bg-gray-200 dark:bg-zinc-700" : "hover:bg-gray-100 dark:hover:bg-zinc-800"}`}
        >
            {children}
        </button>
    );
}
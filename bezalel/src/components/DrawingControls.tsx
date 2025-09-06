"use client";

import { Dispatch, RefObject, SetStateAction, Fragment } from "react";
import {
    Pencil,
    Hand,
    Undo2,
    Redo2,
    Grid,
    ZoomIn,
    ZoomOut,
    Trash2,
    Square,
    Minus,
    Download,
    MousePointer,
    Eraser,
    Palette,
    ChevronDown,
    Circle,
    Triangle,
    Sparkles,
} from "lucide-react";
import { Menu, Transition } from "@headlessui/react";

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
    handleUndo: () => void;
    handleRedo: () => void;
    canvasRef: RefObject<any>;
    aiPrompt: string;
    setAiPrompt: Dispatch<SetStateAction<string>>;
    showGrid: boolean;
    setShowGrid: Dispatch<SetStateAction<boolean>>;
}

export default function DrawingControls({
    isDrawingMode,
    setIsDrawingMode,
    activeTool,
    setActiveTool,
    brushColor,
    setBrushColor,
    brushWidth,
    setBrushWidth,
    brushOpacity,
    setBrushOpacity,
    handleUndo,
    handleRedo,
    canvasRef,
    aiPrompt,
    setAiPrompt,
    showGrid,
    setShowGrid,
}: DrawingControlsProps) {
    const colorPalette = [
        "#FF0000",
        "#00FF00",
        "#0000FF",
        "#FFFF00",
        "#FF00FF",
        "#00FFFF",
        "#000000",
        "#FFFFFF",
    ];

    const updateBrush = (color?: string, width?: number) => {
        const canvas = canvasRef.current;
        if (canvas && canvas.isDrawingMode && canvas.freeDrawingBrush) {
            if (color) {
                canvas.freeDrawingBrush.color = activeTool === "eraser" ? "transparent" : color;
                canvas.freeDrawingBrush.globalCompositeOperation = activeTool === "eraser" ? "destination-out" : "source-over";
            }
            if (width) canvas.freeDrawingBrush.width = width;
        }
    };

    return (
        <div className="flex items-center gap-2 overflow-visible">
            <ToolbarButton
                label="Select (V)"
                active={activeTool === "select"}
                onClick={() => {
                    setActiveTool("select");
                    setIsDrawingMode(false);
                    if (canvasRef.current) canvasRef.current.isDrawingMode = false;
                }}
            >
                <MousePointer className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
                label="Pencil (P)"
                active={activeTool === "pencil"}
                onClick={() => {
                    setActiveTool("pencil");
                    setIsDrawingMode(true);
                    if (canvasRef.current) {
                        canvasRef.current.isDrawingMode = true;
                        updateBrush(brushColor, brushWidth);
                    }
                }}
            >
                <Pencil className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
                label="Eraser (E)"
                active={activeTool === "eraser"}
                onClick={() => {
                    setActiveTool("eraser");
                    setIsDrawingMode(true);
                    if (canvasRef.current) {
                        canvasRef.current.isDrawingMode = true;
                        updateBrush("transparent", brushWidth);
                    }
                }}
            >
                <Eraser className="w-4 h-4" />
            </ToolbarButton>

            <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="toolbar-btn flex items-center">
                    <Square className="w-4 h-4" />
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
                        <ShapeMenuItem
                            icon={<Square className="w-4 h-4" />}
                            label="Rectangle"
                            onClick={() => setActiveTool("rectangle")}
                        />
                        <ShapeMenuItem
                            icon={<Minus className="w-4 h-4" />}
                            label="Line"
                            onClick={() => setActiveTool("line")}
                        />
                        <ShapeMenuItem
                            icon={<Circle className="w-4 h-4" />}
                            label="Circle"
                            onClick={() => setActiveTool("circle")}
                        />
                        <ShapeMenuItem
                            icon={<Triangle className="w-4 h-4" />}
                            label="Triangle"
                            onClick={() => setActiveTool("triangle")}
                        />
                        <ShapeMenuItem
                            icon={<Minus className="w-4 h-4 rotate-45" />}
                            label="Arrow"
                            onClick={() => setActiveTool("arrow")}
                        />
                    </Menu.Items>
                </Transition>
            </Menu>

            <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="toolbar-btn flex items-center">
                    <Palette className="w-4 h-4" />
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
                    <Menu.Items
                        className="absolute left-0 bottom-full mb-2 w-52 rounded-md bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[10000] p-2 flex flex-wrap gap-2"
                    >
                        {colorPalette.map((color) => (
                            <Menu.Item key={color}>
                                {({ active }) => (
                                    <button
                                        onClick={() => {
                                            setBrushColor(color);
                                            updateBrush(color);
                                        }}
                                        className={`w-6 h-6 rounded ${active ? "ring-2 ring-blue-500" : ""}`}
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                            </Menu.Item>
                        ))}
                    </Menu.Items>
                </Transition>
            </Menu>

            <ToolbarButton label="Undo (Ctrl+Z)" onClick={handleUndo}>
                <Undo2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton label="Redo (Ctrl+Shift+Z)" onClick={handleRedo}>
                <Redo2 className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
                label="Delete (Del)"
                onClick={() => canvasRef.current?.deleteSelected()}
            >
                <Trash2 className="w-4 h-4 text-red-600" />
            </ToolbarButton>

            <ToolbarButton
                label="Export (Ctrl+E)"
                onClick={() => canvasRef.current?.exportCanvas()}
            >
                <Download className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton label="Zoom Out (-)" onClick={() => canvasRef.current?.zoomOut()}>
                <ZoomOut className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton label="Zoom In (+)" onClick={() => canvasRef.current?.zoomIn()}>
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
                onClick={() => canvasRef.current?.applyEnhanceToSelected(aiPrompt)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-green-50"
            >
                <Sparkles className="w-4 h-4 text-green-600" />
            </button>

            <ToolbarButton
                label="Toggle Grid (G)"
                active={showGrid}
                onClick={() => setShowGrid((s) => !s)}
            >
                <Grid className="w-4 h-4" />
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
            className={`toolbar-btn w-8 h-8 flex items-center justify-center rounded-md transition ${active
                ? "bg-gray-200 dark:bg-zinc-700"
                : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                }`}
        >
            {children}
        </button>
    );
}

function ShapeMenuItem({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <Menu.Item>
            {({ active }) => (
                <button
                    onClick={onClick}
                    className={`${active ? "bg-gray-100 dark:bg-zinc-700" : ""
                        } flex w-full items-center gap-2 px-2 py-1 text-sm rounded`}
                >
                    {icon} {label}
                </button>
            )}
        </Menu.Item>
    );
}
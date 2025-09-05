
"use client";

import { Dispatch, RefObject, SetStateAction, useState } from "react";
import { Canvas, Circle, Rect, Line, Triangle, Ellipse, Polygon } from "fabric"; // Named imports
import {
    Pencil,
    Hand,
    Undo2,
    Redo2,
    Sparkles,
    Grid,
    ZoomIn,
    ZoomOut,
    Radio,
    Square,
    Circle as CircleIcon,
    Shapes,
    Play as TriangleIcon, // Fallback for Triangle
} from "lucide-react";
import { toast } from "sonner";

interface ToolbarProps {
    isDrawingMode: boolean;
    setIsDrawingMode: Dispatch<SetStateAction<boolean>>;
    brushColor: string;
    setBrushColor: Dispatch<SetStateAction<string>>;
    brushWidth: number;
    setBrushWidth: Dispatch<SetStateAction<number>>;
    handleUndo: () => void;
    handleRedo: () => void;
    canvasRef: RefObject<Canvas | null>;
    aiPrompt: string;
    setAiPrompt: Dispatch<SetStateAction<string>>;
    handleEnhance: () => void;
    showGrid: boolean;
    setShowGrid: Dispatch<SetStateAction<boolean>>;
    isStreaming: boolean;
    setIsStreaming: (value: boolean) => void;
}

export default function Toolbar({
    isDrawingMode,
    setIsDrawingMode,
    brushColor,
    setBrushColor,
    brushWidth,
    setBrushWidth,
    handleUndo,
    handleRedo,
    canvasRef,
    aiPrompt,
    setAiPrompt,
    handleEnhance,
    showGrid,
    setShowGrid,
    isStreaming,
    setIsStreaming,
}: ToolbarProps) {
    const [showShapeMenu, setShowShapeMenu] = useState(false);

    // Shared style for all shapes
    const defaultShapeStyle: fabric.IObjectOptions = {
        fill: "rgba(0,0,0,0.05)",
        stroke: brushColor,
        strokeWidth: brushWidth,
        selectable: true,
        hoverCursor: "pointer",
        transparentCorners: false,
        cornerColor: "#3b82f6", // Tailwind blue-500
        cornerStyle: "circle",
        shadow: {
            color: "rgba(0,0,0,0.15)",
            blur: 8,
            offsetX: 3,
            offsetY: 3,
        },
    };

    // Shape Helpers
    const addShape = (shapeType: string) => {
        if (!canvasRef.current) {
            toast.error("Canvas not initialized. Please try again.");
            return;
        }
        setIsDrawingMode(false);
        setShowShapeMenu(false);

        let shape: fabric.Object | undefined;

        switch (shapeType) {
            case "circle":
                shape = new Circle({
                    radius: 40,
                    left: 120,
                    top: 120,
                    ...defaultShapeStyle,
                });
                break;
            case "square":
                shape = new Rect({
                    width: 80,
                    height: 80,
                    left: 150,
                    top: 150,
                    ...defaultShapeStyle,
                });
                break;
            case "rectangle":
                shape = new Rect({
                    width: 120,
                    height: 80,
                    left: 150,
                    top: 150,
                    ...defaultShapeStyle,
                });
                break;
            case "triangle":
                shape = new Triangle({
                    width: 80,
                    height: 80,
                    left: 150,
                    top: 150,
                    ...defaultShapeStyle,
                });
                break;
            case "ellipse":
                shape = new Ellipse({
                    rx: 60,
                    ry: 40,
                    left: 150,
                    top: 150,
                    ...defaultShapeStyle,
                });
                break;
            case "line":
                shape = new Line([150, 150, 250, 150], {
                    ...defaultShapeStyle,
                });
                break;
            case "star":
                shape = new Polygon(getStarPoints(50, 25), {
                    left: 150,
                    top: 150,
                    ...defaultShapeStyle,
                });
                break;
            default:
                return;
        }

        canvasRef.current.add(shape);
        canvasRef.current.requestRenderAll();
    };

    // Utility: star points generator
    function getStarPoints(outer: number, inner: number, numPoints = 5) {
        const step = Math.PI / numPoints;
        return Array.from({ length: numPoints * 2 }, (_, i) => {
            const r = i % 2 === 0 ? outer : inner;
            return {
                x: Math.cos(i * step) * r,
                y: Math.sin(i * step) * r,
            };
        });
    }

    // Zoom
    const zoomIn = () => {
        if (!canvasRef.current) {
            toast.error("Canvas not initialized. Please try again.");
            return;
        }
        const zoom = canvasRef.current.getZoom() * 1.1;
        canvasRef.current.setZoom(zoom);
        canvasRef.current.requestRenderAll();
    };

    const zoomOut = () => {
        if (!canvasRef.current) {
            toast.error("Canvas not initialized. Please try again.");
            return;
        }
        const zoom = canvasRef.current.getZoom() / 1.1;
        canvasRef.current.setZoom(zoom);
        canvasRef.current.requestRenderAll();
    };

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl">
            <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-gray-200 dark:border-zinc-700 shadow-lg px-2 py-1">
                {/* Draw / Pan */}
                <button
                    title={isDrawingMode ? "Drawing" : "Pan"}
                    onClick={() => setIsDrawingMode((s) => !s)}
                    className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition ${isDrawingMode ? "bg-gray-100 dark:bg-zinc-700" : ""
                        }`}
                >
                    {isDrawingMode ? (
                        <Pencil className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                    ) : (
                        <Hand className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                    )}
                </button>

                {/* Shapes Dropdown */}
                <div className="relative">
                    <button
                        title="Add Shape"
                        onClick={() => setShowShapeMenu((s) => !s)}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                    >
                        <Shapes className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                    </button>
                    {showShapeMenu && (
                        <div className="absolute bottom-10 left-0 z-50 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg p-2 grid grid-cols-2 gap-2">
                            <button
                                onClick={() => addShape("circle")}
                                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                            >
                                <CircleIcon className="w-4 h-4" /> Circle
                            </button>
                            <button
                                onClick={() => addShape("square")}
                                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                            >
                                <Square className="w-4 h-4" /> Square
                            </button>
                            <button
                                onClick={() => addShape("rectangle")}
                                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                            >
                                <Square className="w-4 h-4" /> Rectangle
                            </button>
                            <button
                                onClick={() => addShape("triangle")}
                                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                            >
                                <TriangleIcon className="w-4 h-4" /> Triangle
                            </button>
                            <button
                                onClick={() => addShape("ellipse")}
                                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                            >
                                <CircleIcon className="w-4 h-4" /> Ellipse
                            </button>
                            <button
                                onClick={() => addShape("line")}
                                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                            >
                                <span className="w-4 h-0.5 bg-gray-800 dark:bg-gray-200" /> Line
                            </button>
                            <button
                                onClick={() => addShape("star")}
                                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                            >
                                <span className="text-sm">⭐</span> Star
                            </button>
                        </div>
                    )}
                </div>

                {/* Brush tools */}
                <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-200 dark:border-zinc-700"
                    title="Brush color"
                />
                <input
                    type="range"
                    min={1}
                    max={40}
                    value={brushWidth}
                    onChange={(e) => setBrushWidth(Number(e.target.value))}
                    className="w-20 accent-blue-500"
                    title="Brush size"
                />

                {/* Undo / Redo */}
                <button
                    title="Undo"
                    onClick={handleUndo}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                    <Undo2 className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                </button>
                <button
                    title="Redo"
                    onClick={handleRedo}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                    <Redo2 className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                </button>

                {/* Zoom */}
                <button
                    title="Zoom Out"
                    onClick={zoomOut}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                    <ZoomOut className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                </button>
                <button
                    title="Zoom In"
                    onClick={zoomIn}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                    <ZoomIn className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                </button>

                {/* AI Prompt */}
                <input
                    title="AI prompt"
                    placeholder="AI prompt..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-md px-2 py-0.5 w-32 focus:outline-none focus:ring-1 focus:ring-green-400"
                />
                <button
                    title="Enhance with AI"
                    onClick={handleEnhance}
                    className="p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-zinc-700"
                >
                    <Sparkles className="w-4 h-4 text-green-600" />
                </button>

                {/* Grid Toggle */}
                <button
                    title="Toggle grid"
                    onClick={() => setShowGrid((s) => !s)}
                    className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 ${showGrid ? "bg-gray-100 dark:bg-zinc-700" : ""
                        }`}
                >
                    <Grid
                        className={`w-4 h-4 ${showGrid ? "text-gray-800 dark:text-gray-200" : "text-gray-500 dark:text-zinc-400"
                            }`}
                    />
                </button>

                {/* Live button */}
                <button
                    onClick={() => setIsStreaming(!isStreaming)}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition ${isStreaming ? "bg-red-600 text-white hover:bg-red-700" : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                >
                    {isStreaming ? (
                        <>
                            <Square className="w-3.5 h-3.5" /> Stop
                        </>
                    ) : (
                        <>
                            <Radio className="w-3.5 h-3.5 animate-pulse text-red-300" /> Live
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
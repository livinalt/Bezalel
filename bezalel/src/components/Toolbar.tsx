"use client";

import { Dispatch, RefObject, SetStateAction } from "react";
import {
    Pencil,
    Hand,
    Undo2,
    Redo2,
    Sparkles,
    Monitor,
    Grid,
    ZoomIn,
    ZoomOut,
    Radio,
    Square,
} from "lucide-react";

interface ToolbarProps {
    isDrawingMode: boolean;
    setIsDrawingMode: Dispatch<SetStateAction<boolean>>;
    brushColor: string;
    setBrushColor: Dispatch<SetStateAction<string>>;
    brushWidth: number;
    setBrushWidth: Dispatch<SetStateAction<number>>;
    handleUndo: () => void;
    handleRedo: () => void;
    canvasComponentRef: RefObject<any>;
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
    canvasComponentRef,
    aiPrompt,
    setAiPrompt,
    handleEnhance,
    showGrid,
    setShowGrid,
    isStreaming,
    setIsStreaming,
}: ToolbarProps) {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md border border-gray-200 dark:border-zinc-700 shadow-md px-3 py-2">
                {/* Draw / Pan */}
                <button
                    title={isDrawingMode ? "Drawing" : "Pan"}
                    onClick={() => setIsDrawingMode((s) => !s)}
                    className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition ${isDrawingMode ? "bg-gray-100 dark:bg-zinc-700" : ""
                        }`}
                >
                    {isDrawingMode ? (
                        <Pencil className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                    ) : (
                        <Hand className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                    )}
                </button>

                {/* Color & Brush */}
                <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-7 h-7 rounded-md border border-gray-200 dark:border-zinc-700"
                    title="Brush color"
                />
                <input
                    type="range"
                    min={1}
                    max={40}
                    value={brushWidth}
                    onChange={(e) => setBrushWidth(Number(e.target.value))}
                    className="w-24 accent-blue-500"
                    title="Brush size"
                />

                <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-1" />

                {/* Undo / Redo */}
                <button
                    title="Undo"
                    onClick={handleUndo}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                    <Undo2 className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                </button>
                <button
                    title="Redo"
                    onClick={handleRedo}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                    <Redo2 className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                </button>

                <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-1" />

                {/* Zoom */}
                <button
                    title="Zoom Out"
                    onClick={() => canvasComponentRef.current?.zoomOut()}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                    <ZoomOut className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                </button>
                <button
                    title="Zoom In"
                    onClick={() => canvasComponentRef.current?.zoomIn()}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                    <ZoomIn className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                </button>

                <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-1" />

                {/* AI Prompt */}
                <input
                    title="AI prompt"
                    placeholder="Describe enhancement..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-md px-2 py-1 w-40 focus:outline-none focus:ring-1 focus:ring-green-400"
                />
                <button
                    title="Enhance with AI"
                    onClick={handleEnhance}
                    className="p-2 rounded-md hover:bg-green-50"
                >
                    <Sparkles className="w-4 h-4 text-green-600" />
                </button>

                <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-1" />

                {/* Toggle Grid */}
                <button
                    title="Toggle grid"
                    onClick={() => setShowGrid((s) => !s)}
                    className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition ${showGrid ? "bg-gray-100 dark:bg-zinc-700" : ""
                        }`}
                >
                    <Grid
                        className={`w-4 h-4 ${showGrid
                                ? "text-gray-800 dark:text-gray-200"
                                : "text-gray-500 dark:text-zinc-400"
                            }`}
                    />
                </button>

                <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-1" />

                {/* Go Live Button */}
                <button
                    onClick={() => setIsStreaming(!isStreaming)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${isStreaming
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                >
                    {isStreaming ? (
                        <>
                            <Square className="w-4 h-4" /> Stop Live
                        </>
                    ) : (
                        <>
                            <Radio className="w-4 h-4 animate-pulse text-red-300" /> Go Live
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

"use client";

import { Dispatch, RefObject, SetStateAction } from "react";
import { Canvas as FabricJSCanvas } from "fabric";
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
    ToggleLeft,
    ToggleRight,
} from "lucide-react";

// Define an interface for the canvas ref, extending FabricJSCanvas
interface ExtendedFabricCanvas extends FabricJSCanvas {
    zoomIn: () => void;
    zoomOut: () => void;
}

interface ToolbarProps {
    isDrawingMode: boolean;
    setIsDrawingMode: Dispatch<SetStateAction<boolean>>;
    brushColor: string;
    setBrushColor: Dispatch<SetStateAction<string>>;
    brushWidth: number;
    setBrushWidth: Dispatch<SetStateAction<number>>;
    handleUndo: () => void;
    handleRedo: () => void;
    canvasComponentRef: RefObject<ExtendedFabricCanvas>;
    aiPrompt: string;
    setAiPrompt: Dispatch<SetStateAction<string>>;
    webcamPrompt: string; // New prop for webcam prompt
    setWebcamPrompt: Dispatch<SetStateAction<string>>; // New prop for webcam prompt setter
    showGrid: boolean;
    setShowGrid: Dispatch<SetStateAction<boolean>>;
    isStreaming: boolean;
    setIsStreaming: (value: boolean) => void;
    handleCanvasEnhance: () => void;
    useWebcam: boolean;
    setUseWebcam: (value: boolean) => void;
    enhanceWebcam: boolean;
    setEnhanceWebcam: Dispatch<SetStateAction<boolean>>;
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
    webcamPrompt,
    setWebcamPrompt,
    showGrid,
    setShowGrid,
    isStreaming,
    setIsStreaming,
    handleCanvasEnhance,
    useWebcam,
    setUseWebcam,
    enhanceWebcam,
    setEnhanceWebcam,
}: ToolbarProps) {
    return (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl">
            <div className="flex items-center justify-center gap-1 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-gray-200/60 dark:border-zinc-700/60 shadow-md py-1 px-1 overflow-x-auto no-scrollbar">
                {/* Draw / Pan */}
                <button
                    title={isDrawingMode ? "Drawing" : "Pan"}
                    onClick={() => setIsDrawingMode((s) => !s)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition ${isDrawingMode ? "bg-gray-100 dark:bg-zinc-800" : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                        }`}
                >
                    {isDrawingMode ? (
                        <Pencil className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                    ) : (
                        <Hand className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                    )}
                </button>

                {/* Divider */}
                <span className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />

                {/* Brush Color & Size */}
                <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-gray-200 dark:border-zinc-700"
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

                {/* Divider */}
                <span className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />

                {/* Undo / Redo */}
                <button
                    title="Undo"
                    onClick={handleUndo}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                    <Undo2 className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                </button>
                <button
                    title="Redo"
                    onClick={handleRedo}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                    <Redo2 className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                </button>

                {/* Divider */}
                <span className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />

                {/* Zoom */}
                <button
                    title="Zoom Out"
                    onClick={() => canvasComponentRef.current?.zoomOut()}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                    <ZoomOut className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                </button>
                <button
                    title="Zoom In"
                    onClick={() => canvasComponentRef.current?.zoomIn()}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                    <ZoomIn className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                </button>

                {/* Divider */}
                <span className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />

                {/* Canvas AI Prompt + Action */}
                <input
                    title="Canvas enhancement prompt"
                    placeholder="Canvas prompt..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-green-400"
                />
                <button
                    title="Enhance Canvas"
                    onClick={handleCanvasEnhance}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-green-50"
                >
                    <Sparkles className="w-4 h-4 text-green-600" />
                </button>

                {/* Webcam AI Prompt + Action */}
                <input
                    title="Webcam enhancement prompt"
                    placeholder="Webcam prompt..."
                    value={webcamPrompt}
                    onChange={(e) => setWebcamPrompt(e.target.value)}
                    className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-green-400"
                />
                <button
                    title="Enhance Webcam"
                    onClick={() => setEnhanceWebcam(!enhanceWebcam)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition ${enhanceWebcam && useWebcam
                        ? "bg-green-100 dark:bg-green-900"
                        : useWebcam
                            ? "hover:bg-green-50 dark:hover:bg-green-900"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                >
                    <Sparkles className="w-4 h-4 text-green-600" />
                </button>

                {/* Divider */}
                <span className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />

                {/* Webcam Toggle */}
                <div className="flex items-center gap-2">
                    <button
                        title="Toggle Webcam"
                        onClick={() => setUseWebcam(!useWebcam)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition ${useWebcam ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                            }`}
                    >
                        {useWebcam ? (
                            <ToggleRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                        )}
                    </button>
                    <span className="text-xs text-gray-700 dark:text-gray-200">Webcam</span>
                </div>

                {/* Divider */}
                <span className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />

                {/* Grid */}
                <button
                    title="Toggle grid"
                    onClick={() => setShowGrid((s) => !s)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${showGrid ? "bg-gray-100 dark:bg-zinc-800" : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                        }`}
                >
                    <Grid
                        className={`w-4 h-4 ${showGrid ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-zinc-500"
                            }`}
                    />
                </button>

                {/* Divider */}
                <span className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />

                {/* Go Live */}
                <button
                    onClick={() => setIsStreaming(!isStreaming)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition ${isStreaming ? "bg-red-600 text-white hover:bg-red-700" : "bg-blue-600 text-white hover:bg-blue-700"
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
"use client";

import { Dispatch, RefObject, SetStateAction } from "react";
import DrawingControls from "./DrawingControls";
import StreamingControls from "./StreamingControls";
import { Canvas as FabricJSCanvas } from "fabric";

// Extended FabricJS Canvas
interface ExtendedFabricCanvas extends FabricJSCanvas {
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    toJSON: () => any;
    loadFromJSON: (json: any) => void;
    undo: () => void;
    redo: () => void;
    exportCanvas: () => void;
    deleteSelected: () => void;
    applyEnhanceToSelected: (prompt: string) => void;
}

interface ToolbarProps {
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
    canvasComponentRef: RefObject<ExtendedFabricCanvas>;
    aiPrompt: string;
    setAiPrompt: Dispatch<SetStateAction<string>>;
    webcamPrompt: string;
    setWebcamPrompt: Dispatch<SetStateAction<string>>;
    showGrid: boolean;
    setShowGrid: Dispatch<SetStateAction<boolean>>;
    isStreaming: boolean;
    setIsStreaming: (value: boolean) => void;
    useWebcam: boolean;
    setUseWebcam: (value: boolean) => void;
    enhanceWebcam: boolean;
    setEnhanceWebcam: Dispatch<SetStateAction<boolean>>;
}

export default function Toolbar(props: ToolbarProps) {
    return (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-[1060px]">
            <div className="flex items-center gap-1 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-gray-200/60 dark:border-zinc-700/60 shadow-md py-1 no-scrollbar">
                {/* Drawing Controls */}
                <DrawingControls
                    isDrawingMode={props.isDrawingMode}
                    setIsDrawingMode={props.setIsDrawingMode}
                    activeTool={props.activeTool}
                    setActiveTool={props.setActiveTool}
                    brushColor={props.brushColor}
                    setBrushColor={props.setBrushColor}
                    brushWidth={props.brushWidth}
                    setBrushWidth={props.setBrushWidth}
                    brushOpacity={props.brushOpacity}
                    setBrushOpacity={props.setBrushOpacity}
                    handleUndo={props.handleUndo}
                    handleRedo={props.handleRedo}
                    canvasComponentRef={props.canvasComponentRef}
                    aiPrompt={props.aiPrompt}
                    setAiPrompt={props.setAiPrompt}
                    showGrid={props.showGrid}
                    setShowGrid={props.setShowGrid}
                />

                {/* Divider */}
                <span className="h-5 w-px bg-gray-200 dark:bg-zinc-700 mx-1" />

                {/* Streaming Controls */}
                <StreamingControls
                    webcamPrompt={props.webcamPrompt}
                    setWebcamPrompt={props.setWebcamPrompt}
                    isStreaming={props.isStreaming}
                    setIsStreaming={props.setIsStreaming}
                    useWebcam={props.useWebcam}
                    setUseWebcam={props.setUseWebcam}
                    enhanceWebcam={props.enhanceWebcam}
                    setEnhanceWebcam={props.setEnhanceWebcam}
                />
            </div>
        </div>
    );
}
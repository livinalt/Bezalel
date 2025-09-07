"use client";

import React, { Dispatch, SetStateAction, useCallback } from "react";
import DrawingControls from "./DrawingControls";
import StreamingControls from "./StreamingControls";
import { TLEditor } from "@tldraw/tldraw";

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
    canvasComponentRef: React.RefObject<TLEditor>;
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
    saveCanvasState: () => void;
}

function ToolbarComponent(props: ToolbarProps) {
    return (
        <div className="flex items-center gap-1 p-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-gray-200/60 dark:border-zinc-700/60 shadow-md">
            <DrawingControls
                {...props}
            />

            <span className="h-5 w-px bg-gray-200 dark:bg-zinc-700 mx-1" />

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
    );
}

export default React.memo(ToolbarComponent);

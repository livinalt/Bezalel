
"use client";

import { useEffect, useRef } from "react";
import { Editor, Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

interface CanvasProps {
    showGrid: boolean;
    canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    editorRef: React.MutableRefObject<Editor | null>;
    showRulers: boolean;
    aiPrompt: string;
    setAiPrompt: (value: string) => void;
    saveCanvasState: () => void;
}

export default function Canvas({
    showGrid,
    canvasRef,
    editorRef,
    showRulers,
    aiPrompt,
    setAiPrompt,
    saveCanvasState,
}: CanvasProps) {
    return (
        <div className="absolute inset-0 z-[1000]">
            <Tldraw
                onMount={(editor: Editor) => {
                    editorRef.current = editor;
                    editor.setCurrentTool("draw");
                    editor.updateInstanceState({
                        isGridMode: showGrid,
                    });
                    // Ensure canvasRef is linked to tldraw's canvas
                    canvasRef.current = editor.getContainer().querySelector("canvas") || canvasRef.current;
                }}
                onChange={() => {
                    saveCanvasState();
                }}
            >
                <canvas ref={canvasRef} style={{ display: "none" }} />
            </Tldraw>
        </div>
    );
}
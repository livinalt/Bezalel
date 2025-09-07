
"use client";

import { useRef, useEffect } from "react";
import { Tldraw, Editor, TLEditorComponents, DefaultActionsMenu } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import StreamingControls from "./StreamingControls";

interface CanvasProps {
    showGrid: boolean;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    editorRef: React.RefObject<Editor>;
    showRulers: boolean;
    aiPrompt: string;
    setAiPrompt: (value: string) => void;
    saveCanvasState: () => void;
    webcamPrompt: string;
    setWebcamPrompt: (value: string) => void;
    isStreaming: boolean;
    setIsStreaming: (value: boolean) => void;
    useWebcam: boolean;
    setUseWebcam: (value: boolean) => void;
    enhanceWebcam: boolean;
    setEnhanceWebcam: (value: boolean) => void;
}

export default function Canvas({
    showGrid,
    canvasRef,
    editorRef,
    showRulers,
    aiPrompt,
    setAiPrompt,
    saveCanvasState,
    webcamPrompt,
    setWebcamPrompt,
    isStreaming,
    setIsStreaming,
    useWebcam,
    setUseWebcam,
    enhanceWebcam,
    setEnhanceWebcam,
}: CanvasProps) {
    // Helper: Export shape as image dataURL
    const exportShapeAsImage = async (editor: Editor, shapeId: string) => {
        const svg = await editor.getSvg([shapeId]);
        if (!svg) return null;

        const svgString = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        return new Promise<string>((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
                URL.revokeObjectURL(url);
            };
            img.src = url;
        });
    };

    // Helper: Replace shape with enhanced image
    const replaceShapeWithImage = (editor: Editor, shapeId: string, imageUrl: string) => {
        const shape = editor.getShape(shapeId);
        if (!shape) return;

        editor.updateShapes([
            {
                id: shape.id,
                type: "image",
                props: {
                    w: shape.props.w || 200,
                    h: shape.props.h || 200,
                    url: imageUrl,
                },
            },
        ]);
    };

    // Handler: Enhance selected objects
    const handleEnhanceObjects = async () => {
        const editor = editorRef.current;
        if (!editor || !aiPrompt) {
            toast.error("Enter a prompt first");
            return;
        }

        const selectedShapes = editor.getSelectedShapeIds();
        if (selectedShapes.length === 0) {
            toast.error("Select at least one object");
            return;
        }

        try {
            for (const shapeId of selectedShapes) {
                const dataUrl = await exportShapeAsImage(editor, shapeId);
                if (!dataUrl) continue;

                const response = await fetch("https://api.daydream.live/streamdiffusion", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.DAYDREAM_API_KEY}`,
                    },
                    body: JSON.stringify({
                        image: dataUrl,
                        prompt: aiPrompt,
                    }),
                });

                if (!response.ok) throw new Error(`HTTP error ${response.status}`);

                const result = await response.json();
                if (result.enhanced_image_url) {
                    replaceShapeWithImage(editor, shapeId, result.enhanced_image_url);
                }
            }

            saveCanvasState();
            toast.success("Object(s) enhanced!");
        } catch (error: any) {
            console.error("Enhance error:", error);
            toast.error("Failed to enhance objects");
        }
    };

    const components: TLEditorComponents = {
        Cursor: () => null,
        Background: () => (
            <>
                {showRulers && (
                    <>
                        {/* horizontal ruler */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "20px",
                                background: "rgba(0, 0, 0, 0.1)",
                                borderBottom: "1px solid #ccc",
                                zIndex: 10001,
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "0 10px",
                                fontSize: "10px",
                                color: "#666",
                            }}
                        >
                            {[...Array(20)].map((_, i) => (
                                <span key={i} style={{ width: "5%" }}>
                                    {i * 50}
                                </span>
                            ))}
                        </div>
                        {/* vertical ruler */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "20px",
                                height: "100%",
                                background: "rgba(0, 0, 0, 0.1)",
                                borderRight: "1px solid #ccc",
                                zIndex: 10001,
                                writingMode: "vertical-rl",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                padding: "10px 0",
                                fontSize: "10px",
                                color: "#666",
                            }}
                        >
                            {[...Array(10)].map((_, i) => (
                                <span key={i} style={{ height: "10%" }}>
                                    {i * 50}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </>
        ),
        ActionsMenu: (props) => (
            <div className="flex items-center gap-2">
                <DefaultActionsMenu {...props} />
                <div className="flex items-center gap-2">
                    <input
                        title="Object enhancement prompt"
                        placeholder="Object prompt..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 w-40 focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                    <button
                        title="Enhance Selected Objects"
                        disabled={!aiPrompt || !editorRef.current?.getSelectedShapeIds()?.length}
                        onClick={handleEnhanceObjects}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition 
                            ${aiPrompt && editorRef.current?.getSelectedShapeIds()?.length
                                ? "hover:bg-green-50 cursor-pointer"
                                : "opacity-50 cursor-not-allowed"}`}
                    >
                        <Sparkles className="w-4 h-4 text-green-600" />
                    </button>

                    <StreamingControls
                        webcamPrompt={webcamPrompt}
                        setWebcamPrompt={setWebcamPrompt}
                        isStreaming={isStreaming}
                        setIsStreaming={setIsStreaming}
                        useWebcam={useWebcam}
                        setUseWebcam={setUseWebcam}
                        enhanceWebcam={enhanceWebcam}
                        setEnhanceWebcam={setEnhanceWebcam}
                    />
                </div>
            </div>
        ),
    };

    // Use MutationObserver to detect canvas element
    useEffect(() => {
        if (!editorRef.current) return;

        const container = editorRef.current.getContainer();
        const observer = new MutationObserver(() => {
            const canvas = container.querySelector("canvas");
            if (canvas) {
                canvasRef.current = canvas as HTMLCanvasElement;
                console.log("Canvas found and set:", canvas);
                observer.disconnect(); // Stop observing once found
            }
        });

        observer.observe(container, { childList: true, subtree: true });

        // Check immediately in case canvas is already present
        const canvas = container.querySelector("canvas");
        if (canvas) {
            canvasRef.current = canvas as HTMLCanvasElement;
            console.log("Canvas found and set:", canvas);
            observer.disconnect();
        }

        return () => observer.disconnect(); // Cleanup on unmount
    }, [editorRef, canvasRef]);

    return (
        <div className="absolute inset-0 z-[10000]">
            <Tldraw
                persistenceKey="canvas-drawing"
                components={components}
                onMount={(editor: Editor) => {
                    editorRef.current = editor;
                    editor.updateInstanceState({ isGridMode: showGrid });
                    console.log("Tldraw editor mounted:", editor);
                }}
            />
        </div>
    );
}
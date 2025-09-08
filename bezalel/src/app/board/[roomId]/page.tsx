"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";
import { Editor } from "@tldraw/tldraw";
import { Home, Sparkles, Link as LinkIcon, Video } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import StreamManager from "@/components/StreamManager";
import Canvas from "@/components/Canvas";
import LayersPanel from "@/components/LayersPanel";
import StreamingControls from "@/components/StreamingControls";
import { PageData } from "@/components/types";

// Function to generate a short ID (e.g., abc-def-ghi)
const generateShortId = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const segmentLength = 3;
    const segments = 3;
    let id = "";
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segmentLength; j++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (i < segments - 1) id += "-";
    }
    return id;
};

export default function Board() {
    const { roomId } = useParams();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const editorRef = useRef<Editor | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const lastSavedState = useRef<string | null>(null);

    // State declarations
    const initialPage = { id: generateShortId(), name: "Page 1", canvasData: null };
    const [pages, setPages] = useState<PageData[]>([initialPage]);
    const [activePageId, setActivePageId] = useState(initialPage.id);
    const [isStreaming, setIsStreaming] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isDrawingMode, setIsDrawingMode] = useState(true);
    const [activeTool, setActiveTool] = useState("draw");
    const [brushColor, setBrushColor] = useState("#000000");
    const [brushWidth, setBrushWidth] = useState(3);
    const [brushOpacity, setBrushOpacity] = useState(1);
    const [brushType, setBrushType] = useState("pen");
    const [showGrid, setShowGrid] = useState(true);
    const [showRulers, setShowRulers] = useState(false);
    const [streamId, setStreamId] = useState<string | null>(null);
    const [canvasPlaybackUrl, setCanvasPlaybackUrl] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [viewUrl, setViewUrl] = useState<string>("");
    const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
    const [showStreamDetails, setShowStreamDetails] = useState(false);

    const saveCanvasState = useCallback(() => {
        if (!editorRef.current) return;
        const snapshot = editorRef.current.store.getSnapshot();
        const snapshotJSON = JSON.stringify(snapshot);
        if (snapshotJSON === lastSavedState.current) return;
        setPages((prevPages) =>
            prevPages.map((p) => (p.id === activePageId ? { ...p, canvasData: snapshot } : p))
        );
        lastSavedState.current = snapshotJSON;
    }, [activePageId, pages]);

    const handleAddPage = () => {
        const newPage = { id: generateShortId(), name: `Page ${pages.length + 1}`, canvasData: null };
        setPages((prev) => [...prev, newPage]);
        setActivePageId(newPage.id);
        lastSavedState.current = null;
        if (editorRef.current) {
            editorRef.current.history.clear();
            editorRef.current.store.clear();
        }
        saveCanvasState();
    };

    const handleRenamePage = (id: string, newName: string) => {
        if (newName.trim() === "") {
            toast.error("Page name cannot be empty.");
            return;
        }
        setPages((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)));
    };

    const handleDeletePage = (id: string) => {
        if (pages.length === 1) {
            toast.error("Cannot delete the last page.");
            return;
        }
        setPages((prev) => {
            const remaining = prev.filter((p) => p.id !== id);
            if (activePageId === id) {
                setActivePageId(remaining[0].id);
                lastSavedState.current = null;
            }
            return remaining;
        });
    };

    const handleUndo = () => {
        editorRef.current?.history.undo();
        saveCanvasState();
    };

    const handleRedo = () => {
        editorRef.current?.history.redo();
        saveCanvasState();
    };

    // Enhance selected objects with Daydream
    const handleEnhanceObjects = async () => {
        const editor = editorRef.current;
        if (!editor || !aiPrompt) {
            toast.error("Enter a prompt");
            return;
        }
        if (!process.env.NEXT_PUBLIC_DAYDREAM_API_KEY) {
            console.error("DAYDREAM_API_KEY missing");
            toast.error("Configure DAYDREAM_API_KEY");
            return;
        }

        const selected = editor.getSelectedShapeIds();
        if (selected.length === 0) {
            toast.error("Select an object");
            return;
        }

        const futuristicPrompt = `${aiPrompt} in a futuristic, cyberpunk style with neon accents and holographic effects`;
        const activeStreamId = streamId || (await createDaydreamStream());
        if (!activeStreamId) {
            toast.error("Failed to create stream for enhancement");
            return;
        }

        const isStreamActive = await checkStreamStatus(activeStreamId);
        if (!isStreamActive) {
            toast.error("Stream is not active");
            return;
        }

        try {
            for (const shapeId of selected) {
                const dataUrl = await exportShapeAsImage(editor, shapeId);
                if (!dataUrl) {
                    toast.error("Failed to export shape");
                    continue;
                }

                let promptResponse = await fetch(
                    `https://api.daydream.live/beta/streams/${activeStreamId}/prompts`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${process.env.NEXT_PUBLIC_DAYDREAM_API_KEY}`,
                        },
                        body: JSON.stringify({
                            pipeline: "live-video-to-video",
                            model_id: "streamdiffusion",
                            params: {
                                prompt: futuristicPrompt,
                                image: dataUrl,
                                guidance_scale: 7.5,
                                num_inference_steps: 50,
                            },
                        }),
                    }
                );

                if (promptResponse.status === 405) {
                    promptResponse = await fetch(
                        `https://api.daydream.live/beta/streams/${activeStreamId}/prompts`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${process.env.NEXT_PUBLIC_DAYDREAM_API_KEY}`,
                            },
                            body: JSON.stringify({
                                pipeline: "live-video-to-video",
                                model_id: "streamdiffusion",
                                params: {
                                    prompt: futuristicPrompt,
                                    image: dataUrl,
                                    guidance_scale: 7.5,
                                    num_inference_steps: 50,
                                },
                            }),
                        }
                    );
                }

                if (!promptResponse.ok) {
                    const errorText = await promptResponse.text();
                    throw new Error(`Daydream API error: ${errorText}`);
                }

                const result = await promptResponse.json();
                const enhancedImageUrl = result.output_url || `data:image/png;base64,${dataUrl}`;
                replaceShapeWithImage(editor, shapeId, enhancedImageUrl);
            }

            saveCanvasState();
            toast.success("Object(s) enhanced with futuristic style!");
        } catch (error: any) {
            console.error("Enhance error:", error);
            toast.error(`Enhance failed: ${error.message}`);
        }
    };

    // Create Daydream stream
    const createDaydreamStream = async () => {
        if (!process.env.NEXT_PUBLIC_DAYDREAM_API_KEY) {
            console.error("DAYDREAM_API_KEY missing");
            toast.error("Configure DAYDREAM_API_KEY");
            return null;
        }

        try {
            const response = await fetch("https://api.daydream.live/v1/streams", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_DAYDREAM_API_KEY}`,
                },
                body: JSON.stringify({ name: `Canvas Stream ${Date.now()}` }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create stream: ${await response.text()}`);
            }

            const result = await response.json();
            console.log("Stream created:", JSON.stringify(result, null, 2));
            setStreamId(result.id);
            return result.id;
        } catch (error: any) {
            console.error("Create stream error:", error);
            toast.error(`Failed to create stream: ${error.message}`);
            return null;
        }
    };

    // Check stream status
    const checkStreamStatus = async (streamId: string) => {
        if (!process.env.NEXT_PUBLIC_DAYDREAM_API_KEY) {
            console.error("DAYDREAM_API_KEY missing");
            return false;
        }

        try {
            const response = await fetch(`https://api.daydream.live/v1/streams/${streamId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_DAYDREAM_API_KEY}`,
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Stream status check failed (${response.status}):`, errorText);
                return false;
            }
            const result = await response.json();
            console.log("Stream status:", JSON.stringify(result, null, 2));
            return result.status === "active";
        } catch (error) {
            console.error("Stream status error:", error);
            return false;
        }
    };

    // Export shape as image for Daydream
    const exportShapeAsImage = async (editor: Editor, shapeId: string) => {
        const svg = await editor.getSvg([shapeId]);
        if (!svg) {
            console.error("Failed to get SVG for shape:", shapeId);
            return null;
        }
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
                const dataUrl = canvas.toDataURL("image/png");
                resolve(dataUrl.replace(/^data:image\/png;base64,/, ""));
                URL.revokeObjectURL(url);
            };
            img.onerror = () => {
                console.error("Failed to load SVG image");
                resolve(null);
                URL.revokeObjectURL(url);
            };
            img.src = url;
        });
    };

    // Replace shape with enhanced image
    const replaceShapeWithImage = (editor: Editor, shapeId: string, imageUrl: string) => {
        const shape = editor.getShape(shapeId);
        if (!shape) {
            console.error("Shape not found:", shapeId);
            return;
        }
        editor.updateShapes([
            {
                id: shape.id,
                type: "image",
                props: { w: shape.props.w || 200, h: shape.props.h || 200, url: imageUrl },
            },
        ]);
    };

    useEffect(() => {
        if (!editorRef.current) return;
        const handleSelectionChange = () => {
            const selected = editorRef.current?.getSelectedShapeIds() || [];
            setSelectedShapes(selected);
            console.log("Selection updated:", selected);
        };

        editorRef.current.on("change", handleSelectionChange);
        return () => {
            editorRef.current?.off("change", handleSelectionChange);
        };
    }, []);

    useEffect(() => {
        if (!editorRef.current) return;
        const activePage = pages.find((p) => p.id === activePageId);
        if (!activePage) return;

        const snapshotJSON = JSON.stringify(activePage.canvasData);
        if (snapshotJSON === lastSavedState.current) return;

        if (!activePage.canvasData) {
            editorRef.current.history.clear();
            editorRef.current.store.clear();
            lastSavedState.current = null;
            return;
        }

        editorRef.current.store.loadSnapshot(activePage.canvasData);
        lastSavedState.current = snapshotJSON;
    }, [activePageId, pages]);

    useEffect(() => {
        setIsMounted(true);
        if (typeof window !== "undefined") {
            setViewUrl(`${window.location.origin}/board/${roomId}/view`);
        }
    }, [roomId]);

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3001");
        socketRef.current = socket;
        socket.on("connect", () => {
            socket.emit("joinSession", roomId);
        });
        socket.on("viewerCount", (count: number) => {
            setViewerCount(count);
        });
        socket.on("connect_error", () => {
            toast.error("Failed to connect to server. Retrying...");
            setTimeout(() => socket.connect(), 3000);
        });
        return () => {
            socket.disconnect();
        };
    }, [roomId]);

    const copyLink = () => {
        if (!viewUrl) return;
        navigator.clipboard.writeText(viewUrl);
        toast.success("View link copied to clipboard!");
    };

    if (!roomId || typeof roomId !== "string") {
        return <div className="text-red-500">Error: Invalid or missing roomId</div>;
    }

    return (
        <div className="relative w-screen h-screen bg-neutral-100 dark:bg-zinc-900">
            <header className="fixed top-0 left-0 right-0 h-14 z-[9999] flex items-center justify-between px-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                    <Link href="/" title="Back to Home">
                        <Home className="w-5 h-5 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition" />
                    </Link>
                    <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Bezalel Board
                    </h1>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/ {roomId}</span>
                    {streamId && (
                        <button
                            onClick={() => setShowStreamDetails(true)}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                            <Video className="w-5 h-5 inline-block mr-1" />
                            Stream Details
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 z-[10001]" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <input
                            tabIndex={0}
                            title="Object enhancement prompt"
                            placeholder="Object prompt..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 
                         bg-gray-50 dark:bg-zinc-800 border border-gray-200 
                         dark:border-zinc-700 rounded px-2 py-1 w-40 
                         focus:outline-none focus:ring-1 focus:ring-green-400"
                        />
                        <button
                            title="Enhance Selected Objects"
                            disabled={!aiPrompt.trim() || selectedShapes.length === 0}
                            onClick={handleEnhanceObjects}
                            className={`w-8 h-8 flex items-center justify-center rounded-md transition 
                          ${aiPrompt.trim() && selectedShapes.length > 0
                                    ? "hover:bg-green-50 cursor-pointer bg-green-100"
                                    : "opacity-50 cursor-not-allowed"}`}
                        >
                            <Sparkles className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                            title="Copy View Link"
                            onClick={copyLink}
                            className="w-8 h-8 flex items-center justify-center rounded-md transition bg-blue-100 hover:bg-blue-200"
                        >
                            <LinkIcon className="w-4 h-4 text-blue-600" />
                        </button>
                        <StreamingControls
                            isStreaming={isStreaming}
                            setIsStreaming={setIsStreaming}
                        />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 px-2">
                        👀 {viewerCount} viewer{viewerCount === 1 ? "" : "s"}
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="absolute top-14 bottom-0 left-0 right-48 flex">
                <div className="flex-1 relative">
                    <Canvas
                        showGrid={showGrid}
                        canvasRef={canvasRef}
                        editorRef={editorRef}
                        showRulers={showRulers}
                        aiPrompt={aiPrompt}
                        setAiPrompt={setAiPrompt}
                        saveCanvasState={saveCanvasState}
                        isStreaming={isStreaming}
                        setIsStreaming={setIsStreaming}
                        streamId={streamId}
                        setStreamId={setStreamId}
                        setCanvasPlaybackUrl={setCanvasPlaybackUrl}
                    />
                </div>

                <LayersPanel editorRef={editorRef} />

                <div className="z-[10001]">
                    <StreamManager
                        roomId={roomId}
                        setCanvasPlaybackUrl={setCanvasPlaybackUrl}
                        isStreaming={isStreaming}
                        setIsStreaming={setIsStreaming}
                        setStreamId={setStreamId}
                        playbackUrl={canvasPlaybackUrl || ""}
                        showStreamDetails={showStreamDetails}
                        setShowStreamDetails={setShowStreamDetails}
                    />
                </div>
            </main>
        </div>
    );
}
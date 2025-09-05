"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import io, { Socket } from "socket.io-client";
import Canvas from "@/components/Canvas";
import VideoFeed from "@/components/VideoFeed";
import { Canvas as FabricJSCanvas, Object as FabricObject, Path as FabricPath } from "fabric";
import { toast } from "sonner";
import PageSidebar from "@/components/PageSidebar";
import Toolbar from "@/components/Toolbar";
import StreamManager from "@/components/StreamManager";
import { v4 as uuid } from "uuid";
import ThemeToggle from "@/components/ThemeToggle";
import { CanvasData, PageData } from "../../../components/types";

export default function Board() {
    const { roomId } = useParams();

    const canvasRef = useRef<FabricJSCanvas | null>(null);
    const canvasComponentRef = useRef<any>(null);
    const socketRef = useRef<Socket | null>(null);
    const streamManagerRef = useRef<{ handleEnhance: () => Promise<void>; handleCanvasEnhance: () => Promise<void> } | null>(null);
    const lastSavedState = useRef<string | null>(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const [useWebcam, setUseWebcam] = useState(false);
    const [enhanceWebcam, setEnhanceWebcam] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [aiPrompt, setAiPrompt] = useState(""); // For canvas enhancement
    const [webcamPrompt, setWebcamPrompt] = useState(""); // New state for webcam enhancement
    const [isDrawingMode, setIsDrawingMode] = useState(true);
    const [brushColor, setBrushColor] = useState("#000000");
    const [brushWidth, setBrushWidth] = useState(3);
    const [viewUrl, setViewUrl] = useState("");
    const [showGrid, setShowGrid] = useState(true);
    const [streamId, setStreamId] = useState<string | null>(null);
    const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [webcamPlaybackUrl, setWebcamPlaybackUrl] = useState<string | null>(null);
    const [canvasPlaybackUrl, setCanvasPlaybackUrl] = useState<string | null>(null);
    const [isEnhanced, setIsEnhanced] = useState(false);

    const undoStack = useRef<FabricObject[]>([]);
    const redoStack = useRef<FabricObject[]>([]);

    const initialPage = { id: uuid(), name: "Page 1", canvasData: null };
    const [pages, setPages] = useState<PageData[]>([initialPage]);
    const [activePageId, setActivePageId] = useState(initialPage.id);

    const handleAddPage = () => {
        const newPage = { id: uuid(), name: `Page ${pages.length + 1}`, canvasData: null };
        setPages((prev) => [...prev, newPage]);
        setActivePageId(newPage.id);
        lastSavedState.current = null;
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

    const saveCanvasState = useCallback((canvas: FabricJSCanvas, pageId: string) => {
        if (!canvas) return;
        const canvasJSON = canvas.toJSON(["selectable", "id"]);
        const canvasJSONStr = JSON.stringify(canvasJSON);
        if (canvasJSONStr === lastSavedState.current) return;
        setPages((prevPages) => {
            const newPages = prevPages.map((p) =>
                p.id === pageId ? { ...p, canvasData: canvasJSON } : p
            );
            lastSavedState.current = canvasJSONStr;
            console.log("Saved canvas state, objects:", canvas.getObjects());
            return newPages;
        });
    }, []);

    useEffect(() => {
        if (!canvasRef.current) return;

        const handleCanvasChange = () => {
            saveCanvasState(canvasRef.current!, activePageId);
        };

        canvasRef.current.on("object:added", handleCanvasChange);
        canvasRef.current.on("object:modified", handleCanvasChange);
        canvasRef.current.on("object:removed", handleCanvasChange);

        return () => {
            canvasRef.current?.off("object:added", handleCanvasChange);
            canvasRef.current?.off("object:modified", handleCanvasChange);
            canvasRef.current?.off("object:removed", handleCanvasChange);
        };
    }, [activePageId, saveCanvasState]);

    useEffect(() => {
        if (!canvasRef.current) return;

        const activePage = pages.find((p) => p.id === activePageId);
        if (!activePage) return;

        const canvasJSONStr = JSON.stringify(activePage.canvasData);
        if (canvasJSONStr === lastSavedState.current) {
            console.log("Skipping load, state unchanged");
            return;
        }

        if (!activePage.canvasData) {
            console.log("Clearing canvas for new page");
            canvasRef.current.clear();
            undoStack.current = [];
            redoStack.current = [];
            canvasRef.current.renderAll();
            lastSavedState.current = null;
            return;
        }

        canvasRef.current.loadFromJSON(activePage.canvasData, () => {
            undoStack.current = canvasRef.current!.getObjects().slice() as FabricObject[];
            redoStack.current = [];
            canvasRef.current!.renderAll();
            lastSavedState.current = canvasJSONStr;
            console.log("Loaded canvas state, objects:", canvasRef.current!.getObjects());
        });
    }, [activePageId, pages]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setViewUrl(`${window.location.origin}/board/${roomId}/view`);
        }
    }, [roomId]);

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3001");
        socketRef.current = socket;
        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            socket.emit("joinSession", roomId);
        });
        socket.on("viewerCount", (count: number) => {
            console.log("Viewer count:", count);
            setViewerCount(count);
        });
        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            toast.error("Failed to connect to server");
        });
        return () => {
            console.log("Disconnecting socket");
            socket.disconnect();
        };
    }, [roomId]);

    const handlePathCreated = (path: FabricPath) => {
        if (canvasRef.current && path) {
            console.log("Path created in Board:", path);
            canvasRef.current.add(path);
            undoStack.current.push(path as unknown as FabricObject);
            redoStack.current = [];
            canvasRef.current.requestRenderAll();
            saveCanvasState(canvasRef.current, activePageId);
        }
    };

    const handleUndo = () => {
        if (!canvasRef.current) return;
        const last = undoStack.current.pop();
        if (last) {
            redoStack.current.push(last);
            canvasRef.current.remove(last);
            canvasRef.current.requestRenderAll();
            saveCanvasState(canvasRef.current, activePageId);
        }
    };

    const handleRedo = () => {
        if (!canvasRef.current) return;
        const last = redoStack.current.pop();
        if (last) {
            undoStack.current.push(last);
            canvasRef.current.add(last);
            canvasRef.current.requestRenderAll();
            saveCanvasState(canvasRef.current, activePageId);
        }
    };

    const copyLink = () => {
        if (!viewUrl) return;
        navigator.clipboard.writeText(viewUrl);
        toast.success("View link copied to clipboard!");
    };

    const handleCanvasEnhance = () => {
        streamManagerRef.current?.handleCanvasEnhance();
    };

    if (!roomId || typeof roomId !== "string") {
        return <div className="text-red-500">Error: Invalid or missing roomId</div>;
    }

    return (
        <div className="relative w-screen h-screen bg-neutral-100 dark:bg-zinc-900">
            <header className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                    <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Bezalel Board</h1>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/ {roomId}</span>
                    {streamId && <p className="text-xs text-gray-500">Stream ID: {streamId}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={viewUrl}
                        readOnly
                        className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1 w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        aria-label="view link"
                    />
                    <button
                        onClick={copyLink}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
                    >
                        Copy
                    </button>
                    <div className="text-xs text-gray-600 dark:text-gray-400 px-2">
                        👀 {viewerCount} viewer{viewerCount === 1 ? "" : "s"}
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="absolute top-14 bottom-0 left-0 right-0 flex">
                <PageSidebar
                    pages={pages}
                    activePageId={activePageId}
                    onSelectPage={setActivePageId}
                    onAddPage={handleAddPage}
                    onRenamePage={handleRenamePage}
                    onDeletePage={handleDeletePage}
                />

                <div className="flex-1 flex items-center justify-center">
                    <Canvas
                        ref={canvasComponentRef}
                        isDrawingMode={isDrawingMode}
                        setCanvasRef={(c) => (canvasRef.current = c)}
                        onPathCreated={handlePathCreated}
                        width={1920}
                        height={1080}
                        brushColor={brushColor}
                        brushWidth={brushWidth}
                        showGrid={showGrid}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                </div>

                <StreamManager
                    ref={streamManagerRef}
                    isStreaming={isStreaming}
                    useWebcam={useWebcam}
                    enhanceWebcam={enhanceWebcam}
                    aiPrompt={aiPrompt}
                    webcamPrompt={webcamPrompt} // Pass new webcam prompt
                    roomId={roomId}
                    socketRef={socketRef}
                    canvasRef={canvasRef}
                    setStreamId={setStreamId}
                    webcamStream={webcamStream}
                    setWebcamPlaybackUrl={setWebcamPlaybackUrl}
                    setIsEnhanced={setIsEnhanced}
                    setCanvasPlaybackUrl={setCanvasPlaybackUrl}
                />

                <VideoFeed
                    useWebcam={useWebcam}
                    setUseWebcam={setUseWebcam}
                    isMuted={isMuted}
                    setIsMuted={setIsMuted}
                    onStreamChange={setWebcamStream}
                    isEnhanced={isEnhanced}
                    enhanceWebcam={enhanceWebcam}
                    webcamPlaybackUrl={webcamPlaybackUrl}
                    canvasPlaybackUrl={canvasPlaybackUrl}
                />
            </main>

            <Toolbar
                isDrawingMode={isDrawingMode}
                setIsDrawingMode={setIsDrawingMode}
                brushColor={brushColor}
                setBrushColor={setBrushColor}
                brushWidth={brushWidth}
                setBrushWidth={setBrushWidth}
                handleUndo={handleUndo}
                handleRedo={handleRedo}
                canvasComponentRef={canvasComponentRef}
                aiPrompt={aiPrompt}
                setAiPrompt={setAiPrompt}
                webcamPrompt={webcamPrompt} // Pass new webcam prompt
                setWebcamPrompt={setWebcamPrompt} // Pass setter for webcam prompt
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                isStreaming={isStreaming}
                setIsStreaming={setIsStreaming}
                handleCanvasEnhance={handleCanvasEnhance}
                useWebcam={useWebcam}
                setUseWebcam={setUseWebcam}
                enhanceWebcam={enhanceWebcam}
                setEnhanceWebcam={setEnhanceWebcam}
            />
        </div>
    );
}
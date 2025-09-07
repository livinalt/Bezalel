
"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { useParams } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import ThemeToggle from "@/components/ThemeToggle";
// import Toolbar from "@/components/Toolbar";
import VideoFeed from "@/components/VideoFeed";
import StreamManager from "@/components/StreamManager";
// import PageSidebar from "@/components/PageSidebar";
import Canvas from "@/components/Canvas";
import LayersPanel from "@/components/LayersPanel";
import { PageData } from "@/components/types";
import { Rnd } from "react-rnd";

const MemoizedVideoFeed = memo(VideoFeed);

export default function Board() {
    const { roomId } = useParams();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const editorRef = useRef<Editor | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const lastSavedState = useRef<string | null>(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const [useWebcam, setUseWebcam] = useState(true);
    const [enhanceWebcam, setEnhanceWebcam] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [aiPrompt, setAiPrompt] = useState("");
    const [webcamPrompt, setWebcamPrompt] = useState("");
    const [isDrawingMode, setIsDrawingMode] = useState(true);
    const [activeTool, setActiveTool] = useState("draw");
    const [brushColor, setBrushColor] = useState("#000000");
    const [brushWidth, setBrushWidth] = useState(3);
    const [brushOpacity, setBrushOpacity] = useState(1);
    const [brushType, setBrushType] = useState("pen");
    const [showGrid, setShowGrid] = useState(true);
    const [showRulers, setShowRulers] = useState(false);
    const [streamId, setStreamId] = useState<string | null>(null);
    const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [canvasPlaybackUrl, setCanvasPlaybackUrl] = useState<string | null>(null);
    const [webcamPlaybackUrl, setWebcamPlaybackUrl] = useState<string | null>(null);
    const [isEnhanced, setIsEnhanced] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [rndPosition, setRndPosition] = useState({ x: 20, y: 20 });
    const [viewUrl, setViewUrl] = useState<string>(""); // Ensure viewUrl is initialized

    const initialPage = { id: uuid(), name: "Page 1", canvasData: null };
    const [pages, setPages] = useState<PageData[]>([initialPage]);
    const [activePageId, setActivePageId] = useState(initialPage.id);

    const handleStreamChange = useCallback((stream: MediaStream | null) => {
        setWebcamStream(stream);
    }, []);

    const handleAddPage = () => {
        const newPage = { id: uuid(), name: `Page ${pages.length + 1}`, canvasData: null };
        setPages((prev) => [...prev, newPage]);
        setActivePageId(newPage.id);
        lastSavedState.current = null;
        if (editorRef.current) {
            editorRef.current.history.clear();
            editorRef.current.store.clear();
        }
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

    const saveCanvasState = useCallback(() => {
        if (!editorRef.current) return;
        const snapshot = editorRef.current.store.getSnapshot();
        const snapshotJSON = JSON.stringify(snapshot);
        if (snapshotJSON === lastSavedState.current) return;
        setPages((prevPages) =>
            prevPages.map((p) => (p.id === activePageId ? { ...p, canvasData: snapshot } : p))
        );
        lastSavedState.current = snapshotJSON;
    }, [activePageId]);

    const handleUndo = () => {
        editorRef.current?.history.undo();
        saveCanvasState();
    };

    const handleRedo = () => {
        editorRef.current?.history.redo();
        saveCanvasState();
    };

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
            setRndPosition({
                x: Math.max(20, window.innerWidth - 340),
                y: Math.max(20, window.innerHeight - 250),
            });
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

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (socketRef.current) {
            timeout = setTimeout(() => {
                socketRef.current?.emit("playbackInfo", {
                    canvasPlaybackUrl,
                    webcamPlaybackUrl,
                    roomId,
                });
            }, 500);
        }
        return () => clearTimeout(timeout);
    }, [canvasPlaybackUrl, webcamPlaybackUrl, roomId]);

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
                    <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Bezalel Board
                    </h1>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/ {roomId}</span>
                    {streamId && <p className="text-xs text-gray-500">Stream ID: {streamId}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={viewUrl || ""} // Fallback to empty string to prevent undefined error
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

            <main className="absolute top-14 bottom-0 left-0 right-48 flex">
                
                <div className="flex-1 relative">
                    <Canvas
                        roomId={roomId}
                        showGrid={showGrid}
                        showRulers={showRulers}
                        canvasRef={canvasRef}
                        editorRef={editorRef}
                        brushColor={brushColor}
                        brushWidth={brushWidth}
                        brushOpacity={brushOpacity}
                        activeTool={activeTool}
                        isDrawingMode={isDrawingMode}
                        brushType={brushType}
                    />
                </div>

                <LayersPanel editorRef={editorRef} />

                <StreamManager
                    isStreaming={isStreaming}
                    useWebcam={useWebcam}
                    enhanceWebcam={enhanceWebcam}
                    aiPrompt={aiPrompt}
                    webcamPrompt={webcamPrompt}
                    roomId={roomId}
                    socketRef={socketRef}
                    canvasRef={canvasRef}
                    setStreamId={setStreamId}
                    webcamStream={webcamStream}
                    setCanvasPlaybackUrl={setCanvasPlaybackUrl}
                    setWebcamPlaybackUrl={setWebcamPlaybackUrl}
                    setIsEnhanced={setIsEnhanced}
                    setIsStreaming={setIsStreaming}
                />
            </main>


            {isMounted && (
                <Rnd
                    default={{
                        x: rndPosition.x,
                        y: rndPosition.y,
                        width: 320,
                        height: 240,
                    }}
                    minWidth={200}
                    minHeight={150}
                    bounds="window"
                    dragHandleClassName="video-drag-handle"
                    className="z-[9999] shadow-lg rounded-lg overflow-hidden bg-black"
                >
                    <div className="video-drag-handle cursor-move bg-gray-800 text-white text-xs px-2 py-1">
                        Camera
                    </div>
                    <MemoizedVideoFeed
                        useWebcam={useWebcam}
                        setUseWebcam={setUseWebcam}
                        isMuted={isMuted}
                        setIsMuted={setIsMuted}
                        onStreamChange={handleStreamChange}
                        isEnhanced={isEnhanced}
                        enhanceWebcam={enhanceWebcam}
                        webcamPlaybackUrl={webcamPlaybackUrl}
                    />
                </Rnd>
            )}
        </div>
    );
}
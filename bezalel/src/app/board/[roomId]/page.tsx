"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { debounce } from "lodash";
import Canvas from "@/components/Canvas";
import { Canvas as FabricJSCanvas, Object as FabricObject, Path as FabricPath } from "fabric";
import { toast } from "sonner";
import { Pencil, Hand, Undo2, Redo2, Sparkles, Monitor, Grid, ZoomIn, ZoomOut } from "lucide-react";
import PageSidebar from "@/components/PageSidebar";
import { v4 as uuid } from "uuid";
import ThemeToggle from "@/components/ThemeToggle";

type PageData = {
    id: string;
    name: string;
    canvasData: any | null;
};

export default function Board() {
    const { roomId } = useParams();
    const canvasRef = useRef<FabricJSCanvas | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasComponentRef = useRef<any>(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isDrawingMode, setIsDrawingMode] = useState(true);
    const [brushColor, setBrushColor] = useState("#000000");
    const [brushWidth, setBrushWidth] = useState(3);
    const [viewUrl, setViewUrl] = useState("");
    const [showGrid, setShowGrid] = useState(true);

    const undoStack = useRef<FabricObject[]>([]);
    const redoStack = useRef<FabricObject[]>([]);

    const [pages, setPages] = useState<PageData[]>([{ id: uuid(), name: "Page 1", canvasData: null }]);
    const [activePageId, setActivePageId] = useState(pages[0].id);

    // --- Page management ---
    const handleAddPage = () => {
        const newPage = { id: uuid(), name: `Page ${pages.length + 1}`, canvasData: null };
        setPages((prev) => [...prev, newPage]);
        setActivePageId(newPage.id);
    };

    const handleRenamePage = (id: string, newName: string) => {
        if (newName.trim() === '') return;
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
            }
            return remaining;
        });
    };

    // --- Save canvas state ---
    const saveCanvasState = debounce((canvas: FabricJSCanvas, pageId: string) => {
        setPages((prevPages) =>
            prevPages.map((p) =>
                p.id === pageId ? { ...p, canvasData: canvas.toJSON(['selectable', 'id']) } : p
            )
        );
    }, 500);

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
    }, [activePageId]);

    // --- Load page canvas ---
    useEffect(() => {
        if (!canvasRef.current) return;

        const activePage = pages.find((p) => p.id === activePageId);
        if (!activePage) return;

        // Clear canvas and reset stacks
        canvasRef.current.clear();
        undoStack.current = [];
        redoStack.current = [];

        // Load page data
        if (activePage.canvasData) {
            canvasRef.current.loadFromJSON(activePage.canvasData, () => {
                canvasRef.current!.renderAll();
            });
        } else {
            canvasRef.current.renderAll();
        }
    }, [activePageId]);

    // --- Safe window usage ---
    useEffect(() => {
        if (typeof window !== "undefined") {
            setViewUrl(`${window.location.origin}/board/${roomId}/view`);
        }
    }, [roomId]);

    // --- Socket.io setup ---
    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3000");
        socketRef.current = socket;
        socket.on("connect", () => socket.emit("joinSession", roomId));
        socket.on("viewerCount", (count: number) => setViewerCount(count));
        return () => socket.disconnect();
    }, [roomId]);

    // --- WebRTC streaming ---
    useEffect(() => {
        if (!isStreaming || !canvasRef.current || !videoRef.current) return;
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        pcRef.current = pc;

        const canvasElement = (canvasRef.current as any).lowerCanvasEl ?? (canvasRef.current as any).getElement?.();
        if (!canvasElement || typeof canvasElement.captureStream !== "function") {
            toast.error("Streaming not supported: unable to capture canvas stream.");
            return;
        }

        const canvasStream = canvasElement.captureStream(30);
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((webcamStream) => {
                const combined = new MediaStream();
                canvasStream.getVideoTracks().forEach((t) => combined.addTrack(t));
                webcamStream.getVideoTracks().forEach((t) => combined.addTrack(t));
                webcamStream.getAudioTracks().forEach((t) => combined.addTrack(t));
                combined.getTracks().forEach((t) => pc.addTrack(t, combined));
                videoRef.current!.srcObject = combined;
            })
            .catch(() => {
                toast.error("Could not access webcam — streaming canvas only.");
                canvasStream.getTracks().forEach((t) => pc.addTrack(t, canvasStream));
            });

        pc.onicecandidate = (ev) => {
            if (ev.candidate) socketRef.current?.emit("ice-candidate", { sessionId: roomId, candidate: ev.candidate });
        };

        socketRef.current?.on("answer", async (answer: RTCSessionDescriptionInit) => {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socketRef.current?.on("ice-candidate", async (candidate: RTCIceCandidateInit) => {
            if (pcRef.current) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        });

        pc.createOffer().then((offer) => {
            pc.setLocalDescription(offer);
            socketRef.current?.emit("offer", { sessionId: roomId, offer });
        });

        return () => {
            pc.close();
            if (videoRef.current) videoRef.current.srcObject = null;
        };
    }, [isStreaming, roomId]);

    // --- Path / undo stack ---
    const handlePathCreated = (path: FabricPath) => {
        if (canvasRef.current && path) {
            undoStack.current.push(path as unknown as FabricObject);
            redoStack.current = [];
            saveCanvasState(canvasRef.current, activePageId);
        }
    };

    const handleUndo = () => {
        if (!canvasRef.current) return;
        const last = undoStack.current.pop();
        if (last) {
            redoStack.current.push(last);
            canvasRef.current.remove(last);
            canvasRef.current.requestRenderAll?.();
            saveCanvasState(canvasRef.current, activePageId);
        }
    };

    const handleRedo = () => {
        if (!canvasRef.current) return;
        const last = redoStack.current.pop();
        if (last) {
            undoStack.current.push(last);
            canvasRef.current.add(last);
            canvasRef.current.requestRenderAll?.();
            saveCanvasState(canvasRef.current, activePageId);
        }
    };

    const handleEnhance = () => toast.info("AI enhancement not implemented yet.");

    const copyLink = () => {
        if (!viewUrl) return;
        navigator.clipboard.writeText(viewUrl);
        toast.success("View link copied to clipboard!");
    };

    return (
        <div className="relative w-screen h-screen bg-neutral-100 dark:bg-zinc-900">
            <header className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                    <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Bezalel Board</h1>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/ {roomId}</span>
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

                <div className="flex-1 flex items-center justify-center overflow-auto">
                    <Canvas
                        ref={canvasComponentRef}
                        isDrawingMode={isDrawingMode}
                        setCanvasRef={(c) => (canvasRef.current = c)}
                        onPathCreated={handlePathCreated}
                        width={5000}
                        height={3500}
                        brushColor={brushColor}
                        brushWidth={brushWidth}
                        showGrid={showGrid}
                    />
                </div>

                {isStreaming && (
                    <aside className="w-64 p-3 border-l border-gray-100 bg-white/60 dark:bg-zinc-800/60">
                        <video ref={videoRef as any} autoPlay muted className="w-full h-40 rounded-md object-cover" />
                    </aside>
                )}
            </main>

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 rounded-lg bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md border border-gray-200 dark:border-zinc-700 shadow-md px-2 py-2">
                    <button
                        title={isDrawingMode ? "Drawing" : "Pan"}
                        onClick={() => setIsDrawingMode((s) => !s)}
                        className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition ${isDrawingMode ? "bg-gray-100 dark:bg-zinc-700" : ""}`}
                    >
                        {isDrawingMode ? <Pencil className="w-4 h-4 text-gray-800 dark:text-gray-200" /> : <Hand className="w-4 h-4 text-gray-800 dark:text-gray-200" />}
                    </button>

                    <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-7 h-7 rounded-md border border-gray-200 dark:border-zinc-700" title="Brush color" />
                    <input type="range" min={1} max={40} value={brushWidth} onChange={(e) => setBrushWidth(Number(e.target.value))} className="w-24 accent-blue-500" title="Brush size" />

                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-2" />

                    <button title="Undo" onClick={handleUndo} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700">
                        <Undo2 className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                    </button>
                    <button title="Redo" onClick={handleRedo} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700">
                        <Redo2 className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                    </button>

                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-2" />

                    <button title="Zoom Out" onClick={() => canvasComponentRef.current?.zoomOut()} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700">
                        <ZoomOut className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                    </button>
                    <button title="Zoom In" onClick={() => canvasComponentRef.current?.zoomIn()} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700">
                        <ZoomIn className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                    </button>

                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-2" />

                    <input
                        title="AI prompt"
                        placeholder="AI prompt"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-md px-2 py-1 w-44 focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                    <button title="Enhance" onClick={handleEnhance} className="p-2 rounded-md hover:bg-green-50">
                        <Sparkles className="w-4 h-4 text-green-600" />
                    </button>

                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-2" />

                    <button
                        title="Toggle grid"
                        onClick={() => setShowGrid((s) => !s)}
                        className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition ${showGrid ? "bg-gray-100 dark:bg-zinc-700" : ""}`}
                    >
                        <Grid className={`w-4 h-4 ${showGrid ? "text-gray-800 dark:text-gray-200" : "text-gray-500 dark:text-zinc-400"}`} />
                    </button>

                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-2" />

                    <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isStreaming}
                            onChange={(e) => setIsStreaming(e.target.checked)}
                            className="w-4 h-4 accent-blue-500"
                        />
                        <Monitor className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    </label>
                </div>
            </div>
        </div>
    );
}